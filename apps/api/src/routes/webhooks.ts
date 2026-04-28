import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../lib/prisma'
import { handleHeliusWebhook, handleTransferInitiated } from '../services/indexer'
import type { HeliusWebhookPayload, MtoWebhookPayload } from '@swiflo/shared'

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/webhooks/helius — Solana event stream
  app.post('/api/webhooks/helius', async (req, reply) => {
    const secret = req.headers['x-webhook-secret']
    if (secret !== process.env.WEBHOOK_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const payload = req.body as HeliusWebhookPayload
    await handleHeliusWebhook(payload)
    return { ok: true }
  })

  // POST /api/webhooks/mto — MTO disbursement confirmation
  app.post('/api/webhooks/mto', async (req, reply) => {
    const body = req.body as MtoWebhookPayload

    const transfer = await prisma.transfer.findUnique({ where: { id: body.transferId } })
    if (!transfer) return reply.status(404).send({ error: 'Transfer not found' })

    if (body.status === 'DISBURSED') {
      await prisma.transfer.update({
        where: { id: body.transferId },
        data: {
          status: 'DISBURSED',
          mtoReference: body.mtoReference,
          disbursedAt: new Date(),
        },
      })

      // Track active advances in vault
      await prisma.vaultState.upsert({
        where: { id: 'singleton' },
        update: { activeAdvances: { increment: transfer.amountUsdc } },
        create: {
          totalLiquidity: transfer.amountUsdc,
          activeAdvances: transfer.amountUsdc,
          utilizationBps: 10000,
          currentAprBps: 1200,
          totalYieldPaid: BigInt(0),
        },
      })
    } else {
      await prisma.transfer.update({
        where: { id: body.transferId },
        data: { status: 'FAILED' },
      })
    }

    return { ok: true }
  })

  // POST /api/webhooks/transfer-initiated — called by web/mobile after on-chain tx confirm
  app.post('/api/webhooks/transfer-initiated', async (req) => {
    const body = req.body as {
      transferId: string
      recipientPhone: string
      amountUsdc: string
      lockedRate: string
      solanaTxSignature: string
      senderPubkey: string
    }

    const { id } = await handleTransferInitiated(
      {
        transferId: body.transferId,
        sender: body.senderPubkey,
        amountUsdc: body.amountUsdc,
        recipientHash: '',
        lockedRate: body.lockedRate,
        recipientPhone: body.recipientPhone,
      },
      body.solanaTxSignature
    )

    return { ok: true, transferId: id }
  })
}
