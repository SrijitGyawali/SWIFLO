import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { settleTransfer } from './vault'

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
        // Call settle_transfer on-chain: moves SWI from pool escrow → vault
        await settleTransfer(transfer.transferId)

        await prisma.transfer.update({
          where: { id: transfer.id },
          data: { status: 'SETTLED', settledAt: new Date() },
        })

        await prisma.vaultState.upsert({
          where: { id: 'singleton' },
          update: { activeAdvances: { decrement: transfer.amountUsdc } },
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
        console.error(`[settler] Failed to settle ${transfer.id}`, err)
      }
    }
  })
}
