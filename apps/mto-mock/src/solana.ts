import {
  Connection, Keypair, PublicKey,
  Transaction, TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import fs from 'fs'

export const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
  'confirmed'
)

const PROGRAM_ID = new PublicKey(
  process.env.REMITTANCE_POOL_PROGRAM_ID ?? 'GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ'
)

// SHA256("global:confirm_disbursement")[0:8]
const CONFIRM_DISC = Buffer.from([157, 26, 17, 151, 82, 205, 12, 37])

export function loadMtoKeypair(): Keypair {
  const path = process.env.MTO_SIGNING_KEYPAIR_PATH ?? './keys/mto-signer.json'
  if (!fs.existsSync(path)) {
    console.warn(`[mto] Keypair not found at ${path} — generating ephemeral keypair for dev`)
    return Keypair.generate()
  }
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(path, 'utf-8'))))
}

export async function confirmDisbursementOnChain(
  onChainTransferId: string,
  mtoReference: string,
  mtoKeypair: Keypair
): Promise<string> {
  const transferIdBigInt = BigInt(onChainTransferId)

  const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], PROGRAM_ID)

  const seqBuf = Buffer.alloc(8)
  seqBuf.writeBigUInt64LE(transferIdBigInt)
  const [transferPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('transfer'), seqBuf],
    PROGRAM_ID
  )

  // data = discriminator(8) + transfer_id u64 LE(8) + mto_reference string(4+N)
  const refBytes = Buffer.from(mtoReference, 'utf-8')
  const data = Buffer.alloc(8 + 8 + 4 + refBytes.length)
  CONFIRM_DISC.copy(data, 0)
  data.writeBigUInt64LE(transferIdBigInt, 8)
  data.writeUInt32LE(refBytes.length, 16)
  refBytes.copy(data, 20)

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    data,
    keys: [
      { pubkey: poolPda,              isSigner: false, isWritable: false },
      { pubkey: transferPda,          isSigner: false, isWritable: true  },
      { pubkey: mtoKeypair.publicKey, isSigner: true,  isWritable: false },
    ],
  })

  const tx = new Transaction().add(ix)
  const sig = await sendAndConfirmTransaction(connection, tx, [mtoKeypair], { commitment: 'confirmed' })
  console.log(`[mto-solana] confirmDisbursement on-chain: ${sig}`)
  return sig
}
