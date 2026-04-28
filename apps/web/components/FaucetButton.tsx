'use client'

import { useState } from 'react'
import { useSolanaWallets } from '@privy-io/react-auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type State = 'idle' | 'loading' | 'success' | 'error'

export function FaucetButton() {
  const { wallets } = useSolanaWallets()
  const [state, setState] = useState<State>('idle')
  const [amount, setAmount] = useState(100)
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
        body: JSON.stringify({ walletAddress: wallet.address, amount }),
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
      <div className="bg-success/10 border border-success/30 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🧪</span>
          <div>
            <p className="font-bold text-success">Get test SWI</p>
            <p className="text-success/70 text-sm">Devnet only · 0.1 SOL included for fees</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={e => setAmount(Math.max(1, Number(e.target.value)))}
            disabled={state === 'loading' || state === 'success'}
            className="flex-1 bg-ink border border-success/30 text-success font-bold text-xl rounded-xl px-4 py-3 outline-none focus:border-success disabled:opacity-60"
          />
          <span className="text-success font-bold text-lg">SWI</span>
        </div>

        <button
          onClick={handleFaucet}
          disabled={state === 'loading' || state === 'success'}
          className="w-full bg-success/20 hover:bg-success/30 border border-success/30 text-success font-bold py-3 rounded-xl text-lg transition-all disabled:opacity-60"
        >
          {state === 'loading' ? '⏳ Sending...' : state === 'success' ? '✅ Done!' : `Get ${amount} SWI →`}
        </button>
      </div>

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
