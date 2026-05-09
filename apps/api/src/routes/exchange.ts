import type { FastifyPluginAsync } from 'fastify'

// Common migrant destination currencies
const SUPPORTED_CURRENCIES = {
  NPR: { name: 'Nepali Rupee', country: 'Nepal' },
  PKR: { name: 'Pakistani Rupee', country: 'Pakistan' },
  AED: { name: 'UAE Dirham', country: 'United Arab Emirates' },
  SAR: { name: 'Saudi Riyal', country: 'Saudi Arabia' },
  KWD: { name: 'Kuwaiti Dinar', country: 'Kuwait' },
  QAR: { name: 'Qatari Riyal', country: 'Qatar' },
  BHD: { name: 'Bahraini Dinar', country: 'Bahrain' },
  OMR: { name: 'Omani Rial', country: 'Oman' },
  INR: { name: 'Indian Rupee', country: 'India' },
  BGD: { name: 'Bangladeshi Taka', country: 'Bangladesh' },
  PHP: { name: 'Philippine Peso', country: 'Philippines' },
  THB: { name: 'Thai Baht', country: 'Thailand' },
}

const CACHE_TTL_MS = 30_000
let cachedRates: Map<string, { rate: number; cachedAt: number }> = new Map()

async function fetchExchangeRates(targetCurrency: string): Promise<number> {
  // Check cache
  const cached = cachedRates.get(targetCurrency)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.rate
  }

  try {
    // ExchangeRate-API: get USD/[CURRENCY]
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`,
      { signal: AbortSignal.timeout(5000) }
    )
    const data = await res.json() as any
    const rate = data?.rates?.[targetCurrency]
    
    if (!rate || typeof rate !== 'number') {
      throw new Error(`ExchangeRate-API: missing ${targetCurrency} rate`)
    }

    cachedRates.set(targetCurrency, { rate, cachedAt: Date.now() })
    return rate
  } catch (e) {
    // Try CoinGecko as fallback
    const coinGeckoMap: Record<string, string> = {
      NPR: 'nepali-rupee',
      PKR: 'pakistani-rupee',
      AED: 'uae-dirham',
      SAR: 'saudi-riyal',
      KWD: 'kuwaiti-dinar',
      QAR: 'qatari-riyal',
      BHD: 'bahraini-dinar',
      OMR: 'omani-rial',
      INR: 'indian-rupee',
      BGD: 'bangladeshi-taka',
      PHP: 'philippine-peso',
      THB: 'thai-baht',
    }

    const cgId = coinGeckoMap[targetCurrency]
    if (!cgId) throw e

    const cgRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=${targetCurrency.toLowerCase()}`,
      { signal: AbortSignal.timeout(5000) }
    )
    const cgData = await cgRes.json() as any
    const cgRate = cgData?.usd?.[targetCurrency.toLowerCase()]

    if (!cgRate || typeof cgRate !== 'number') throw new Error(`CoinGecko: missing ${targetCurrency} rate`)

    cachedRates.set(targetCurrency, { rate: cgRate, cachedAt: Date.now() })
    return cgRate
  }
}

export const exchangeRoutes: FastifyPluginAsync = async (app) => {
  // List all supported currencies
  app.get('/api/exchange/currencies', async () => {
    return SUPPORTED_CURRENCIES
  })

  // Get USD to fiat rate
  app.get<{ Querystring: { currency?: string } }>(
    '/api/exchange/rate',
    async (req) => {
      const targetCurrency = (req.query.currency ?? 'NPR').toUpperCase()

      if (!SUPPORTED_CURRENCIES[targetCurrency as keyof typeof SUPPORTED_CURRENCIES]) {
        throw new Error(`Unsupported currency: ${targetCurrency}`)
      }

      const rate = await fetchExchangeRates(targetCurrency)
      
      return {
        currency: targetCurrency,
        usdPerUnit: (1 / rate).toFixed(8),
        usdToRate: rate.toFixed(2),
        cachedAt: new Date(),
      }
    }
  )

  // Convert fiat to USDC (gulf worker onramp flow)
  app.get<{ Querystring: { amountFiat?: string; currency?: string } }>(
    '/api/exchange/convert',
    async (req) => {
      const amountFiat = parseFloat(req.query.amountFiat ?? '0')
      const targetCurrency = (req.query.currency ?? 'AED').toUpperCase()

      if (!req.query.amountFiat || isNaN(amountFiat) || amountFiat <= 0) {
        return { error: 'Invalid amount. Enter a number greater than 0.' }
      }

      if (!SUPPORTED_CURRENCIES[targetCurrency as keyof typeof SUPPORTED_CURRENCIES]) {
        throw new Error(`Unsupported currency: ${targetCurrency}`)
      }

      try {
        const rate = await fetchExchangeRates(targetCurrency)
        // rate is [CURRENCY] per USD, so USD per unit = 1/rate
        const amountUsdc = amountFiat / rate

        return {
          amountFiat,
          currency: targetCurrency,
          amountUsdc: amountUsdc.toFixed(2),
          rate: rate.toFixed(2),
          description: `${amountFiat} ${targetCurrency} = ${amountUsdc.toFixed(2)} USDC`,
          cachedAt: new Date(),
        }
      } catch (e: any) {
        throw new Error(`Failed to fetch exchange rate: ${e.message}`)
      }
    }
  )
}
