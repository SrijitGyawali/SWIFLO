'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { CurrencyConverter } from '@/components/CurrencyConverter'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type RateData = {
  nprPerUsd: number
  source: string
  cachedAt: string
  swifloNpr?: number
  wuNpr?: number
  savingsNpr?: number
}

function useRate(amountUsdc: number) {
  const [data, setData]       = useState<RateData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const url = amountUsdc > 0
      ? `${API}/api/rates?amount=${amountUsdc}`
      : `${API}/api/rates`

    const fetch_ = () =>
      fetch(url)
        .then(r => r.json())
        .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
        .catch(() => setLoading(false))

    fetch_()
    const interval = setInterval(fetch_, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [amountUsdc])

  return { data, loading }
}

export default function SendPage() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()
  const [amountUsdc, setAmountUsdc] = useState('')
  const [phone, setPhone]           = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const usdcNum       = parseFloat(amountUsdc) || 0
  const { data: rate, loading: rateLoading } = useRate(usdcNum)

  const nprPerUsd   = rate?.nprPerUsd  ?? 133.5
  const swifloNpr   = usdcNum > 0 ? (rate?.swifloNpr  ?? Math.round(usdcNum * nprPerUsd * 0.996)) : 0
  const wuNpr       = usdcNum > 0 ? (rate?.wuNpr      ?? Math.round(usdcNum * nprPerUsd * 0.94))  : 0
  const savingsNpr  = usdcNum > 0 ? (rate?.savingsNpr ?? swifloNpr - wuNpr)                        : 0
  const grossNpr    = Math.round(usdcNum * nprPerUsd)

  const validate = () => {
    if (!phone.match(/^9[678]\d{8}$/)) {
      setPhoneError('Enter a valid 10-digit Nepali mobile number (starts with 96/97/98)')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSend = async () => {
    if (!authenticated) { login(); return }
    if (!validate() || usdcNum <= 0) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/api/transfers/estimate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amountUsdc: usdcNum }),
      })
      const estimate = await res.json()
      const params = new URLSearchParams({
        amountUsdc,
        phone:            `+977${phone}`,
        lockedRate:       String(estimate.lockedRate),
        recipientGetsNpr: String(estimate.recipientGetsNpr),
        savingsNpr:       String(estimate.savingsNpr),
        source:           estimate.source ?? 'live',
      })
      router.push(`/confirm?${params}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Transfer failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConverterAmountChange = (usdcAmount: number) => {
    setAmountUsdc(String(usdcAmount))
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-txt mb-2">Send money home</h1>
      <p className="text-muted mb-10">Instant transfer to eSewa in Nepal · 0.4% fee</p>

      {/* Currency converter for gulf workers */}
      <div className="mb-8">
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5 space-y-4">
          <CurrencyConverter onAmountChange={handleConverterAmountChange} nprPerUsd={nprPerUsd} />
          
          {/* Recipient eSewa number - part of converter section */}
          <div className="pt-4 border-t border-accent/20">
            <label className="text-dim text-xs font-semibold block mb-2">Recipient eSewa number</label>
            <div className={`bg-ink border px-4 py-3 flex items-center gap-3 rounded-xl ${phoneError ? 'border-danger' : 'border-accent/30'}`}>
              <span className="text-accent font-bold">🇳🇵 +977</span>
              <input
                type="tel"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={10}
                className="flex-1 bg-transparent text-txt text-lg outline-none placeholder-dim focus:outline-none"
              />
            </div>
            {phoneError && <p className="text-danger text-xs mt-2">{phoneError}</p>}
          </div>

          {/* Confirm & send button - part of converter section */}
          <button
            onClick={handleSend}
            disabled={submitting || !phone || usdcNum <= 0}
            className="w-full bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-colors"
          >
            {!ready ? 'Loading…' : !authenticated ? 'Connect wallet to continue' : submitting ? 'Getting rate…' : 'See full comparison →'}
          </button>
          <p className="text-dim text-xs text-center">Calls initiate_transfer on Solana Devnet · Rate locked</p>
        </div>
      </div>
    </div>
  )
}
