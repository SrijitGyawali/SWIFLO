import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Keypair } from '@solana/web3.js'
import { connection, loadKeypair } from './solana'

let _provider: AnchorProvider | null = null

export function getProvider(): AnchorProvider {
  if (_provider) return _provider
  const keypairPath = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`
  const keypair = loadKeypair(keypairPath)
  const wallet = new Wallet(keypair)
  _provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  return _provider
}

export function getSignerKeypair(): Keypair {
  const keypairPath = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`
  return loadKeypair(keypairPath)
}
