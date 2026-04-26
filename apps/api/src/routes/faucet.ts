import type { FastifyPluginAsync } from 'fastify'
import {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token'
import fs from 'fs'

const AIRDROP_SOL   = 0.1 * LAMPORTS_PER_SOL
const FAUCET_USDC   = 100_000_000  // 100 USDC (6 decimals)
const RATE_LIMIT_MS = 60_000       // one request per wallet per minute

const recentRequests = new Map<string, number>()

function loadFaucetKeypair(): Keypair {
  const path = process.env.ANCHOR_WALLET ?? `${process.env.HOME}/.config/solana/id.json`
  if (!fs.existsSync(path)) return Keypair.generate()
  return Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(path, 'utf-8')))
  )
}

export const faucetRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { walletAddress: string } }>(
    '/api/faucet',
    async (req, reply) => {
      const { walletAddress } = req.body

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
      const usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

      // 1. Airdrop SOL for fees
      try {
        const sig = await connection.requestAirdrop(userPubkey, AIRDROP_SOL)
        await connection.confirmTransaction(sig, 'confirmed')
      } catch (e) {
        app.log.warn('SOL airdrop failed (devnet rate limit?) — continuing')
      }

      // 2. Get/create user USDC associated token account (faucet pays rent)
      const userAta = await getOrCreateAssociatedTokenAccount(
        connection, faucet, usdcMint, userPubkey
      )

      // 3. Mint 100 USDC directly to user — faucet keypair is mint authority
      const txSignature = await mintTo(
        connection,
        faucet,
        usdcMint,
        userAta.address,
        faucet.publicKey,
        FAUCET_USDC
      )

      return {
        success: true,
        usdcReceived: 100,
        solReceived: 0.1,
        txSignature,
        explorerUrl: `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
      }
    }
  )
}
