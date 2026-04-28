import type { FastifyPluginAsync } from 'fastify'
import { getLiveNprPerUsd, calculateAmounts } from '../services/rateService'

export const rateRoutes: FastifyPluginAsync = async (app) => {
  // Live rate + optional fee calculation
  // GET /api/rates          → just the rate
  // GET /api/rates?amount=75 → rate + amounts for both providers
  app.get<{ Querystring: { amount?: string } }>('/api/rates', async (req) => {
    const { rate, source, cachedAt } = await getLiveNprPerUsd()
    const amountUsdc = parseFloat(req.query.amount ?? '0')

    const base = {
      nprPerUsd:   rate,
      source,
      cachedAt,
      swifloFeeBps: 40,
      wuFeeBps:     600,
    }

    if (!amountUsdc || amountUsdc <= 0) return base

    const calc = calculateAmounts(amountUsdc, rate)
    return {
      ...base,
      amountUsdc,
      swifloNpr:     calc.swifloNpr,
      wuNpr:         calc.wuNpr,
      savingsNpr:    calc.savingsNpr,
      swifloFeeUsdc: calc.swifloFeeUsdc,
      wuFeeUsdc:     calc.wuFeeUsdc,
      lockedRate:    rate.toFixed(4),
      recipientGetsNpr: calc.swifloNpr,
    }
  })

  // Keep old endpoint alive for compatibility
  app.get('/api/rate/current', async () => {
    const { rate, source, cachedAt } = await getLiveNprPerUsd()
    return {
      nprPerUsd:  rate,
      source,
      cachedAt,
      usdcToNprRate: Math.round(rate * 1_000_000).toString(),
    }
  })
}
