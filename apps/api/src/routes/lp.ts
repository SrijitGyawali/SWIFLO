import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

export const lpRoutes: FastifyPluginAsync = async (app) => {
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

  app.get<{ Params: { pubkey: string } }>('/api/lp/:pubkey/history', async (req) => {
    const txs = await prisma.lPTransaction.findMany({
      where: { lpPubkey: req.params.pubkey },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return txs.map(t => ({ ...t, amount: t.amount.toString() }))
  })
}
