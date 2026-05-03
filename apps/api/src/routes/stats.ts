import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

export const statsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/stats', async () => {
    const [transferAgg, vault] = await Promise.all([
      prisma.transfer.aggregate({
        _count: { id: true },
        _sum: { amountUsdc: true },
      }),
      prisma.vaultState.findUnique({ where: { id: 'singleton' } }),
    ])

    const totalVolumeUsdc = transferAgg._sum.amountUsdc ?? BigInt(0)
    // Savings = (WU 6% - Swiflo 0.4%) = 5.6% of volume in NPR equivalent
    const savingsRateNpr = 133_500_000n  // default NPR/USD scaled 10^6
    const totalSavedNpr = (totalVolumeUsdc * 560n * savingsRateNpr) / (10_000n * 1_000_000n)

    return {
      totalTransfers: transferAgg._count.id,
      totalVolumeUsdc: totalVolumeUsdc.toString(),
      totalSavedNpr: totalSavedNpr.toString(),
      activeAdvances: vault?.activeAdvances?.toString() ?? '0',
      currentAprBps: vault?.currentAprBps ?? 1200,
    }
  })
}
