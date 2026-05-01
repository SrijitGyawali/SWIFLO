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

  const usdcNum  = parseFloat(amountUsdc) || 0
  const { data: rate, loading: rateLoading } = useRate(usdcNum)

  const nprPerUsd  = rate?.nprPerUsd  ?? 150.99
  const swifloNpr  = usdcNum > 0 ? (rate?.swifloNpr  ?? Math.round(usdcNum * nprPerUsd * 0.996)) : 0
  const wuNpr      = usdcNum > 0 ? (rate?.wuNpr      ?? Math.round(usdcNum * 148.256))            : 0
  const savingsNpr = usdcNum > 0 ? (rate?.savingsNpr ?? swifloNpr - wuNpr)                         : 0
  const swifloFeeNpr = usdcNum > 0 ? Math.round(usdcNum * nprPerUsd * 0.004) : 0

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
    <div className="relative min-h-screen bg-[#0B0D10] overflow-hidden flex flex-col">
      {/* Atmospheric blobs */}
      <div className="pointer-events-none fixed top-[10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[150px] -z-10" />
      <div className="pointer-events-none fixed bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[150px] -z-10" />

      <div className="flex-grow pt-24 md:pt-32 pb-16 md:pb-24 px-5 md:px-8 max-w-[1280px] mx-auto w-full">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-8 md:mb-12">
            <span className="font-space-grotesk text-xs tracking-[0.2em] text-primary uppercase mb-3 block">
              Direct Remittance
            </span>
            <h1 className="font-manrope text-4xl md:text-5xl lg:text-[56px] font-bold text-white mb-3 leading-tight tracking-tight">
              Send globally,{' '}
              <span className="text-primary">instantly.</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg max-w-md leading-relaxed">
              Bridge the gap between digital assets and local currency with SWIFLO's high-speed corridor.
            </p>
          </div>

          {/* Send Form Card */}
          <div className="glass-card rounded-3xl p-8 relative overflow-hidden shadow-[0_0_40px_rgba(30,40,117,0.15)]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />

            <div className="space-y-8">

              {/* Amount input */}
              <div className="space-y-3">
                <label className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant flex justify-between">
                  <span>Amount to Send</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rateLoading ? 'bg-gray-600' : 'bg-green-400 animate-pulse'}`} />
                    {rateLoading ? 'Fetching rate…' : `1 SWI = Rs ${nprPerUsd.toFixed(2)}`}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amountUsdc}
                    onChange={e => setAmountUsdc(e.target.value)}
                    className="w-full bg-[#050816] border border-white/10 rounded-2xl p-6 text-4xl font-bold text-white focus:border-indigo-500/50 focus:shadow-[0_0_0_1px_rgba(99,102,241,0.2)] outline-none transition-all placeholder:text-white/10 font-manrope pr-28"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
                    <span className="material-symbols-outlined text-primary text-base leading-none">token</span>
                    <span className="font-space-grotesk text-sm font-bold text-white">SWI</span>
                  </div>
                </div>
              </div>

              {/* Phone input */}
              <div className="space-y-3">
                <label className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant block">
                  Recipient eSewa/Phone Input
                </label>
                <div className={`relative bg-[#050816] border rounded-2xl transition-all ${phoneError ? 'border-red-500/50' : 'border-white/10 focus-within:border-indigo-500/50 focus-within:shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'}`}>
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-on-surface-variant pointer-events-none">
                    <span className="material-symbols-outlined text-xl leading-none">smartphone</span>
                    <span className="font-space-grotesk text-sm font-semibold text-white">🇳🇵 +977</span>
                    <div className="w-px h-5 bg-white/10" />
                  </div>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    maxLength={10}
                    className="w-full bg-transparent p-6 pl-36 text-xl font-mono text-white outline-none placeholder:text-white/10"
                  />
                </div>
                {phoneError && (
                  <p className="text-red-400 text-xs font-space-grotesk flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm leading-none">error</span>
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Transaction preview grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-2">Exchange Rate</p>
                  <p className="font-space-grotesk text-sm text-white">
                    1 SWI ≈ Rs {nprPerUsd.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-2">Swiflo Fee</p>
                  <p className="font-space-grotesk text-sm text-primary">
                    {usdcNum > 0 ? `Rs ${swifloFeeNpr.toLocaleString('en-IN')}` : '0.4% only'}
                  </p>
                </div>
              </div>

              {/* Savings callout — shown when amount entered */}
              {usdcNum > 0 && savingsNpr > 0 && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 text-center">
                  <span className="font-space-grotesk text-xs text-green-400">
                    Family gets Rs {savingsNpr.toLocaleString('en-IN')} more vs Western Union
                  </span>
                </div>
              )}

              {/* Total + CTA */}
              <div className="border-t border-white/10 pt-8">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-on-surface-variant text-base">Recipient receives approx.</span>
                  <span className="font-manrope text-2xl font-bold text-white tabular-nums">
                    {usdcNum > 0 ? `Rs ${swifloNpr.toLocaleString('en-IN')}` : 'Rs 0.00'}
                  </span>
                </div>

                <button
                  onClick={handleContinue}
                  disabled={submitting}
                  className="group relative w-full overflow-hidden rounded-2xl bg-[#1E2875] hover:bg-[#4A5CB5] py-6 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
                >
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
                  <span className="relative z-10 font-manrope text-xl text-white tracking-widest flex items-center justify-center gap-3">
                    {!ready ? (
                      'Loading…'
                    ) : !authenticated ? (
                      <>
                        <span className="material-symbols-outlined leading-none">account_balance_wallet</span>
                        Connect Wallet
                      </>
                    ) : submitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin leading-none">sync</span>
                        Getting rate…
                      </>
                    ) : (
                      <>
                        Confirm Send
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform leading-none">arrow_forward</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom info cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl flex items-center gap-6 group hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform flex-shrink-0">
                <span className="material-symbols-outlined text-2xl leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant">Recent Status</p>
                <p className="text-white font-medium mt-0.5">Last send successful</p>
              </div>
            </div>
            <div className="glass-card p-6 rounded-2xl flex items-center gap-6 group hover:border-primary/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                <span className="material-symbols-outlined text-2xl leading-none">bolt</span>
              </div>
              <div>
                <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant">Est. Speed</p>
                <p className="text-white font-medium mt-0.5">~ 12 Seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-10 md:py-12 border-t border-white/5 bg-[#0B0D10]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center px-5 md:px-8 gap-4">
          <p className="font-manrope text-xs tracking-widest text-gray-600 uppercase">
            © 2025 SWIFLO. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            {['Docs', 'GitHub', 'Twitter', 'Contact'].map(l => (
              <a key={l} href="#" className="font-manrope text-xs tracking-widest text-gray-600 hover:text-indigo-400 transition-colors uppercase">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
