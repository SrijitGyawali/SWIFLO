import { prisma } from '../lib/prisma'
import { notifyMTO } from './mto'
import type { HeliusWebhookPayload } from '@swiflo/shared'

interface TransferInitiatedEvent {
  transferId: string
  sender: string
  amountUsdc: string
  recipientHash: string
  lockedRate: string
}

export async function handleHeliusWebhook(payload: HeliusWebhookPayload): Promise<void> {
  for (const tx of payload.transactions) {
    await prisma.webhookLog.create({
      data: { source: 'helius', payload: tx as any, processed: false },
    })

    for (const log of tx.meta.logMessages) {
      if (!log.startsWith('Program data: ')) continue
      // Real implementation: decode Anchor event from base64 program data log
      // For hackathon the MTO mock directly calls our webhook after on-chain confirm
    }
  }
}

export async function handleTransferInitiated(
  event: TransferInitiatedEvent,
  signature: string
): Promise<void> {
  const npr_rate = BigInt(event.lockedRate)    // scaled 10^6
  const usdc_amount = BigInt(event.amountUsdc) // scaled 10^6
  const amountNpr = (usdc_amount * npr_rate) / BigInt(1_000_000)

  const transfer = await prisma.transfer.upsert({
    where: { transferId: BigInt(event.transferId) },
    update: { solanaTxSignature: signature, initiatedAt: new Date() },
    create: {
      transferId: BigInt(event.transferId),
      senderPubkey: event.sender,
      amountUsdc: BigInt(event.amountUsdc),
      amountNpr,
      recipientPhone: 'PENDING',      // revealed by mobile app separately
      recipientHash: event.recipientHash,
      lockedRate: BigInt(event.lockedRate),
      feeBps: 40,
      status: 'INITIATED',
      solanaTxSignature: signature,
      initiatedAt: new Date(),
    },
  })

  // Fire-and-forget MTO notification
  notifyMTO({
    transferId: transfer.id,
    recipientPhone: transfer.recipientPhone,
    amountNpr: transfer.amountNpr.toString(),
    amountUsdc: transfer.amountUsdc.toString(),
    lockedRate: transfer.lockedRate.toString(),
    reference: transfer.id,
  }).catch(err => console.error('[indexer] MTO notify failed', err))
}
