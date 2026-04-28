/**
 * create-swi-token.ts
 *
 * Creates the SWI token mint (6 decimals, Metaplex metadata) with faucet wallet
 * as mint authority. Also creates the pool's token account for this mint.
 *
 * Run once from apps/api:
 *   npx tsx scripts/create-swi-token.ts
 *
 * Then copy the printed values into apps/api/.env and apps/web/.env
 *
 * NOTE: Push apps/web/public/swi-logo.png and swi-metadata.json to GitHub first
 *       so the metadata image URL is publicly accessible.
 */

import {
  clusterApiUrl, Connection, Keypair, PublicKey,
  SystemProgram, Transaction, TransactionInstruction, sendAndConfirmTransaction,
} from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createFungible, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { keypairIdentity, percentAmount, generateSigner } from '@metaplex-foundation/umi'
import { fromWeb3JsKeypair, toWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import fs from 'fs'
import os from 'os'
import path from 'path'

const RPC        = process.env.SOLANA_RPC_URL ?? clusterApiUrl('devnet')
const PROGRAM_ID = new PublicKey('GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ')
const METADATA_URI = 'https://raw.githubusercontent.com/SrijitGyawali/SWIFLO/main/apps/web/public/swi-metadata.json'

function loadWallet(): Keypair {
  const p = process.env.ANCHOR_WALLET ?? path.join(os.homedir(), '.config', 'solana', 'id.json')
  if (!fs.existsSync(p)) throw new Error(`Wallet not found at ${p}. Run: solana-keygen new`)
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(p, 'utf-8'))))
}

async function createTokenAccount(
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const kp = Keypair.generate()
  const lamports = await connection.getMinimumBalanceForRentExemption(165)
  const createIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: kp.publicKey,
    space: 165,
    lamports,
    programId: TOKEN_PROGRAM_ID,
  })
  const initIx = new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    data: Buffer.from([1]),
    keys: [
      { pubkey: kp.publicKey,  isSigner: false, isWritable: true },
      { pubkey: mint,          isSigner: false, isWritable: false },
      { pubkey: owner,         isSigner: false, isWritable: false },
      { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
    ],
  })
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(createIx, initIx),
    [payer, kp],
    { commitment: 'confirmed' },
  )
  return kp.publicKey
}

async function main() {
  const web3Wallet = loadWallet()
  const connection  = new Connection(RPC, 'confirmed')
  console.log('Authority :', web3Wallet.publicKey.toBase58())

  // Airdrop SOL if needed
  const bal = await connection.getBalance(web3Wallet.publicKey)
  if (bal < 0.5e9) {
    console.log('Airdropping 2 SOL...')
    const sig = await connection.requestAirdrop(web3Wallet.publicKey, 2e9)
    await connection.confirmTransaction(sig, 'confirmed')
  }

  // Build Umi instance
  const umi = createUmi(RPC)
    .use(mplTokenMetadata())
    .use(keypairIdentity(fromWeb3JsKeypair(web3Wallet)))

  // Create SWI mint with on-chain Metaplex metadata
  const mintSigner = generateSigner(umi)
  console.log('\nCreating SWI token with metadata...')
  await createFungible(umi, {
    mint: mintSigner,
    name: 'SWI',
    symbol: 'SWI',
    uri: METADATA_URI,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 6,
    isMutable: true,
  }).sendAndConfirm(umi)

  const mint = toWeb3JsPublicKey(mintSigner.publicKey)
  console.log('SWI Mint  :', mint.toBase58())

  // Create pool token account for SWI
  const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], PROGRAM_ID)
  console.log('Pool PDA  :', poolPda.toBase58())
  console.log('Creating pool SWI token account...')
  const poolSwi = await createTokenAccount(connection, web3Wallet, mint, poolPda)
  console.log('Pool SWI  :', poolSwi.toBase58())

  // Mint 1,000,000 SWI into faucet wallet
  console.log('Minting 1,000,000 SWI to faucet wallet...')
  const faucetAta = await getOrCreateAssociatedTokenAccount(
    connection, web3Wallet, mint, web3Wallet.publicKey,
  )
  await mintTo(
    connection, web3Wallet, mint, faucetAta.address, web3Wallet.publicKey,
    1_000_000 * 1_000_000, // 1M tokens × 6 decimals
  )
  console.log('Faucet ATA:', faucetAta.address.toBase58())

  console.log('\n✅  Add these to apps/api/.env AND apps/web/.env:\n')
  console.log(`TEST_USDC_MINT=${mint.toBase58()}`)
  console.log(`NEXT_PUBLIC_USDC_MINT=${mint.toBase58()}`)
  console.log(`NEXT_PUBLIC_POOL_USDC=${poolSwi.toBase58()}`)
}

main().catch(err => { console.error(err); process.exit(1) })
