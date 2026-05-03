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

export const vaultRoutes: FastifyPluginAsync = async (app) => {
  app.get('/api/vault/state', async () => {
    let totalLiquidity: bigint
    let activeAdvances: bigint
    let utilizationBps: number
    let currentAprBps: number

    try {
      const onChain = await readOnChainVaultState()
      ;({ totalLiquidity, activeAdvances, utilizationBps, currentAprBps } = onChain)
    } catch (err) {
      console.warn('[vault/state] on-chain read failed, using DB fallback:', (err as Error).message)
      const vault = await prisma.vaultState.upsert({
        where: { id: 'singleton' },
        update: {},
        create: {
          totalLiquidity: BigInt(0),
          activeAdvances: BigInt(0),
          utilizationBps: 0,
          currentAprBps: 1200,
          totalYieldPaid: BigInt(0),
        },
      })
      totalLiquidity = vault.totalLiquidity
      activeAdvances = vault.activeAdvances
      utilizationBps = vault.utilizationBps
      currentAprBps  = vault.currentAprBps
    }

    const db = await prisma.vaultState.findUnique({ where: { id: 'singleton' } })

    return {
      totalLiquidity: totalLiquidity.toString(),
      activeAdvances: activeAdvances.toString(),
      utilizationBps,
      currentAprBps,
      totalYieldPaid: db?.totalYieldPaid?.toString() ?? '0',
      updatedAt: db?.updatedAt ?? new Date(),
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
