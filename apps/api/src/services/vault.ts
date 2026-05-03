import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const RPC                  = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const VAULT_PROGRAM_ID     = new PublicKey(process.env.LIQUIDITY_VAULT_PROGRAM_ID ?? '13BEbXJJ2aLQ6yMQA9QdtwguL2rDKdzsVBZNEbATwBhN')
const POOL_PROGRAM_ID      = new PublicKey(process.env.REMITTANCE_POOL_PROGRAM_ID ?? 'GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ')
const SWI_MINT             = new PublicKey(process.env.TEST_USDC_MINT ?? '2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx')
const VAULT_SWI            = new PublicKey(process.env.VAULT_SWI ?? '3QpTAYX47hVjeL8WG7R8VoF5QncwZnA6ak4jEPUiDBtw')
const POOL_SWI             = new PublicKey(process.env.NEXT_PUBLIC_POOL_USDC ?? '8TrLtU1frZ8xmp8oJPmht3xwsuT2CqJzWjo3wbAW9JK3')

// SHA256("global:advance_to_mto")[0:8]
const ADVANCE_DISC = Buffer.from([109, 215, 229, 111, 172, 161, 73, 69])

// SHA256("global:settle_transfer")[0:8]
const SETTLE_DISC  = Buffer.from([198, 182, 245, 201, 195, 254, 31, 253])

const connection = new Connection(RPC, 'confirmed')

function loadAuthorityKeypair(): Keypair {
  const raw = process.env.FAUCET_SECRET_KEY
  if (!raw) throw new Error('FAUCET_SECRET_KEY not set')
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(raw)))
}

export async function advanceToMTO(transferId: bigint, amount: bigint): Promise<string> {
  const authority = loadAuthorityKeypair()
  const mtoAuthority = new PublicKey(process.env.MTO_AUTHORITY ?? '')

  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], VAULT_PROGRAM_ID)
  const mtoSwi = await getAssociatedTokenAddress(SWI_MINT, mtoAuthority)

  const tx = new Transaction()

  // Create MTO's SWI token account if it doesn't exist
  const mtoSwiInfo = await connection.getAccountInfo(mtoSwi)
  if (!mtoSwiInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      authority.publicKey, mtoSwi, mtoAuthority, SWI_MINT,
      TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    ))
  }

  // advance_to_mto data: discriminator(8) + transfer_id u64 LE(8) + amount u64 LE(8)
  const data = Buffer.alloc(24)
  ADVANCE_DISC.copy(data, 0)
  data.writeBigUInt64LE(transferId, 8)
  data.writeBigUInt64LE(amount, 16)

  tx.add(new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    data,
    keys: [
      { pubkey: vaultPda,            isSigner: false, isWritable: true  },
      { pubkey: authority.publicKey, isSigner: true,  isWritable: false },
      { pubkey: VAULT_SWI,           isSigner: false, isWritable: true  },
      { pubkey: mtoSwi,              isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
    ],
  }))

  const sig = await sendAndConfirmTransaction(connection, tx, [authority], { commitment: 'confirmed' })
  console.log(`[vault] advance_to_mto tx: ${sig}`)
  return sig
}

export async function settleTransfer(onChainTransferId: bigint): Promise<string> {
  const authority = loadAuthorityKeypair()

  const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], POOL_PROGRAM_ID)

  const seqBuf = Buffer.alloc(8)
  seqBuf.writeBigUInt64LE(onChainTransferId)
  const [transferPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('transfer'), seqBuf],
    POOL_PROGRAM_ID
  )

  // settle_transfer data: discriminator(8) + transfer_id u64 LE(8)
  const data = Buffer.alloc(16)
  SETTLE_DISC.copy(data, 0)
  data.writeBigUInt64LE(onChainTransferId, 8)

  const ix = new TransactionInstruction({
    programId: POOL_PROGRAM_ID,
    data,
    keys: [
      { pubkey: poolPda,             isSigner: false, isWritable: false },
      { pubkey: transferPda,         isSigner: false, isWritable: true  },
      { pubkey: authority.publicKey, isSigner: true,  isWritable: false },
      { pubkey: POOL_SWI,            isSigner: false, isWritable: true  },
      { pubkey: VAULT_SWI,           isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
    ],
  })

  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [authority], { commitment: 'confirmed' })
  console.log(`[vault] settle_transfer tx: ${sig}`)
  return sig
}
