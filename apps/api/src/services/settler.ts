import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { swifloApiChainLog } from '../lib/swifloChainLog'
import {
  settleTransfer,
  decrementVaultAdvances,
  collectFees,
  getOnChainTransferStatus,
  getTransferSignatures,
  classifySignatures,
} from './vault'

// 30s for hackathon demo; change to 172800 (2 days) for production
const SETTLEMENT_DELAY_SECONDS = 30

function labelToInstruction(label: string): string {
  const snake: Record<string, string> = {
    advance_to_mto: 'advanceToMto',
    settle_transfer: 'settleTransfer',
    replenish_vault: 'replenishVault',
    collect_fees: 'collectFees',
    initiate_transfer: 'initiateTransfer',
    confirm_disbursement: 'confirmDisbursement',
    unknown: 'unknownInstruction',
  }
  if (snake[label]) return snake[label]
  if (/^[A-Z]/.test(label)) return label.charAt(0).toLowerCase() + label.slice(1)
  return label
}

/** When DB catches up to chain without submitting txs, print the same log lines from RPC history. */
async function printTransferChainTxLogs(onChainTransferId: bigint): Promise<void> {
  try {
    const sigs = await getTransferSignatures(onChainTransferId)
    if (!sigs?.length) return
    const classified = await classifySignatures(sigs)
    classified.sort((a, b) => {
      const ta = a.blockTime ?? Number.MAX_SAFE_INTEGER
      const tb = b.blockTime ?? Number.MAX_SAFE_INTEGER
      return ta - tb
    })
    for (const c of classified) {
      swifloApiChainLog(labelToInstruction(c.label), c.signature)
    }
  } catch (err) {
    console.error(`[settler] failed to log chain history for transfer ${onChainTransferId}`, err)
  }
}

export function startSettlementScheduler(): void {
  cron.schedule('*/10 * * * * *', async () => {
    const cutoff = new Date(Date.now() - SETTLEMENT_DELAY_SECONDS * 1000)

    let pending: Awaited<ReturnType<typeof prisma.transfer.findMany>>
    try {
      pending = await prisma.transfer.findMany({
        where: { status: 'DISBURSED', disbursedAt: { lte: cutoff } },
        take: 10,
      })
    } catch {
      // DB not reachable — skip this tick silently
      return
    }

    for (const transfer of pending) {
      try {
        const onChainStatus = await getOnChainTransferStatus(transfer.transferId)
        if (onChainStatus === 'SETTLED') {
          await prisma.transfer.update({
            where: { id: transfer.id },
            data: { status: 'SETTLED', settledAt: new Date() },
          })
          await printTransferChainTxLogs(BigInt(transfer.transferId))
          continue
        }

        if (onChainStatus !== 'DISBURSED') continue

        // Call settle_transfer on-chain: moves SWI from pool escrow → vault
        const settleSig = await settleTransfer(transfer.transferId)
        swifloApiChainLog('settleTransfer', settleSig)

        // Vault replenish_vault (decrementVaultAdvances): drops active_advances on-chain after settle.
        try {
          const feeBps = BigInt(transfer.feeBps ?? 40)
          const advanceAmt = (BigInt(transfer.amountUsdc) * (10_000n - feeBps)) / 10_000n
          const sig = await decrementVaultAdvances(BigInt(transfer.transferId), advanceAmt)
          swifloApiChainLog('replenishVault', sig)
        } catch (err) {
          console.error(`[settler] replenishVault / decrementVaultAdvances failed for ${transfer.transferId}`, err)
        }

        // Vault collect_fees → treasury
        try {
          const treasuryAmt = (BigInt(transfer.amountUsdc) * 30n) / 10_000n
          if (treasuryAmt > 0n) {
            const sig = await collectFees(treasuryAmt)
            swifloApiChainLog('collectFees', sig)
          }
        } catch (err) {
          console.error(`[settler] collectFees failed for ${transfer.transferId}`, err)
        }

        // Only after on-chain success, update DB and decrement vaultState using BigInt.
        // activeAdvances reflects what was actually advanced (fee-deducted amount).
        await prisma.transfer.update({
          where: { id: transfer.id },
          data: { status: 'SETTLED', settledAt: new Date() },
        })

        const feeBps = BigInt(transfer.feeBps ?? 40)
        const advanceAmountUsdc = (BigInt(transfer.amountUsdc) * (10_000n - feeBps)) / 10_000n

        await prisma.vaultState.upsert({
          where: { id: 'singleton' },
          update: { activeAdvances: { decrement: advanceAmountUsdc } },
          create: {
            totalLiquidity: BigInt(0),
            activeAdvances: BigInt(0),
            utilizationBps: 0,
            currentAprBps: 1200,
            totalYieldPaid: BigInt(0),
          },
        })

      } catch (err) {
        if (err instanceof Error && err.message.includes('InvalidStatus')) {
          const onChainStatus = await getOnChainTransferStatus(transfer.transferId)
          if (onChainStatus === 'SETTLED') {
            await prisma.transfer.update({
              where: { id: transfer.id },
              data: { status: 'SETTLED', settledAt: new Date() },
            })
            await printTransferChainTxLogs(BigInt(transfer.transferId))
            continue
          }
        }

        console.error(`[settler] Failed to settle ${transfer.id}`, err)
      }
    }
  })
}
