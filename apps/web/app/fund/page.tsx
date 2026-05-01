'use client'

import { usePrivy, useSolanaWallets } from '@privy-io/react-auth'
import { useEffect, useState, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import Link from 'next/link'

const API        = process.env.NEXT_PUBLIC_API_URL      ?? 'http://localhost:3001'
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const SWI_MINT   = '2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx'
const SWI_CAP    = 10_000
const CLAIM_AMT  = 1_000
const connection = new Connection(SOLANA_RPC, 'confirmed')

type ClaimRecord = { amount: number; sig: string; explorerUrl: string; ts: Date }
type FaucetState = 'idle' | 'loading' | 'success' | 'error'

async function fetchSwiBalance(address: string): Promise<number> {
  const accounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(address),
    { mint: new PublicKey(SWI_MINT) },
    'confirmed',
  )
  return accounts.value.reduce((sum, e) => {
    const ta = e.account.data.parsed?.info?.tokenAmount
    return sum + (ta?.uiAmount ?? Number(ta?.amount ?? 0) / 10 ** Number(ta?.decimals ?? 0))
  }, 0)
}

export default function FundPage() {
  const { ready, authenticated, login } = usePrivy()
  const { wallets } = useSolanaWallets()

  const [state, setState]       = useState<FaucetState>('idle')
  const [error, setError]       = useState('')
  const [history, setHistory]   = useState<ClaimRecord[]>([])
  const [balance, setBalance]   = useState<number | null>(null)
  const [lastSig, setLastSig]   = useState<{ sig: string; url: string } | null>(null)

  const address = wallets[0]?.address ?? ''
  const short   = address ? `${address.slice(0, 10)}...${address.slice(-6)}` : ''

  const refreshBalance = useCallback(async () => {
    if (!address) return
    try { setBalance(await fetchSwiBalance(address)) } catch { /* silent */ }
  }, [address])

  useEffect(() => {
    void refreshBalance()
    const id = setInterval(refreshBalance, 10_000)
    return () => clearInterval(id)
  }, [refreshBalance])

  const handleClaim = async () => {
    if (!address || state === 'loading') return
    setState('loading')
    setError('')
    setLastSig(null)
    try {
      const res  = await fetch(`${API}/api/faucet`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ walletAddress: address, amount: CLAIM_AMT }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Faucet request failed')
      setLastSig({ sig: data.signature ?? data.sig ?? '', url: data.explorerUrl ?? '' })
      setHistory(h => [{ amount: CLAIM_AMT, sig: data.signature ?? '', explorerUrl: data.explorerUrl ?? '', ts: new Date() }, ...h])
      setState('success')
      setTimeout(() => { setState('idle'); refreshBalance() }, 6000)
    } catch (e: any) {
      setError(e.message)
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  function timeAgo(d: Date) {
    const s = Math.floor((Date.now() - d.getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)} mins ago`
    return `${Math.floor(s / 3600)} hours ago`
  }

  const pct = balance !== null ? Math.min(100, Math.round((balance / SWI_CAP) * 100)) : 0

  /* ── Not connected ── */
  if (ready && !authenticated) {
    return (
      <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-6">
        <div className="glass-card rounded-2xl p-12 text-center max-w-md w-full">
          <span className="material-symbols-outlined text-5xl text-primary mb-6 block">token</span>
          <h1 className="font-manrope text-3xl font-bold text-white mb-4">Claim Demo Tokens</h1>
          <p className="text-on-surface-variant mb-8">Connect your wallet to access the SWI faucet and start testing.</p>
          <button
            onClick={login}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-manrope text-sm tracking-widest uppercase rounded-xl transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  if (!ready) return null

  /* ── Main ── */
  return (
    <div className="relative min-h-screen bg-[#0B0D10] overflow-hidden flex flex-col">
      {/* Atmospheric blobs */}
      <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/5 rounded-full blur-[150px] -z-10" />

      <div className="flex-grow pt-24 md:pt-32 pb-16 md:pb-24 px-5 md:px-8 max-w-[1280px] mx-auto w-full">
        <div className="flex flex-col gap-8 md:gap-12">

          {/* Header */}
          <header className="max-w-2xl">
            <h1 className="font-manrope text-4xl md:text-5xl lg:text-[72px] font-bold tracking-tight text-white mb-4 md:mb-6 leading-none">
              Claim Demo Tokens
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
              Access the SWIFLO ecosystem using demo SWI tokens. These tokens carry no
              real-world value and are for testing the high-speed transaction infrastructure.
            </p>
          </header>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Left: Faucet card ── */}
            <div className="lg:col-span-7">
              <div className="glass-card rounded-2xl p-8 shadow-2xl border-t border-l border-white/15">

                {/* Card header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl leading-none">token</span>
                  </div>
                  <div>
                    <h3 className="font-manrope text-2xl font-semibold text-white">Faucet Request</h3>
                    <p className="font-space-grotesk text-xs tracking-[0.2em] uppercase text-on-surface-variant">Instant Settlement System</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Wallet address field */}
                  <div className="space-y-2">
                    <label className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant ml-1">
                      Wallet Address
                    </label>
                    <div className="relative">
                      <input
                        readOnly
                        value={short}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-4 font-mono text-sm text-primary focus:border-primary/50 outline-none pr-12"
                      />
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-white/20 text-lg leading-none">lock</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/30 ml-1">
                      Currently restricted to your connected session wallet.
                    </p>
                  </div>

                  {/* Claim button */}
                  <button
                    onClick={handleClaim}
                    disabled={state === 'loading'}
                    className="group relative w-full overflow-hidden rounded-xl bg-[#1E2875] hover:bg-[#4A5CB5] py-5 transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(30,40,117,0.3)]"
                  >
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
                    <span className="relative z-10 font-manrope text-xl text-white tracking-widest flex items-center justify-center gap-3">
                      {state === 'loading' ? (
                        <>
                          <span className="material-symbols-outlined animate-spin leading-none">sync</span>
                          PROCESSING…
                        </>
                      ) : (
                        <>
                          CLAIM SWI
                          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform leading-none">arrow_forward</span>
                        </>
                      )}
                    </span>
                  </button>

                  {/* Success toast */}
                  {state === 'success' && lastSig && (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl leading-none">check_circle</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-manrope text-sm text-white font-semibold">Transaction Successful</p>
                        <p className="text-xs text-on-surface-variant font-mono truncate">
                          Hash: {lastSig.sig ? `${lastSig.sig.slice(0, 8)}...${lastSig.sig.slice(-4)}` : 'confirmed'}
                        </p>
                      </div>
                      {lastSig.url && (
                        <a
                          href={lastSig.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-space-grotesk text-xs uppercase tracking-widest text-primary hover:underline flex-shrink-0"
                        >
                          View
                        </a>
                      )}
                    </div>
                  )}

                  {/* Error toast */}
                  {state === 'error' && (
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                      <span className="material-symbols-outlined text-red-400 text-xl leading-none">error</span>
                      <p className="text-sm text-red-400 font-mono">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right: Balance + Activity ── */}
            <div className="lg:col-span-5 flex flex-col gap-6">

              {/* Balance widget */}
              <div className="glass-card rounded-2xl p-8 relative overflow-hidden border-t border-l border-white/15">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-8xl leading-none">account_balance</span>
                </div>
                <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-2">
                  Demo SWI Balance
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="font-manrope text-5xl font-bold text-white tabular-nums">
                    {balance !== null ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                  </span>
                  <span className="font-manrope text-2xl font-bold text-primary">SWI</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(185,195,255,0.5)' }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant whitespace-nowrap">{pct}% OF CAP</span>
                </div>
              </div>

              {/* Network Activity */}
              <div className="glass-card rounded-2xl p-6 flex-1 border-t border-l border-white/15">
                <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-6">
                  Network Activity
                </p>

                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <span className="material-symbols-outlined text-3xl text-gray-700">history</span>
                    <p className="text-gray-600 text-sm font-space-grotesk text-center">
                      No claims yet this session.<br />Claim SWI to see activity here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm text-indigo-400 leading-none">add</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Claimed {h.amount.toLocaleString()} SWI</p>
                            <p className="text-[10px] text-on-surface-variant">{timeAgo(h.ts)}</p>
                          </div>
                        </div>
                        {h.explorerUrl ? (
                          <a href={h.explorerUrl} target="_blank" rel="noreferrer">
                            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-lg leading-none">open_in_new</span>
                          </a>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/30 text-lg leading-none">open_in_new</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href="/explorer"
                  className="mt-6 flex items-center justify-center gap-2 py-3 border border-white/10 hover:bg-white/5 rounded-xl font-space-grotesk text-xs tracking-widest uppercase text-on-surface-variant hover:text-white transition-all"
                >
                  <span className="material-symbols-outlined text-sm leading-none">explore</span>
                  View All on Explorer
                </Link>
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
