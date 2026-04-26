'use client'

import { useState } from 'react'
import { useSolanaWallets } from '@privy-io/react-auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type State = 'idle' | 'loading' | 'success' | 'error'

export function FaucetButton() {
  const { wallets } = useSolanaWallets()
  const [state, setState] = useState<State>('idle')
  const [txUrl, setTxUrl] = useState('')
  const [error, setError] = useState('')

  const wallet = wallets[0]

  const handleFaucet = async () => {
    if (!wallet) return
    setState('loading')
    setError('')
    try {
      const res = await fetch(`${API}/api/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.address }),
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
      <button
        onClick={handleFaucet}
        disabled={state === 'loading' || state === 'success'}
        className="w-full flex items-center justify-between bg-success/10 hover:bg-success/20 border border-success/30 text-success font-bold py-5 px-6 rounded-2xl text-lg transition-all disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <div className="text-left">
            <p className="font-bold">Get test USDC</p>
            <p className="text-success/70 text-sm font-normal">100 USDC + 0.1 SOL for fees · instant</p>
          </div>
        </div>
        <span className="text-success/60 text-sm">
          {state === 'loading' ? '⏳ Sending...' : state === 'success' ? '✅ Done!' : 'Devnet only →'}
        </span>
      </button>

      {state === 'success' && txUrl && (
        <a
          href={txUrl}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-accent text-xs mt-2 hover:underline"
        >
          View transaction on Solana Explorer ↗
        </a>
      )}
      {state === 'error' && (
        <p className="text-danger text-xs mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
