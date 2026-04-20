import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/health', async () => {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', timestamp: new Date().toISOString() }
  })
}
