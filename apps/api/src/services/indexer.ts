import { prisma } from '../lib/prisma'
import { notifyMTO } from './mto'
import { advanceToMTO } from './vault'
import type { HeliusWebhookPayload } from '@swiflo/shared'
import { logBox } from '../lib/structuredLog'

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
  event: TransferInitiatedEvent & { recipientPhone?: string },
  signature: string
): Promise<{ id: string }> {
  const npr_rate = BigInt(event.lockedRate)    // scaled 10^6
  const usdc_amount = BigInt(event.amountUsdc) // scaled 10^6
  const amountNpr = (usdc_amount * npr_rate) / BigInt(1_000_000)

  const phone = event.recipientPhone ?? 'PENDING'
  const transfer = await prisma.transfer.upsert({
    where: { transferId: BigInt(event.transferId) },
    update: { solanaTxSignature: signature, initiatedAt: new Date(), recipientPhone: phone },
    create: {
      transferId: BigInt(event.transferId),
      senderPubkey: event.sender,
      amountUsdc: BigInt(event.amountUsdc),
      amountNpr,
      recipientPhone: phone,
      recipientHash: event.recipientHash,
      lockedRate: BigInt(event.lockedRate),
      feeBps: 40,
      status: 'INITIATED',
      solanaTxSignature: signature,
      initiatedAt: new Date(),
    },
  })

  // Fire-and-forget: advance fee-deducted USDC to MTO, then notify MTO to disburse.
  // The pool escrow holds the full amount and returns it all to the vault on settlement,
  // so the vault nets the 0.4% fee as yield for LPs.
  if (phone !== 'PENDING') {
    const run = async () => {
      const feeBps = BigInt(transfer.feeBps)
      const advanceAmountUsdc = (transfer.amountUsdc * (10_000n - feeBps)) / 10_000n
      const advanceAmountNpr = (advanceAmountUsdc * transfer.lockedRate) / 1_000_000n

      logBox('SWIFLO API', 'ADVANCE TO MTO STARTED', {
        transferId: transfer.id,
        onChainTransferId: transfer.transferId,
        amountUsdcBaseUnits: advanceAmountUsdc,
        amountNprBaseUnits: advanceAmountNpr,
        feeBps,
      })

      try {
        await advanceToMTO(transfer.transferId, advanceAmountUsdc)
      } catch (err: any) {
        const message = String(err?.message ?? err)
        const logs = Array.isArray(err?.transactionLogs) ? err.transactionLogs.join('\n') : ''
        const isInsufficientLiquidity = message.includes('InsufficientLiquidity') || logs.includes('InsufficientLiquidity')

        if (isInsufficientLiquidity) {
          logBox('SWIFLO API', 'ADVANCE TO MTO SKIPPED', {
            transferId: transfer.id,
            onChainTransferId: transfer.transferId,
            reason: 'vault liquidity too low',
          })
          return
        }

        throw err
      }

      await notifyMTO({
        transferId: transfer.id,
        onChainTransferId: transfer.transferId.toString(),
        recipientPhone: transfer.recipientPhone,
        amountNpr: advanceAmountNpr.toString(),
        amountUsdc: advanceAmountUsdc.toString(),
        lockedRate: transfer.lockedRate.toString(),
        reference: transfer.id,
      })
    }
    run().catch(err => {
      logBox('SWIFLO API', 'ADVANCE AND MTO NOTIFY FAILED', {
        transferId: transfer.id,
        onChainTransferId: transfer.transferId,
        error: err instanceof Error ? err.message : String(err),
      })
    })
  }

  return { id: transfer.id }
}
