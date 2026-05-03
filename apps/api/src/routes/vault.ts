import type { FastifyPluginAsync } from 'fastify'
import { Connection, PublicKey } from '@solana/web3.js'
import { prisma } from '../lib/prisma'

const RPC       = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const LP_MINT   = new PublicKey(process.env.LP_MINT   ?? '99sFqGr245Dohx8P2F616sPp4magaR87E4sxX1RKoBxD')
const VAULT_SWI = new PublicKey(process.env.VAULT_SWI ?? '3QpTAYX47hVjeL8WG7R8VoF5QncwZnA6ak4jEPUiDBtw')

const BASE_APR_BPS    = 800n
const MAX_APR_BPS     = 2000n
const UTIL_MULTIPLIER = 120n

async function readOnChainVaultState() {
  const connection = new Connection(RPC, 'confirmed')

  const [supplyResp, balanceResp] = await Promise.all([
    connection.getTokenSupply(LP_MINT),
    connection.getTokenAccountBalance(VAULT_SWI),
  ])

  const totalLiquidity = BigInt(supplyResp.value.amount)   // e.g. 167_000_000
  const vaultBalance   = BigInt(balanceResp.value.amount)  // e.g. 73_040_000

  const activeAdvances = totalLiquidity > vaultBalance
    ? totalLiquidity - vaultBalance
    : 0n

  const utilizationBps = totalLiquidity > 0n
    ? Number((activeAdvances * 10_000n) / totalLiquidity)
    : 0

  const bonus         = (BigInt(utilizationBps) * UTIL_MULTIPLIER) / 10_000n
  const currentAprBps = Number((BASE_APR_BPS + bonus) < MAX_APR_BPS
    ? BASE_APR_BPS + bonus
    : MAX_APR_BPS)

  return { totalLiquidity, activeAdvances, utilizationBps, currentAprBps }
}

// Sync on-chain state into DB every 15 seconds so the route never
// blocks on a slow RPC call — the route always reads from DB.
async function startOnChainSync() {
  const sync = async () => {
    try {
      const { totalLiquidity, activeAdvances, utilizationBps, currentAprBps } =
        await readOnChainVaultState()
      await prisma.vaultState.upsert({
        where: { id: 'singleton' },
        update: { totalLiquidity, activeAdvances, utilizationBps, currentAprBps },
        create: { totalLiquidity, activeAdvances, utilizationBps, currentAprBps, totalYieldPaid: BigInt(0) },
      })
    } catch (err) {
      console.warn('[vault/sync] on-chain read failed:', (err as Error).message)
    }
  }
  await sync()                          // run once immediately on startup
  setInterval(sync, 15_000)            // then every 15 seconds
}

export const vaultRoutes: FastifyPluginAsync = async (app) => {
  startOnChainSync()

  app.get('/api/vault/state', async () => {
    const vault = await prisma.vaultState.upsert({
      where: { id: 'singleton' },
      update: {},
      create: {
        totalLiquidity: BigInt(0),
        activeAdvances: BigInt(0),
        utilizationBps: 0,
        currentAprBps: 800,
        totalYieldPaid: BigInt(0),
      },
    })

    return {
      totalLiquidity: vault.totalLiquidity.toString(),
      activeAdvances: vault.activeAdvances.toString(),
      utilizationBps: vault.utilizationBps,
      currentAprBps:  vault.currentAprBps,
      totalYieldPaid: vault.totalYieldPaid.toString(),
      updatedAt:      vault.updatedAt,
    }
  })

  app.get('/api/vault/apr-history', async () => {
    const snapshots = await prisma.rateSnapshot.findMany({
      orderBy: { recordedAt: 'asc' },
      take: 30,
    })
    return snapshots.map(s => ({
      date: s.recordedAt,
      aprBps: 1200,
      usdcToNprRate: s.usdcToNprRate.toString(),
    }))
  })
}
