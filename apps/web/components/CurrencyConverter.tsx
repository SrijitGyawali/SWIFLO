'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface CurrencyInfo {
  name: string
  country: string
}

type CurrencyMap = Record<string, CurrencyInfo>

interface CurrencyConverterProps {
  onAmountChange?: (amount: number) => void
  nprPerUsd?: number
  showFamilyReceives?: boolean
}

export function CurrencyConverter({
  onAmountChange,
  nprPerUsd = 133.5,
  showFamilyReceives = true,
}: CurrencyConverterProps) {
  const [currencies, setCurrencies] = useState<CurrencyMap>({})
  const [selectedCurrency, setSelectedCurrency] = useState('AED')
  const [amount, setAmount] = useState('100')
  const [amountUsdc, setAmountUsdc] = useState<string>('')
  const [rate, setRate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const res = await fetch(`${API}/api/exchange/currencies`)
        const data = await res.json()
        setCurrencies(data)
      } catch (e) {
        console.error('Failed to load currencies:', e)
      }
    }
    loadCurrencies()
  }, [])

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setAmountUsdc('')
      setRate('')
      return
    }

    const convert = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(
          `${API}/api/exchange/convert?amountFiat=${amount}&currency=${selectedCurrency}`
        )
        const data = await res.json()
        if (data.error) {
          setError(data.error)
        } else {
          setAmountUsdc(data.amountUsdc)
          setRate(data.rate)
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(convert, 300)
    return () => clearTimeout(timeout)
  }, [amount, selectedCurrency])

  useEffect(() => {
    if (onAmountChange && amountUsdc) {
      onAmountChange(parseFloat(amountUsdc))
    }
  }, [amountUsdc, onAmountChange])

  const currencyList = Object.entries(currencies).filter(([code]) =>
    ['AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'].includes(code)
  )

  const selectedCountry = currencies[selectedCurrency]?.country ?? 'United Arab Emirates'
  const familyReceives = amountUsdc
    ? Math.round(parseFloat(amountUsdc) * nprPerUsd).toLocaleString('en-IN')
    : '0'

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-[#DCE6FF] bg-white/55 p-5 shadow-[0_18px_45px_-36px_rgba(47,91,255,0.45)]">
        <div className="mb-5 flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#2F5BFF]">
            <CardIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-extrabold text-[#2F5BFF]">I&apos;m sending from the Gulf</p>
            <p className="mt-1 text-sm font-bold text-[#7484B6]">
              {showFamilyReceives ? 'Send to family in Nepal' : 'Convert local currency to USDC'}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-bold text-[#60709A]">Where are you based?</label>
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={e => setSelectedCurrency(e.target.value)}
              disabled={loading || currencyList.length === 0}
              className="h-11 w-full appearance-none rounded-xl border border-[#DCE6FF] bg-white px-4 pr-10 text-sm font-extrabold text-[#07133A] outline-none transition-colors focus:border-[#7B95FF] disabled:opacity-60"
            >
              {currencyList.map(([code, info]) => (
                <option key={code} value={code}>
                  {info.country} ({code})
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2F5BFF]" />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-bold text-[#60709A]">Amount you have</label>
          <div className="flex h-14 items-center gap-3 rounded-xl border border-[#DCE6FF] bg-white px-4">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={e => {
                const next = e.target.value.replace(/[^\d.]/g, '')
                if ((next.match(/\./g) ?? []).length <= 1) setAmount(next)
              }}
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent text-2xl font-extrabold text-[#07133A] outline-none disabled:opacity-60"
              placeholder="100"
            />
            <span className="text-lg font-extrabold text-[#2F5BFF]">{selectedCurrency}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#FFD1D7] bg-[#FFF0F2] p-3 text-sm font-bold text-[#D92D43]">
            {error}
          </div>
        )}

        {amountUsdc && (
          <div className="grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] overflow-hidden rounded-xl border border-[#DCE6FF] bg-white">
            <div className="p-4">
              <p className="mb-2 text-xs font-bold text-[#7484B6]">You send</p>
              <p className="text-base font-extrabold text-[#07133A]">
                {amount} <span className="text-[#2F5BFF]">{selectedCurrency}</span>
              </p>
            </div>
            <div className="flex items-center justify-center border-x border-[#DCE6FF]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#7D8DB8] shadow-[0_8px_22px_-14px_rgba(17,25,54,0.5)]">
                <ArrowDownIcon className="h-5 w-5" />
              </span>
            </div>
            <div className="p-4">
              <p className="mb-2 text-xs font-bold text-[#7484B6]">
                {showFamilyReceives ? 'Your family receives' : 'You get'}
              </p>
              {showFamilyReceives ? (
                <p className="text-base font-extrabold text-[#00B879]">
                  Rs {familyReceives} <span className="text-sm">NPR</span>
                </p>
              ) : (
                <p className="text-base font-extrabold text-[#00B879]">
                  {amountUsdc} <span className="text-sm">USDC</span>
                </p>
              )}
            </div>
          </div>
        )}

        {!amountUsdc && !error && !loading && (
          <p className="rounded-xl border border-[#DCE6FF] bg-white/70 px-4 py-8 text-center text-sm font-bold text-[#7484B6]">
            {showFamilyReceives
              ? 'Enter an amount to see how much your family will receive'
              : 'Enter an amount to see your USDC quote'}
          </p>
        )}

        {loading && (
          <p className="rounded-xl border border-[#DCE6FF] bg-white/70 px-4 py-8 text-center text-sm font-bold text-[#2F5BFF]">
            Fetching live rates...
          </p>
        )}

        {rate && (
          <p className="mt-3 text-center text-xs font-semibold text-[#9AA8CB]">
            {selectedCountry} rate source active
          </p>
        )}
      </div>
    </div>
  )
}

function CardIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 10h17M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
