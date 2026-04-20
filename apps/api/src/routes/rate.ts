import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

export const rateRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/rate/current', async () => {
    const latest = await prisma.rateSnapshot.findFirst({
      orderBy: { recordedAt: 'desc' },
    })

    if (!latest) {
      // Seed default rate if no snapshots exist yet
      const seeded = await prisma.rateSnapshot.create({
        data: {
          usdcToNprRate: BigInt(133_500_000),
          pythPrice: BigInt(1_000_000),
        },
      })
      return {
        usdcToNprRate: seeded.usdcToNprRate.toString(),
        nprPerUsd: 133.5,
        recordedAt: seeded.recordedAt,
      }
    }

    return {
      usdcToNprRate: latest.usdcToNprRate.toString(),
      nprPerUsd: Number(latest.usdcToNprRate) / 1_000_000,
      recordedAt: latest.recordedAt,
    }
  })
}
