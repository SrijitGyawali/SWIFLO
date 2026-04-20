import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 6) + 'XXXX' + phone.slice(-2)
}

function serializeTx(t: any) {
  return {
    ...t,
    transferId: t.transferId.toString(),
    amountUsdc: t.amountUsdc.toString(),
    amountNpr: t.amountNpr.toString(),
    lockedRate: t.lockedRate.toString(),
    recipientPhone: maskPhone(t.recipientPhone),
  }
}

export const explorerRoutes: FastifyPluginAsync = async (app) => {
  // Server-Sent Events live feed
  app.get('/api/explorer/feed', async (req, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.flushHeaders()

    const send = (data: unknown) =>
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)

    const initial = await prisma.transfer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    for (const t of initial.reverse()) send(serializeTx(t))

    let lastSeen = initial[0]?.createdAt ?? new Date(0)

    const interval = setInterval(async () => {
      const newTxs = await prisma.transfer.findMany({
        where: { createdAt: { gt: lastSeen } },
        orderBy: { createdAt: 'asc' },
      })
      for (const t of newTxs) {
        send(serializeTx(t))
        lastSeen = t.createdAt
      }
    }, 3000)

    req.raw.on('close', () => clearInterval(interval))
  })
}
