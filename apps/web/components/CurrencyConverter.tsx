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
  isSending?: boolean
}

export function CurrencyConverter({ onAmountChange, nprPerUsd = 133.5, isSending = false }: CurrencyConverterProps) {
  const [currencies, setCurrencies] = useState<CurrencyMap>({})
  const [selectedCurrency, setSelectedCurrency] = useState('AED')
  const [amount, setAmount] = useState('100')
  const [amountUsdc, setAmountUsdc] = useState<string>('')
  const [rate, setRate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load currencies on mount
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

  // Convert when amount or currency changes
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

  // Notify parent of amount changes
  useEffect(() => {
    if (onAmountChange && amountUsdc) {
      onAmountChange(parseFloat(amountUsdc))
    }
  }, [amountUsdc, onAmountChange])

  const currencyList = Object.entries(currencies).filter(([code]) =>
    ['AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'].includes(code)
  )

  return (
    <div className="w-full">
      <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💳</span>
          <div>
            <p className="font-bold text-accent">I'm sending from the Gulf</p>
            <p className="text-accent/70 text-sm">Send to family in Nepal</p>
          </div>
        </div>

        {/* Currency selector (Gulf countries only) */}
        <div className="mb-4">
          <label className="text-dim text-xs font-semibold block mb-2">Where are you based?</label>
          <select
            value={selectedCurrency}
            onChange={e => setSelectedCurrency(e.target.value)}
            disabled={loading || currencyList.length === 0}
            className="w-full bg-ink border border-accent/30 text-accent font-semibold rounded-xl px-4 py-3 outline-none focus:border-accent disabled:opacity-60 cursor-pointer"
          >
            {currencyList.map(([code, info]) => (
              <option key={code} value={code}>
                {info.country} ({code})
              </option>
            ))}
          </select>
        </div>

        {/* Amount local currency input */}
        <div className="mb-4">
          <label className="text-dim text-xs font-semibold block mb-2">Amount you have</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              step="0.1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={loading}
              className="flex-1 bg-ink border border-accent/30 text-accent font-bold text-lg rounded-xl px-4 py-3 outline-none focus:border-accent disabled:opacity-60"
              placeholder="100"
            />
            <span className="text-accent font-bold text-lg">{selectedCurrency}</span>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {amountUsdc && (
          <div className="bg-surface border border-accent/20 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-dim text-xs mb-1">You send</p>
              <p className="text-xl font-bold text-txt">
                {amount} <span className="text-accent">{selectedCurrency}</span>
              </p>
            </div>

            <div className="flex justify-center">
              <span className="text-dim text-2xl">↓</span>
            </div>

            <div>
              <p className="text-dim text-xs mb-1">Your family receives</p>
              <p className="text-2xl font-bold text-success">
                Rs {Math.round(parseFloat(amountUsdc) * nprPerUsd).toLocaleString('en-IN')} <span className="text-success text-lg">NPR</span>
              </p>
            </div>
          </div>
        )}

        {!amountUsdc && !error && !loading && (
          <p className="text-center text-dim text-sm py-8">Enter an amount to see how much your family will receive</p>
        )}

        {loading && (
          <p className="text-center text-accent text-sm py-8">Fetching live rates...</p>
        )}
      </div>
    </div>
  )
}
