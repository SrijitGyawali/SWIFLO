import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

export const lpRoutes: FastifyPluginAsync = async (app) => {
  // Authenticated: returns the caller's LP position
  app.get('/api/lp/me', { preHandler: requireAuth }, async (req, reply) => {
    const lp = await prisma.liquidityProvider.findFirst({
      where: { userId: req.userId! },
    })
    if (!lp) return reply.status(404).send({ error: 'No LP position found' })
    return {
      ...lp,
      totalDeposited: lp.totalDeposited.toString(),
      totalWithdrawn: lp.totalWithdrawn.toString(),
      lpTokens: lp.lpTokens.toString(),
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
