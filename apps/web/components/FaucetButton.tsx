'use client'

import { useState } from 'react'
import { useSolanaWallets } from '@privy-io/react-auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type State = 'idle' | 'loading' | 'success' | 'error'

export function FaucetButton() {
  const { wallets } = useSolanaWallets()
  const [state, setState] = useState<State>('idle')
  const [amount, setAmount] = useState('100')
  const [txUrl, setTxUrl] = useState('')
  const [error, setError] = useState('')

  const wallet = wallets[0]
  const amountNum = Number(amount)
  const hasValidAmount = Number.isFinite(amountNum) && amountNum > 0

  const handleFaucet = async () => {
    if (!wallet || !hasValidAmount) return
    setState('loading')
    setError('')
    try {
      const res = await fetch(`${API}/api/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.address, amount: amountNum }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Faucet failed')
      setTxUrl(data.explorerUrl)
      setState('success')
    } catch (e: any) {
      setError(e.message)
      setState('error')
    }
  }

  if (!wallet) return null

  return (
    <div className="w-full">
      <div className="mb-5 flex items-center gap-5">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full border border-[#DCE6F8] bg-[#F6FAFF] shadow-[0_14px_34px_-26px_rgba(47,91,255,0.4)]">
          <TestTubeIcon className="h-9 w-9 text-[#65C772]" />
        </div>
        <div>
          <p className="text-xl font-extrabold tracking-tight text-[#07133A]">Get test USDC</p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[#2D5BFF]">
            Devnet only · 0.1 SOL included for fees
            <InfoIcon className="h-4 w-4" />
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[#E3EAF8] bg-white/75 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          disabled={state === 'loading' || state === 'success'}
          className="min-w-0 flex-1 bg-transparent text-[32px] font-extrabold leading-none tracking-tight text-[#07133A] outline-none disabled:opacity-60"
        />
        <span className="text-xl font-extrabold text-[#2D5BFF]">USDC</span>
      </div>

      <button
        onClick={handleFaucet}
        disabled={state === 'loading' || state === 'success' || !hasValidAmount}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#2F5BFF] px-5 py-4 text-lg font-extrabold text-white shadow-[0_18px_42px_-24px_rgba(47,91,255,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#254DF0] disabled:translate-y-0 disabled:opacity-60"
      >
        {state === 'loading' ? 'Sending...' : state === 'success' ? 'Done!' : `Get ${hasValidAmount ? amountNum : 0} USDC`}
        {state === 'idle' && <ArrowRightIcon className="h-5 w-5" />}
      </button>

      {state === 'success' && txUrl && (
        <a
          href={txUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block text-center text-sm font-bold text-[#2D5BFF] hover:underline"
        >
          View transaction on Solana Explorer
        </a>
      )}
      {state === 'error' && (
        <p className="mt-4 rounded-2xl border border-[#FFD1D7] bg-[#FFF0F2] px-4 py-3 text-center text-sm font-bold text-[#D92D43]">
          {error}
        </p>
      )}
    </div>
  )
}

function TestTubeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M30 6l12 12" stroke="#8FA8FF" strokeWidth="4" strokeLinecap="round" />
      <path d="M19 15l14 14-13 13a9.9 9.9 0 01-14-14l13-13z" fill="#9FE870" stroke="#4E9D62" strokeWidth="2" />
      <path d="M16 20l12 12" stroke="#4E9D62" strokeWidth="2" />
      <circle cx="15" cy="32" r="2" fill="#4E9D62" />
      <circle cx="22" cy="31" r="1.5" fill="#4E9D62" />
      <circle cx="27" cy="15" r="2.5" fill="#9FE870" />
    </svg>
  )
}

function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
