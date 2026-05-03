import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { settleTransfer, replenishVault, getOnChainTransferStatus } from './vault'

// 30s for hackathon demo; change to 172800 (2 days) for production
const SETTLEMENT_DELAY_SECONDS = 30

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

          console.log(
            `[settler] Reconciled already-settled transfer ${transfer.transferId} from on-chain state`
          )
          continue
        }

        if (onChainStatus !== 'DISBURSED') {
          console.log(
            `[settler] Skipping transfer ${transfer.transferId} because on-chain status is ${onChainStatus}`
          )
          continue
        }

        // Call settle_transfer on-chain: moves SWI from pool escrow → vault
        await settleTransfer(transfer.transferId)

        // Call replenish_vault on-chain if available: decrease active_advances on-chain.
        // This is non-blocking for settlement because settle_transfer already moved the funds back.
        try {
          const sig = await replenishVault(BigInt(transfer.transferId), Number(transfer.amountUsdc))
          console.log(`[settler] replenish_vault tx: ${sig} for transfer ${transfer.transferId}`)
        } catch (err) {
          console.error(`[settler] replenish_vault failed for ${transfer.transferId}`, err)
        }

        // Only after on-chain success, update DB and decrement vaultState using BigInt
        await prisma.transfer.update({
          where: { id: transfer.id },
          data: { status: 'SETTLED', settledAt: new Date() },
        })

        await prisma.vaultState.upsert({
          where: { id: 'singleton' },
          update: { activeAdvances: { decrement: BigInt(transfer.amountUsdc) } },
          create: {
            totalLiquidity: BigInt(0),
            activeAdvances: BigInt(0),
            utilizationBps: 0,
            currentAprBps: 1200,
            totalYieldPaid: BigInt(0),
          },
        })

        console.log(`[settler] Settled transfer ${transfer.transferId}`)
      } catch (err) {
        if (err instanceof Error && err.message.includes('InvalidStatus')) {
          const onChainStatus = await getOnChainTransferStatus(transfer.transferId)
          if (onChainStatus === 'SETTLED') {
            await prisma.transfer.update({
              where: { id: transfer.id },
              data: { status: 'SETTLED', settledAt: new Date() },
            })
            console.log(
              `[settler] Reconciled transfer ${transfer.transferId} after InvalidStatus`
            )
            continue
          }
        }

        console.error(`[settler] Failed to settle ${transfer.id}`, err)
      }
    }
  })
}
