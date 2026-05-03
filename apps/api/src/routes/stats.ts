import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'
import { getLiveNprPerUsd } from '../services/rateService'

export const statsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/stats', async () => {
    const [transferAgg, vault, rateData] = await Promise.all([
      prisma.transfer.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _count: { id: true },
        _sum: { amountUsdc: true },
      }),
      prisma.vaultState.findUnique({ where: { id: 'singleton' } }),
      getLiveNprPerUsd(),
    ])

    const totalVolumeUsdc = transferAgg._sum.amountUsdc ?? BigInt(0)
    // Savings = (WU 6% - Swiflo 0.4%) = 5.6% of volume converted at live rate
    const liveRateScaled = BigInt(Math.round(rateData.rate * 1_000_000))
    const totalSavedNpr  = (totalVolumeUsdc * 560n * liveRateScaled) / (10_000n * 1_000_000n)

    return {
      totalTransfers: transferAgg._count.id,
      totalVolumeUsdc: totalVolumeUsdc.toString(),
      totalSavedNpr: totalSavedNpr.toString(),
      activeAdvances: vault?.activeAdvances?.toString() ?? '0',
      currentAprBps: vault?.currentAprBps ?? 1200,
    }
  })
}
