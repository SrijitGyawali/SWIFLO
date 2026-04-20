import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import fs from 'fs'

export const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
  'confirmed'
)

export function loadKeypair(path: string): Keypair {
  const raw = fs.readFileSync(path, 'utf-8')
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(raw)))
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export async function getSlot(): Promise<number> {
  return connection.getSlot()
}

export function solanaExplorerUrl(signature: string, network = 'devnet'): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${network}`
}
