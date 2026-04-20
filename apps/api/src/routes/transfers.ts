import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

const estimateBody = z.object({ amountUsdc: z.number().positive() })

const listQuery = z.object({
  sender: z.string().optional(),
  status: z.enum(['INITIATED', 'DISBURSED', 'SETTLED', 'FAILED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 6) + 'XXXX' + phone.slice(-2)
}

function serializeTransfer(t: any) {
  return {
    ...t,
    transferId: t.transferId.toString(),
    amountUsdc: t.amountUsdc.toString(),
    amountNpr: t.amountNpr.toString(),
    lockedRate: t.lockedRate.toString(),
    recipientPhone: maskPhone(t.recipientPhone),
  }
}

export const transferRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/transfers/estimate
  app.post('/api/transfers/estimate', async (req, reply) => {
    const { amountUsdc } = estimateBody.parse(req.body)

    const latestRate = await prisma.rateSnapshot.findFirst({
      orderBy: { recordedAt: 'desc' },
    })
    const nprPerUsdc = latestRate
      ? Number(latestRate.usdcToNprRate) / 1_000_000
      : 133.5

    const amountNpr = amountUsdc * nprPerUsdc
    const swifloFeeNpr = amountNpr * 0.004
    const wuFeeNpr = amountNpr * 0.06
    const recipientGetsNpr = amountNpr - swifloFeeNpr
    const wuRecipientGetsNpr = amountNpr - wuFeeNpr

    return {
      amountUsdc,
      lockedRate: nprPerUsdc,
      amountNpr: Math.round(amountNpr),
      swifloFeeNpr: Math.round(swifloFeeNpr),
      recipientGetsNpr: Math.round(recipientGetsNpr),
      wuRecipientGetsNpr: Math.round(wuRecipientGetsNpr),
      savingsNpr: Math.round(recipientGetsNpr - wuRecipientGetsNpr),
      savingsPercent: Number(((recipientGetsNpr - wuRecipientGetsNpr) / amountNpr * 100).toFixed(2)),
    }
  })

  // GET /api/transfers
  app.get('/api/transfers', async (req) => {
    const query = listQuery.parse(req.query)
    const transfers = await prisma.transfer.findMany({
      where: {
        ...(query.sender && { senderPubkey: query.sender }),
        ...(query.status && { status: query.status }),
        ...(query.cursor && { id: { lt: query.cursor } }),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    })
    return transfers.map(serializeTransfer)
  })

  // GET /api/transfers/:id
  app.get<{ Params: { id: string } }>('/api/transfers/:id', async (req, reply) => {
    const transfer = await prisma.transfer.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { solanaTxSignature: req.params.id },
        ],
      },
    })
    if (!transfer) return reply.status(404).send({ error: 'Not found' })
    return serializeTransfer(transfer)
  })

  // GET /api/transfers/:id/status
  app.get<{ Params: { id: string } }>('/api/transfers/:id/status', async (req, reply) => {
    const transfer = await prisma.transfer.findUnique({ where: { id: req.params.id } })
    if (!transfer) return reply.status(404).send({ error: 'Not found' })
    return {
      id: transfer.id,
      status: transfer.status,
      initiatedAt: transfer.initiatedAt,
      disbursedAt: transfer.disbursedAt,
      settledAt: transfer.settledAt,
      mtoReference: transfer.mtoReference,
      solanaTxSignature: transfer.solanaTxSignature,
    }
  })
}
