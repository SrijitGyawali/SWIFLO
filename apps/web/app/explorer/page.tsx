'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Connection, PublicKey } from '@solana/web3.js'
import { motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const POOL_USDC = process.env.NEXT_PUBLIC_POOL_USDC ?? ''
const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-[#FFF4D6] text-[#A76B00]',
  DISBURSED: 'bg-[#DCFCEB] text-[#047857]',
  SETTLED: 'bg-[#E6EBFF] text-[#2D45F2]',
  FAILED: 'bg-[#FFE4E8] text-[#D92D43]',
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function formatPoolBalance(value?: number) {
  if (value === undefined || Number.isNaN(value)) return '0.00 USDC'
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
}

export default function ExplorerPage() {
  const { data: transfers = [] } = useSWR<any[]>(`${API}/api/transfers?limit=50`, fetcher, { refreshInterval: 4000 })
  const { data: stats } = useSWR(`${API}/api/stats`, fetcher, { refreshInterval: 5000 })
  const [copied, setCopied] = useState(false)

  const {
    data: poolUsdcBalance,
    error: poolUsdcBalanceError,
    isLoading: poolUsdcBalanceLoading,
  } = useSWR(
    POOL_USDC ? ['pool-usdc-balance', POOL_USDC, SOLANA_RPC] : null,
    async ([, poolAddress, rpc]) => {
      const connection = new Connection(rpc, 'confirmed')
      const balance = await connection.getTokenAccountBalance(new PublicKey(poolAddress), 'confirmed')
      return Number(balance.value.amount) / 1_000_000
    },
    { refreshInterval: 10000 },
  )

  const copyPoolAddress = async () => {
    if (!POOL_USDC || typeof navigator === 'undefined' || !navigator.clipboard) return
    await navigator.clipboard.writeText(POOL_USDC)
    setCopied(true)
  }

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <div className="mx-auto w-full max-w-[1104px] px-5 pb-12 pt-8 sm:px-8">
      <section className="min-w-0">
          <div className="mb-5 rounded-2xl border border-[#B7DFFF]/70 bg-[#BEE7FF] px-5 py-5 shadow-[0_18px_45px_-30px_rgba(45,69,242,0.45)] sm:px-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#6F7DA8]">Pool USDC account</p>
                <div className="mt-2 flex min-w-0 items-center gap-2">
                  <p className="truncate font-mono text-sm font-extrabold text-[#121A36]" title={POOL_USDC || 'NEXT_PUBLIC_POOL_USDC not configured'}>
                    {POOL_USDC || 'NEXT_PUBLIC_POOL_USDC is not configured'}
                  </p>
                  {POOL_USDC && (
                    <button
                      type="button"
                      onClick={copyPoolAddress}
                      className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-[#2D45F2] transition-colors hover:bg-white/45"
                      aria-label="Copy pool address"
                    >
                      <CopyIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-base font-extrabold text-[#2D45F2]">
                  {poolUsdcBalanceLoading && POOL_USDC
                    ? 'Loading USDC balance...'
                    : poolUsdcBalanceError
                    ? 'Unable to load USDC balance'
                    : POOL_USDC
                    ? formatPoolBalance(poolUsdcBalance)
                    : 'Set NEXT_PUBLIC_POOL_USDC to view balance'}
                </p>
              </div>

              <button
                type="button"
                onClick={copyPoolAddress}
                disabled={!POOL_USDC}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#7B95FF] bg-[#D9F0FF]/70 px-5 py-3 text-sm font-extrabold text-[#2D45F2] shadow-[0_10px_24px_-18px_rgba(45,69,242,0.65)] transition-all hover:-translate-y-0.5 hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CopyIcon className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy address'}
              </button>
            </div>
          </div>

          {stats && (
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: 'Total transfers', value: stats.totalTransfers },
                { label: 'Volume (USDC)', value: `${(Number(stats.totalVolumeUsdc) / 1_000_000).toFixed(0)} USDC` },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-white/75 bg-white/55 px-5 py-4 shadow-[0_16px_40px_-28px_rgba(17,25,54,0.35)] backdrop-blur">
                  <p className="text-xs font-bold text-[#6F7DA8]">{s.label}</p>
                  <p className="mt-2 text-xl font-extrabold tracking-tight text-[#111936]">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-extrabold text-[#111936]">Recent Transactions</h2>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-[#DFE6F7] bg-white/65 px-4 text-sm text-[#7E8AAC] shadow-[0_10px_30px_-24px_rgba(17,25,54,0.45)] sm:w-80">
              <SearchIcon className="h-4 w-4 flex-none" />
              <span className="truncate">Search by tx hash, wallet or amount...</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {transfers.length === 0 && (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-[#DCE6F8] bg-white/70 px-6 text-center text-sm font-semibold text-[#6F7DA8] shadow-[0_20px_50px_-34px_rgba(17,25,54,0.35)]">
                No transfers yet. <Link href="/send" className="ml-1 text-[#3457FF] underline">Send the first one -&gt;</Link>
              </div>
            )}
            {transfers.map((t: any) => (
              <motion.article
                key={t.id}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-48px' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#DCE6F8] bg-white/75 px-4 py-3.5 shadow-[0_14px_34px_-28px_rgba(17,25,54,0.28)] transition-colors hover:bg-[#F8FBFF]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="whitespace-nowrap text-base font-extrabold text-[#101936]">
                      {(Number(t.amountUsdc) / 1_000_000).toFixed(2)} USDC
                    </span>
                    <span className="text-[#6F7DA8]">-&gt;</span>
                    <span className="truncate text-sm font-extrabold text-[#6073A9]">{t.recipientPhone}</span>
                  </div>
                  <div className="mt-1 max-w-sm truncate font-mono text-xs text-[#7E8AAC]">
                    {t.solanaTxSignature
                      ? <a href={`https://explorer.solana.com/tx/${t.solanaTxSignature}?cluster=devnet`} target="_blank" rel="noreferrer" className="transition-colors hover:text-[#2D45F2]">{t.solanaTxSignature.slice(0, 20)}...</a>
                      : 'pending'}
                  </div>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-extrabold ${STATUS_COLORS[t.status] ?? 'bg-white/10 text-[#8FA0C8]'}`}>
                    {t.status}
                  </span>
                  <p className="text-xs font-semibold text-[#6F7DA8]">{timeAgo(t.createdAt)}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
    </div>
  )
}

function CopyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15V6a1 1 0 011-1h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 12l16-7-4 15-4-6-5 3 3-5-6 0z" fill="currentColor" />
    </svg>
  )
}

function DownloadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CompassIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14.5 9.5l-1.4 3.6-3.6 1.4 1.4-3.6 3.6-1.4z" fill="currentColor" />
    </svg>
  )
}

function LogoutIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M10 7V6a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2h-6a2 2 0 01-2-2v-1M4 12h10m0 0l-3-3m3 3l-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UsdcIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="#2775CA" />
      <path d="M12 6.5v11M15 9.5c-.4-1-1.4-1.5-3-1.5-1.8 0-3 .8-3 2.1 0 1.5 1.5 1.9 3 2.2 1.5.3 3 .7 3 2.2 0 1.3-1.2 2.1-3 2.1-1.7 0-2.8-.6-3.2-1.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SwifloIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="url(#swiflo-icon-grad)" />
      <path d="M7 14c2-1 3.5-3 5-3s3 2 5 3M7 10c2-1 3.5-3 5-3s3 2 5 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="swiflo-icon-grad" x1="4" y1="4" x2="20" y2="20">
          <stop stopColor="#7B61FF" />
          <stop offset="0.55" stopColor="#3457FF" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function SolIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="4" fill="#242D52" />
      <path d="M8 9h8l-1.4 1.5h-8L8 9zM8 12h8l-1.4 1.5h-8L8 12zM8 15h8l-1.4 1.5h-8L8 15z" fill="url(#sol-icon-grad)" />
      <defs>
        <linearGradient id="sol-icon-grad" x1="7" y1="9" x2="16" y2="17">
          <stop stopColor="#14F195" />
          <stop offset="1" stopColor="#9945FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}
