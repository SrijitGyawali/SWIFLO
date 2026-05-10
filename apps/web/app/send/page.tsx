'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CurrencyConverter } from '@/components/CurrencyConverter'
import { motion } from 'framer-motion'
import { WalletGate } from '@/components/WalletGate'

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
  return (
    <WalletGate
      title="Connect to send money"
      description="Connect your wallet to estimate rates, confirm transfers, and send funds securely."
    >
      <SendDashboard />
    </WalletGate>
  )
}

function SendDashboard() {
  const router = useRouter()
  const [amountUsdc, setAmountUsdc] = useState('')
  const [phone, setPhone]           = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const usdcNum       = parseFloat(amountUsdc) || 0
  const { data: rate } = useRate(usdcNum)

  const nprPerUsd   = rate?.nprPerUsd  ?? 133.5

  const validate = () => {
    if (!phone.match(/^9[678]\d{8}$/)) {
      setPhoneError('Enter a valid 10-digit Nepali mobile number (starts with 96/97/98)')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSend = async () => {
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
    <div className="mx-auto w-full max-w-[520px] px-5 pb-12 pt-8 sm:px-8">
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-[#DCE6FF] bg-white/70 p-5 shadow-[0_24px_70px_-45px_rgba(47,91,255,0.65)] backdrop-blur"
      >
        <CurrencyConverter onAmountChange={handleConverterAmountChange} nprPerUsd={nprPerUsd} />

        <div className="mt-5 border-t border-[#DCE6FF] pt-5">
          <label className="mb-2 block text-xs font-bold text-[#60709A]">Recipient eSewa number</label>
          <div className={`flex h-12 items-center overflow-hidden rounded-xl border bg-white ${phoneError ? 'border-[#D92D43]' : 'border-[#DCE6FF]'}`}>
            <span className="flex h-full items-center border-r border-[#DCE6FF] px-4 text-sm font-extrabold text-[#2F5BFF]">NP +977</span>
            <input
              type="tel"
              placeholder="9847033308"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={10}
              className="min-w-0 flex-1 bg-transparent px-4 text-base font-extrabold text-[#07133A] outline-none placeholder:text-[#9AA8CB]"
            />
            <UserIcon className="mr-4 h-5 w-5 flex-none text-[#60709A]" />
          </div>
          {phoneError && <p className="mt-2 text-xs font-bold text-[#D92D43]">{phoneError}</p>}
        </div>

        <button
          onClick={handleSend}
          disabled={submitting || !phone || usdcNum <= 0}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#355BFF] px-5 py-4 text-base font-extrabold text-white shadow-[0_18px_42px_-24px_rgba(53,91,255,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#294DF0] disabled:translate-y-0 disabled:opacity-60"
        >
          {submitting ? 'Getting rate...' : 'See full comparison'}
          <ArrowRightIcon className="h-5 w-5" />
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-[#60709A]">
          <LockIcon className="h-3.5 w-3.5 text-[#355BFF]" />
          Calls initiate_transfer on Solana Devnet - Rate locked
        </p>
      </motion.section>
    </div>
  )
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" />
    </svg>
  )
}

function UserIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
