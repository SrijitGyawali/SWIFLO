const CACHE_TTL_MS   = 30_000
const FALLBACK_RATE  = 133.5   // NPR per USDC — last resort only
const SWIFLO_FEE_BPS = 40      // 0.4%
const WU_FEE_BPS     = 600     // 6%

// Pyth Hermes — USDC/USD price feed ID (mainnet + devnet same ID)
const PYTH_HERMES_URL   = 'https://hermes.pyth.network/v2/updates/price/latest'
const USDC_USD_FEED_ID  = '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'

let cachedRate: number | null = null
let cacheTime   = 0
let cacheSource = 'fallback'

// ── Pyth: get USDC/USD (should be ~1.000) ──────────────────────────────────
async function fetchUsdcUsdFromPyth(): Promise<number> {
  const url = `${PYTH_HERMES_URL}?ids[]=${USDC_USD_FEED_ID}`
  const res  = await fetch(url, { signal: AbortSignal.timeout(5000) })
  const data = await res.json() as any

  const feed  = data?.parsed?.[0]?.price
  if (!feed)  throw new Error('Pyth: no price data in response')

  // Pyth price = integer × 10^expo  (expo is negative, e.g. -8)
  const price = Number(feed.price) * Math.pow(10, Number(feed.expo))
  if (!price || price <= 0 || price > 1.1) throw new Error(`Pyth: suspicious USDC price ${price}`)
  return price  // ~1.0000
}

// ── ExchangeRate-API: get USD/NPR ──────────────────────────────────────────
async function fetchUsdNprFromExchangeApi(): Promise<number> {
  const res  = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { signal: AbortSignal.timeout(5000) })
  const data = await res.json()
  const rate = data?.rates?.NPR
  if (!rate || typeof rate !== 'number') throw new Error('ExchangeRate-API: missing NPR rate')
  return rate
}

// ── CoinGecko fallback: get USDC/NPR directly ─────────────────────────────
async function fetchFromCoinGecko(): Promise<number> {
  const res  = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=npr',
    { signal: AbortSignal.timeout(5000) }
  )
  const data = await res.json()
  const rate = data?.['usd-coin']?.npr
  if (!rate || typeof rate !== 'number') throw new Error('CoinGecko: missing rate')
  return rate
}

// ── Main export ────────────────────────────────────────────────────────────
export async function getLiveNprPerUsd(): Promise<{ rate: number; source: string; cachedAt: Date }> {
  const now = Date.now()
  if (cachedRate !== null && now - cacheTime < CACHE_TTL_MS) {
    return { rate: cachedRate, source: cacheSource, cachedAt: new Date(cacheTime) }
  }

  // Path 1 — Pyth USDC/USD  ×  ExchangeRate-API USD/NPR  (primary)
  try {
    const [usdcUsd, usdNpr] = await Promise.all([
      fetchUsdcUsdFromPyth(),
      fetchUsdNprFromExchangeApi(),
    ])
    const rate  = usdcUsd * usdNpr   // USDC → NPR
    cachedRate  = rate
    cacheTime   = now
    cacheSource = 'pyth+exchangerate-api'
    return { rate, source: 'pyth+exchangerate-api', cachedAt: new Date(now) }
  } catch { /* fall through */ }

  // Path 2 — ExchangeRate-API alone (Pyth failed)
  try {
    const rate  = await fetchUsdNprFromExchangeApi()
    cachedRate  = rate
    cacheTime   = now
    cacheSource = 'exchangerate-api'
    return { rate, source: 'exchangerate-api', cachedAt: new Date(now) }
  } catch { /* fall through */ }

  // Path 3 — CoinGecko (both above failed)
  try {
    const rate  = await fetchFromCoinGecko()
    cachedRate  = rate
    cacheTime   = now
    cacheSource = 'coingecko'
    return { rate, source: 'coingecko', cachedAt: new Date(now) }
  } catch { /* fall through */ }

  // Path 4 — last cached value or hardcoded fallback
  const rate = cachedRate ?? FALLBACK_RATE
  return { rate, source: 'fallback', cachedAt: new Date(cacheTime || now) }
}

// ── Fee calculation ────────────────────────────────────────────────────────
export function calculateAmounts(amountUsdc: number, nprPerUsd: number) {
  const grossNpr      = amountUsdc * nprPerUsd
  const swifloFeeUsdc = amountUsdc * (SWIFLO_FEE_BPS / 10_000)
  const swifloNpr     = Math.round((amountUsdc - swifloFeeUsdc) * nprPerUsd)
  const wuFeeUsdc     = amountUsdc * (WU_FEE_BPS / 10_000)
  const wuNpr         = Math.round((amountUsdc - wuFeeUsdc) * nprPerUsd)

  return {
    grossNpr:      Math.round(grossNpr),
    swifloNpr,
    wuNpr,
    savingsNpr:    swifloNpr - wuNpr,
    swifloFeeUsdc: parseFloat(swifloFeeUsdc.toFixed(4)),
    wuFeeUsdc:     parseFloat(wuFeeUsdc.toFixed(4)),
  }
}
