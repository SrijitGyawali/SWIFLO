'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function useLiveRate() {
  const [nprPerUsd, setNprPerUsd] = useState(133.5)
  const [source, setSource]       = useState('loading')

  useEffect(() => {
    const load = () =>
      fetch(`${API}/api/rates`)
        .then(r => r.json())
        .then(d => { setNprPerUsd(d.nprPerUsd); setSource(d.source) })
        .catch(() => setSource('fallback'))

    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [])

  return { nprPerUsd, source }
}

export function SavingsCalculator() {
  const [nprAmount, setNprAmount] = useState(20000)
  const { nprPerUsd, source }     = useLiveRate()

  const usdc          = (nprAmount / nprPerUsd).toFixed(2)
  const swifloFee     = Math.round(nprAmount * 0.004)
  const wuFee         = Math.round(nprAmount * 0.06)
  const swifloReceives = nprAmount - swifloFee
  const wuReceives    = nprAmount - wuFee
  const savings       = swifloReceives - wuReceives

  return (
    <section className="py-16">
      <h2 className="text-3xl font-bold text-txt mb-2 text-center">Calculate your savings</h2>
      <p className="text-muted text-center mb-2">Move the slider to see how much you save</p>
      <p className="text-center text-xs text-dim mb-10">
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${source === 'loading' ? 'bg-dim' : 'bg-success'}`} />
        Live rate: 1 USD = Rs {nprPerUsd.toFixed(2)} · via {source} · refreshes every 30s
      </p>

      <div className="bg-surface rounded-2xl p-8 border border-border max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <label className="text-muted text-sm">Amount to send</label>
            <span className="text-txt font-bold text-lg">Rs {nprAmount.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={200000}
            step={1000}
            value={nprAmount}
            onChange={e => setNprAmount(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-dim text-xs mt-1">
            <span>Rs 1,000</span>
            <span>≈ {usdc} USDC</span>
            <span>Rs 2,00,000</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center bg-surface2 rounded-xl p-4">
            <div>
              <p className="text-muted text-sm">Western Union</p>
              <p className="text-danger text-xs">Fee: Rs {wuFee.toLocaleString('en-IN')} (6%)</p>
            </div>
            <p className="text-muted text-xl font-bold">Rs {wuReceives.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex justify-between items-center bg-accent/10 rounded-xl p-4 border border-accent">
            <div>
              <p className="text-txt font-semibold text-sm">Swiflo</p>
              <p className="text-success text-xs">Fee: Rs {swifloFee.toLocaleString('en-IN')} (0.4%)</p>
            </div>
            <p className="text-txt text-xl font-bold">Rs {swifloReceives.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-success/10 rounded-xl p-4 text-center border border-success/20">
            <p className="text-success font-bold text-lg">Family gets Rs {savings.toLocaleString('en-IN')} more</p>
          </div>
        </div>
      </div>
    </section>
  )
}
