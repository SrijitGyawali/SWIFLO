import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import fs from 'fs'

export const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
  'confirmed'
)

export function loadMtoKeypair(): Keypair {
  const path = process.env.MTO_SIGNING_KEYPAIR_PATH ?? './keys/mto-signer.json'
  if (!fs.existsSync(path)) {
    console.warn(`[mto] Keypair not found at ${path} — generating ephemeral keypair for dev`)
    return Keypair.generate()
  }
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(path, 'utf-8'))))
}

export async function confirmDisbursementOnChain(
  transferId: string,
  mtoReference: string,
  mtoKeypair: Keypair
): Promise<string> {
  // In a full implementation this would call:
  //   program.methods.confirmDisbursement(new BN(transferId), mtoReference)
  //   .accounts({ pool, transfer, mtoAuthority: mtoKeypair.publicKey })
  //   .signers([mtoKeypair])
  //   .rpc()
  //
  // For the hackathon demo, we simulate the signature so the flow works
  // even before programs are deployed. Replace with real CPI call after anchor deploy.
  console.log(`[mto-solana] Simulating confirmDisbursement for transfer ${transferId}`)
  return `SIM_SIG_${Date.now()}`
}
