import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

export const vaultRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/vault/state', async () => {
    const vault = await prisma.vaultState.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        totalLiquidity: BigInt(0),
        activeAdvances: BigInt(0),
        utilizationBps: 0,
        currentAprBps: 1200,
        totalYieldPaid: BigInt(0),
      },
    })

    const util = vault.totalLiquidity > 0n
      ? Number((vault.activeAdvances * 10_000n) / vault.totalLiquidity)
      : 0

    return {
      totalLiquidity: vault.totalLiquidity.toString(),
      activeAdvances: vault.activeAdvances.toString(),
      utilizationBps: util,
      currentAprBps: vault.currentAprBps,
      totalYieldPaid: vault.totalYieldPaid.toString(),
      updatedAt: vault.updatedAt,
    }
  })

  app.get('/api/vault/apr-history', async () => {
    // Return last 30 rate snapshots as APR proxy data for chart
    const snapshots = await prisma.rateSnapshot.findMany({
      orderBy: { recordedAt: 'asc' },
      take: 30,
    })
    return snapshots.map(s => ({
      date: s.recordedAt,
      aprBps: 1200,  // simplified for hackathon — would be vault.currentAprBps at that time
      usdcToNprRate: s.usdcToNprRate.toString(),
    }))
  })
}
