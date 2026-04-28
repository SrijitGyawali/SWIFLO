'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

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

  const handleContinue = async () => {
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
    } catch {
      alert('Could not fetch rate. Make sure the API is running.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-txt mb-2">Send money home</h1>
      <p className="text-muted mb-10">Instant transfer to eSewa in Nepal · 0.4% fee</p>

      {/* Live rate badge */}
      <div className="flex items-center gap-2 mb-6">
        <span className={`w-2 h-2 rounded-full ${rateLoading ? 'bg-dim' : 'bg-success'}`} />
        <span className="text-dim text-xs">
          {rateLoading
            ? 'Fetching live rate…'
            : `1 USDC = Rs ${nprPerUsd.toFixed(2)} · via ${rate?.source ?? 'live'} · updates every 30s`}
        </span>
      </div>

      {/* Amount */}
      <div className="mb-6">
        <label className="text-dim text-xs uppercase tracking-wide block mb-2">Amount (SWI)</label>
        <div className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center gap-3">
          <input
            type="number"
            placeholder="0.00"
            value={amountUsdc}
            onChange={e => setAmountUsdc(e.target.value)}
            className="flex-1 bg-transparent text-txt text-3xl font-bold outline-none placeholder-dim"
          />
          <span className="text-muted text-sm font-semibold bg-surface2 px-3 py-1 rounded-lg">SWI</span>
        </div>
        {usdcNum > 0 && (
          <p className="text-muted text-sm mt-2">≈ Rs {grossNpr.toLocaleString('en-IN')} NPR</p>
        )}
      </div>

      {/* Recipient */}
      <div className="mb-8">
        <label className="text-dim text-xs uppercase tracking-wide block mb-2">Recipient eSewa number</label>
        <div className={`bg-surface rounded-xl border px-4 py-3 flex items-center gap-3 ${phoneError ? 'border-danger' : 'border-border'}`}>
          <span className="text-txt">🇳🇵 +977</span>
          <input
            type="tel"
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={10}
            className="flex-1 bg-transparent text-txt text-lg outline-none placeholder-dim"
          />
        </div>
        {phoneError && <p className="text-danger text-xs mt-2">{phoneError}</p>}
      </div>

      {/* Live comparison */}
      {usdcNum > 0 && (
        <div className="bg-surface2 rounded-xl p-4 mb-6 border border-border space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>Western Union (6%)</span>
            <span>Rs {wuNpr.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-txt font-semibold">
            <span>Swiflo (0.4%)</span>
            <span className="text-success">Rs {swifloNpr.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-border pt-2 text-success text-center text-xs font-medium">
            Family gets Rs {savingsNpr.toLocaleString('en-IN')} more with Swiflo
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={submitting}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        {!ready ? 'Loading…' : !authenticated ? 'Connect wallet to continue' : submitting ? 'Getting rate…' : 'See full comparison →'}
      </button>
    </div>
  )
}
