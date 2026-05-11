import type { FastifyPluginAsync } from 'fastify'
import { swifloApiChainLog } from '../lib/swifloChainLog'
import { prisma } from '../lib/prisma'
import { handleHeliusWebhook, handleTransferInitiated } from '../services/indexer'
import type { HeliusWebhookPayload, MtoWebhookPayload } from '@swiflo/shared'
import { logBox } from '../lib/structuredLog'

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

    logBox('SWIFLO API', 'MTO CALLBACK RECEIVED', {
      transferId: body.transferId,
      status: body.status,
      mtoReference: body.mtoReference,
      solanaSignature: body.solanaSignature,
    })

    const transfer = await prisma.transfer.findUnique({ where: { id: body.transferId } })
    if (!transfer) {
      logBox('SWIFLO API', 'MTO CALLBACK REJECTED', {
        transferId: body.transferId,
        reason: 'transfer not found',
      })
      return reply.status(404).send({ error: 'Transfer not found' })
    }

    if (body.status === 'DISBURSED') {
      await prisma.transfer.update({
        where: { id: body.transferId },
        data: {
          status: 'DISBURSED',
          mtoReference: body.mtoReference,
          disbursedAt: new Date(),
        },
      })

      if (body.solanaSignature) {
        swifloApiChainLog('confirmDisbursement', body.solanaSignature)
      }

      logBox('SWIFLO API', 'TRANSFER MARKED DISBURSED', {
        transferId: body.transferId,
        status: 'DISBURSED',
        mtoReference: body.mtoReference,
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
      logBox('SWIFLO API', 'TRANSFER MARKED FAILED', {
        transferId: body.transferId,
        status: body.status,
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

    if (body.solanaTxSignature) {
      swifloApiChainLog('initiateTransfer', body.solanaTxSignature)
    }

    logBox('SWIFLO API', 'TRANSFER INITIATED WEBHOOK', {
      onChainTransferId: body.transferId,
      sender: body.senderPubkey,
      recipientPhone: body.recipientPhone,
      amountUsdcBaseUnits: body.amountUsdc,
      lockedRate: body.lockedRate,
      solanaSignature: body.solanaTxSignature,
    })

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

    logBox('SWIFLO API', 'TRANSFER SAVED', {
      transferId: id,
      onChainTransferId: body.transferId,
    })

    return { ok: true, transferId: id }
  })
}
