/**
 * setup-pool.ts
 *
 * Finds (or creates) the remittance pool's USDC token account on Solana Devnet,
 * and optionally initializes the pool if it hasn't been set up yet.
 *
 * Run from apps/api:
 *   npx tsx scripts/setup-pool.ts
 *
 * Outputs the value to paste into apps/web/.env:
 *   NEXT_PUBLIC_POOL_USDC=<address>
 */

import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import fs from 'fs'
import os from 'os'
import path from 'path'

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC         = process.env.SOLANA_RPC_URL ?? clusterApiUrl('devnet')
const PROGRAM_ID  = new PublicKey('GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ')
const USDC_MINT   = new PublicKey(process.env.USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const TOKEN_PROG  = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

// Pool init discriminator from IDL
const INIT_DISC   = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadWallet(): Keypair {
  const walletPath = process.env.ANCHOR_WALLET
    ?? path.join(os.homedir(), '.config', 'solana', 'id.json')
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet not found at ${walletPath}. Run: solana-keygen new`)
  }
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8'))))
}

/** Create a plain SPL token account owned by `owner` without @solana/spl-token */
async function createTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const accountKeypair = Keypair.generate()
  const lamports = await connection.getMinimumBalanceForRentExemption(165)

  // SystemProgram.createAccount
  const createIx = SystemProgram.createAccount({
    fromPubkey:  payer.publicKey,
    newAccountPubkey: accountKeypair.publicKey,
    space:       165,
    lamports,
    programId:   TOKEN_PROG,
  })

  // Token program InitializeAccount instruction (discriminator = 1)
  const initData = Buffer.alloc(1)
  initData.writeUInt8(1, 0)
  const initIx = new TransactionInstruction({
    programId: TOKEN_PROG,
    data: initData,
    keys: [
      { pubkey: accountKeypair.publicKey, isSigner: false, isWritable: true },
      { pubkey: mint,                     isSigner: false, isWritable: false },
      { pubkey: owner,                    isSigner: false, isWritable: false },
      { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
    ],
  })

  const tx = new Transaction().add(createIx, initIx)
  await sendAndConfirmTransaction(connection, tx, [payer, accountKeypair], { commitment: 'confirmed' })
  return accountKeypair.publicKey
}

/** Call remittance pool initialize instruction */
async function initializePool(
  connection: Connection,
  payer: Keypair,
  poolPda: PublicKey,
  poolUsdc: PublicKey,
): Promise<void> {
  // data = discriminator(8) + fee_bps as u16 LE (2)
  const data = Buffer.alloc(10)
  INIT_DISC.copy(data, 0)
  data.writeUInt16LE(40, 8) // 40 bps = 0.4%

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    data,
    keys: [
      { pubkey: poolPda,                   isSigner: false, isWritable: true  },
      { pubkey: payer.publicKey,           isSigner: true,  isWritable: true  },
      { pubkey: payer.publicKey,           isSigner: false, isWritable: false }, // mto_authority = authority for now
      { pubkey: SystemProgram.programId,   isSigner: false, isWritable: false },
    ],
  })

  const tx = new Transaction().add(ix)
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: 'confirmed' })
  console.log('  Pool initialized:', sig)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const connection = new Connection(RPC, 'confirmed')
  const authority  = loadWallet()

  console.log('Authority :', authority.publicKey.toBase58())
  console.log('Program   :', PROGRAM_ID.toBase58())

  const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], PROGRAM_ID)
  console.log('Pool PDA  :', poolPda.toBase58())

  // ── Check if pool is already initialized ───────────────────────────────────
  const poolInfo = await connection.getAccountInfo(poolPda)

  if (!poolInfo) {
    console.log('\nPool not initialized yet — setting up now...')

    console.log('  Creating pool USDC token account...')
    const poolUsdc = await createTokenAccount(connection, authority, USDC_MINT, poolPda)
    console.log('  pool_usdc :', poolUsdc.toBase58())

    console.log('  Calling initialize...')
    await initializePool(connection, authority, poolPda, poolUsdc)

    console.log('\n✅  Done. Add to apps/web/.env:')
    console.log(`    NEXT_PUBLIC_POOL_USDC=${poolUsdc.toBase58()}`)
    return
  }

  // ── Pool exists — find its USDC token account ──────────────────────────────
  console.log('\nPool already initialized. Looking up pool_usdc...')

  const tokenAccounts = await connection.getTokenAccountsByOwner(
    poolPda,
    { mint: USDC_MINT },
    'confirmed',
  )

  if (tokenAccounts.value.length > 0) {
    const poolUsdc = tokenAccounts.value[0].pubkey.toBase58()
    console.log('\n✅  Add to apps/web/.env:')
    console.log(`    NEXT_PUBLIC_POOL_USDC=${poolUsdc}`)
    return
  }

  // ── Pool exists but no USDC token account — create one ─────────────────────
  console.log('  No USDC token account found for pool PDA — creating one...')
  const poolUsdc = await createTokenAccount(connection, authority, USDC_MINT, poolPda)

  console.log('\n✅  Add to apps/web/.env:')
  console.log(`    NEXT_PUBLIC_POOL_USDC=${poolUsdc.toBase58()}`)
}

main().catch(err => { console.error(err); process.exit(1) })
