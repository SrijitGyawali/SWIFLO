'use client'

import { usePrivy, useSolanaWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaucetButton } from '@/components/FaucetButton'

export default function FundPage() {
  const { ready, authenticated, login } = usePrivy()
  const { wallets } = useSolanaWallets()
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const wallet = wallets[0]
  const address = wallet?.address ?? ''
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!ready) return null

  if (!authenticated) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <p className="text-4xl mb-4">🔑</p>
        <h1 className="text-2xl font-bold text-txt mb-4">Connect first</h1>
        <p className="text-muted mb-8">Sign in to get your Solana wallet and load test funds</p>
        <button
          onClick={login}
          className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
        >
          Connect wallet
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-3xl font-extrabold text-txt mb-2">Add money</h1>
      <p className="text-muted mb-8">Fund your wallet to send your first transfer</p>

      {/* Wallet address */}
      {address && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-dim text-xs mb-1">Your Solana wallet</p>
            <p className="text-txt font-mono text-sm">{short}</p>
          </div>
          <button
            onClick={copy}
            className="text-xs text-accent hover:text-accent/80 bg-accent/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Option 1 — Test SWI faucet (primary demo path) */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">DEMO</span>
          <span className="text-muted text-sm">Recommended for testing</span>
        </div>
        <FaucetButton />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-ink px-3 text-dim text-xs">other options</span>
        </div>
      </div>

      {/* Option 2 — Card on-ramp (visual only) */}
      <button
        onClick={() => alert('Card on-ramp coming soon — post-hackathon with Transak integration')}
        className="w-full flex items-center justify-between bg-surface hover:bg-surface2 border border-border text-txt py-5 px-6 rounded-2xl text-lg transition-all mb-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div className="text-left">
            <p className="font-semibold">Buy with card</p>
            <p className="text-muted text-sm font-normal">Visa / Mastercard via Transak</p>
          </div>
        </div>
        <span className="text-dim text-xs bg-surface2 px-2 py-1 rounded-lg">Soon</span>
      </button>

      {/* Option 3 — Exchange transfer */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📤</span>
          <div>
            <p className="text-txt font-semibold">Transfer from exchange</p>
            <p className="text-muted text-sm">Binance, OKX, Kraken — send USDC (Solana network)</p>
          </div>
        </div>
        {address ? (
          <div>
            {/* QR placeholder */}
            <div className="bg-white rounded-xl p-4 w-32 h-32 mx-auto mb-4 flex items-center justify-center">
              <span className="text-ink text-xs text-center font-mono break-all">{address.slice(0, 12)}…</span>
            </div>
            <div className="bg-surface2 rounded-lg p-3 flex items-center justify-between gap-2">
              <span className="text-muted font-mono text-xs truncate">{address}</span>
              <button onClick={copy} className="text-accent text-xs flex-shrink-0 hover:underline">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-dim text-xs text-center mt-2">⚠️ Send on <strong>Solana</strong> network only</p>
          </div>
        ) : (
          <p className="text-dim text-sm text-center">Connect wallet to see your address</p>
        )}
      </div>

      <button
        onClick={() => router.push('/send')}
        className="w-full mt-8 bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        Send money now →
      </button>
    </div>
  )
}
