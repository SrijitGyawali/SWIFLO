import type { FastifyPluginAsync } from 'fastify'
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,

} from '@solana/web3.js'
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
} from '@solana/spl-token'
import fs from 'fs'

const AIRDROP_SOL   = 0.1 * LAMPORTS_PER_SOL
const RATE_LIMIT_MS = 60_000

// Standard devnet dummy USDC — pre-fund faucet ATA before demo
const TEST_USDC_MINT = new PublicKey(
  process.env.TEST_USDC_MINT ?? 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
)

const recentRequests = new Map<string, number>()

function loadFaucetKeypair(): Keypair {
  if (process.env.FAUCET_SECRET_KEY) {
    return Keypair.fromSecretKey(Buffer.from(JSON.parse(process.env.FAUCET_SECRET_KEY)))
  }
  const path = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`
  if (!fs.existsSync(path)) return Keypair.generate()
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(path, 'utf-8'))))
}

export const faucetRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { walletAddress: string; amount?: number } }>(
    '/api/faucet',
    async (req, reply) => {
      const { walletAddress, amount = 100 } = req.body
      const swiAmount = Math.round(amount * 1_000_000)

      if (!walletAddress) {
        return reply.code(400).send({ error: 'walletAddress required' })
      }

      // Rate limit per wallet
      const last = recentRequests.get(walletAddress)
      if (last && Date.now() - last < RATE_LIMIT_MS) {
        return reply.code(429).send({ error: 'Wait 60 seconds between faucet requests' })
      }
      recentRequests.set(walletAddress, Date.now())

      let userPubkey: PublicKey
      try {
        userPubkey = new PublicKey(walletAddress)
      } catch {
        return reply.code(400).send({ error: 'Invalid wallet address' })
      }

      const connection = new Connection(
        process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
        'confirmed'
      )
      const faucet = loadFaucetKeypair()

      // 1. Airdrop SOL for fees
      try {
        const sig = await connection.requestAirdrop(userPubkey, AIRDROP_SOL)
        await connection.confirmTransaction(sig, 'confirmed')
      } catch {
        app.log.warn('SOL airdrop failed (devnet rate limit?) — continuing')
      }

      // 2. Get/create user USDC ATA (faucet pays rent)
      const userAta = await getOrCreateAssociatedTokenAccount(
        connection, faucet, TEST_USDC_MINT, userPubkey
      )

      // 3. Get faucet USDC ATA and check balance
      const faucetAta = await getOrCreateAssociatedTokenAccount(
        connection, faucet, TEST_USDC_MINT, faucet.publicKey
      )
      const faucetBalance = Number(faucetAta.amount)
      if (faucetBalance < swiAmount) {
        app.log.error({ faucetBalance }, 'Faucet SWI balance too low')
        return reply.code(503).send({ error: 'Faucet is empty — contact the demo operator' })
      }

      // 4. Transfer SWI from faucet ATA to user ATA
      const txSignature = await transfer(
        connection,
        faucet,
        faucetAta.address,
        userAta.address,
        faucet.publicKey,
        swiAmount
      )

      return {
        success: true,
        swiReceived: amount,
        solReceived: 0.1,
        txSignature,
        explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
      }
    }
  )
}
