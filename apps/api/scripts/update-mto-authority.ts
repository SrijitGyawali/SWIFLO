/**
 * update-mto-authority.ts
 * Updates the mto_authority stored in the remittance pool PDA.
 * Run from apps/api after rebuilding and upgrading the pool program:
 *   npx tsx scripts/update-mto-authority.ts
 */
import 'dotenv/config'
import {
  Connection, Keypair, PublicKey,
  Transaction, TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import crypto from 'crypto'

const RPC        = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const PROGRAM_ID = new PublicKey('GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ')
const NEW_MTO    = new PublicKey('8ZbUfJGtB99uL7jgPxcGAwNehMu6uqiXXVi4Q6hn5We')

const DISC = Buffer.from(
  crypto.createHash('sha256').update('global:update_mto_authority').digest()
).slice(0, 8)

async function main() {
  const secret = process.env.FAUCET_SECRET_KEY
  if (!secret) throw new Error('FAUCET_SECRET_KEY not set')
  const authority = Keypair.fromSecretKey(Buffer.from(JSON.parse(secret)))

  console.log('Authority  :', authority.publicKey.toBase58())
  console.log('New MTO    :', NEW_MTO.toBase58())

  const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], PROGRAM_ID)

  const data = Buffer.alloc(8 + 32)
  DISC.copy(data, 0)
  NEW_MTO.toBuffer().copy(data, 8)

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    data,
    keys: [
      { pubkey: poolPda,              isSigner: false, isWritable: true  },
      { pubkey: authority.publicKey,  isSigner: true,  isWritable: false },
    ],
  })

  const connection = new Connection(RPC, 'confirmed')
  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [authority])
  console.log('\n✅  mto_authority updated!')
  console.log('   Tx:', sig)
}

main().catch(err => { console.error(err); process.exit(1) })
