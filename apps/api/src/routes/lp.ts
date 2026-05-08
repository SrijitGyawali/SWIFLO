import type { FastifyPluginAsync } from 'fastify'
import { Connection, PublicKey } from '@solana/web3.js'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { buildClaimYieldTx } from '../services/vault'

const RPC      = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const LP_MINT  = new PublicKey(process.env.LP_MINT    ?? '99sFqGr245Dohx8P2F616sPp4magaR87E4sxX1RKoBxD')
const VAULT_SWI = new PublicKey(process.env.VAULT_SWI ?? '3QpTAYX47hVjeL8WG7R8VoF5QncwZnA6ak4jEPUiDBtw')

export const lpRoutes: FastifyPluginAsync = async (app) => {
  // Authenticated: returns the caller's LP position (reads actual on-chain balance)
  app.get('/api/lp/me', { preHandler: requireAuth }, async (req, reply) => {
    const lp = await prisma.liquidityProvider.findFirst({
      where: { userId: req.userId! },
    })
    if (!lp) return reply.status(404).send({ error: 'No LP position found' })

    // Fetch actual on-chain LP token balance
    const connection = new Connection(RPC, 'confirmed')
    try {
      const userLpAta = await import('@solana/spl-token').then(m => 
        m.getAssociatedTokenAddress(LP_MINT, new PublicKey(lp.pubkey))
      )
      const lpAtaInfo = await connection.getParsedAccountInfo(userLpAta)
      const onChainLpTokens = BigInt(
        (lpAtaInfo.value?.data as any)?.parsed?.info?.tokenAmount?.amount ?? '0'
      )

      return {
        pubkey: lp.pubkey,
        totalDeposited: lp.totalDeposited.toString(),
        totalWithdrawn: lp.totalWithdrawn.toString(),
        lpTokens: onChainLpTokens.toString(),
        lpTokensDisplay: (Number(onChainLpTokens) / 1_000_000).toFixed(6),
      }
    } catch (err) {
      console.error('[lp/me] Failed to fetch on-chain LP balance:', err)
      // Fallback to DB if on-chain fetch fails
      return {
        pubkey: lp.pubkey,
        totalDeposited: lp.totalDeposited.toString(),
        totalWithdrawn: lp.totalWithdrawn.toString(),
        lpTokens: lp.lpTokens.toString(),
      }
    }
  })

  // Public: fetch by wallet pubkey (for explorer)
  app.get<{ Params: { pubkey: string } }>('/api/lp/:pubkey', async (req, reply) => {
    const lp = await prisma.liquidityProvider.findUnique({
      where: { pubkey: req.params.pubkey },
    })
    if (!lp) return reply.status(404).send({ error: 'LP not found' })
    return {
      ...lp,
      totalDeposited: lp.totalDeposited.toString(),
      totalWithdrawn: lp.totalWithdrawn.toString(),
      lpTokens: lp.lpTokens.toString(),
    }
  })

  // Authenticated: builds an unsigned claim_yield tx for the LP to sign.
  // LP burns `lpTokens` (base units) and receives proportional SWI back (principal + yield).
  // Pass lpTokens = lp.lpTokens to withdraw everything.
  app.post('/api/lp/withdraw', { preHandler: requireAuth }, async (req, reply) => {
    const { lpTokens } = req.body as { lpTokens: string }
    if (!lpTokens) return reply.status(400).send({ error: 'lpTokens required' })

    const lp = await prisma.liquidityProvider.findFirst({ where: { userId: req.userId! } })
    if (!lp) return reply.status(404).send({ error: 'No LP position found' })

    const amount = BigInt(lpTokens)
    if (amount <= 0n) return reply.status(400).send({ error: 'lpTokens must be > 0' })
    if (amount > lp.lpTokens) return reply.status(400).send({ error: 'Insufficient LP tokens' })

    // Query on-chain vault balance and LP supply to calculate expected return + yield
    const connection = new Connection(RPC, 'confirmed')
    const [vaultBalResp, lpSupplyResp] = await Promise.all([
      connection.getTokenAccountBalance(VAULT_SWI),
      connection.getTokenSupply(LP_MINT),
    ])
    const vaultBalance = BigInt(vaultBalResp.value.amount)
    const lpSupply     = BigInt(lpSupplyResp.value.amount)

    // usdc_to_return = lp_tokens * vault_balance / lp_supply  (same formula as on-chain)
    const usdcToReturn = lpSupply > 0n ? (amount * vaultBalance) / lpSupply : amount
    const yieldEarned  = usdcToReturn > amount ? usdcToReturn - amount : 0n

    const transaction = await buildClaimYieldTx(lp.pubkey, amount)
    return {
      transaction,
      lpTokens:      amount.toString(),
      usdcToReturn:  usdcToReturn.toString(),
      yieldEarned:   yieldEarned.toString(),
    }
  })

  // Authenticated: called by frontend after it signs and submits the withdraw tx.
  // Updates DB: decrements lpTokens, increments totalWithdrawn, records the tx.
  app.post('/api/lp/record-withdrawal', { preHandler: requireAuth }, async (req, reply) => {
    const { txSignature, lpTokensBurned, usdcReceived } = req.body as {
      txSignature: string
      lpTokensBurned: string
      usdcReceived: string
    }
    if (!txSignature || !lpTokensBurned || !usdcReceived)
      return reply.status(400).send({ error: 'txSignature, lpTokensBurned and usdcReceived required' })

    const lp = await prisma.liquidityProvider.findFirst({ where: { userId: req.userId! } })
    if (!lp) return reply.status(404).send({ error: 'No LP position found' })

    const burned   = BigInt(lpTokensBurned)
    const received = BigInt(usdcReceived)

    await prisma.$transaction([
      prisma.liquidityProvider.update({
        where: { id: lp.id },
        data: {
          lpTokens:      { decrement: burned },
          totalWithdrawn: { increment: received },
        },
      }),
      prisma.vaultState.upsert({
        where: { id: 'singleton' },
        update: { totalLiquidity: { decrement: received } },
        create: { totalLiquidity: 0n, activeAdvances: 0n, utilizationBps: 0, currentAprBps: 1200, totalYieldPaid: 0n },
      }),
      prisma.lPTransaction.create({
        data: { lpPubkey: lp.pubkey, type: 'WITHDRAW', amount: received, txSignature },
      }),
    ])

    return { recorded: true, txSignature }
  })

  // Authenticated: only own history
  app.get<{ Params: { pubkey: string } }>('/api/lp/:pubkey/history', { preHandler: requireAuth }, async (req, reply) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (user?.solanaPubkey !== req.params.pubkey) {
      return reply.code(403).send({ error: 'Forbidden' })
    }
    const txs = await prisma.lPTransaction.findMany({
      where: { lpPubkey: req.params.pubkey },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return txs.map((t: typeof txs[number]) => ({ ...t, amount: t.amount.toString() }))
  })
}
