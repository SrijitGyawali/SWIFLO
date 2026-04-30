'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Connection, PublicKey } from '@solana/web3.js'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const POOL_USDC = process.env.NEXT_PUBLIC_POOL_USDC ?? ''
const fetcher = (url: string) => fetch(url).then(r => r.json())

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'text-warning bg-warning/10',
  DISBURSED: 'text-success bg-success/10',
  SETTLED:   'text-accent bg-accent/10',
  FAILED:    'text-danger bg-danger/10',
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
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
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold text-txt mb-2">Transaction Explorer</h1>
      <p className="text-muted mb-8">Every Swiflo transfer · fully on-chain · publicly auditable</p>

      {/* Pool account overview */}
      <div className="bg-surface rounded-xl p-4 border border-border mb-8">
        <p className="text-dim text-xs mb-1">Pool SWI account</p>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-txt font-mono text-xs md:text-sm truncate" title={POOL_USDC || 'NEXT_PUBLIC_POOL_USDC not configured'}>
              {POOL_USDC || 'NEXT_PUBLIC_POOL_USDC is not configured'}
            </p>
            <p className="text-muted text-sm mt-1">
              {poolUsdcBalanceLoading && POOL_USDC
                ? 'Loading SWI balance...'
                : poolUsdcBalanceError
                ? 'Unable to load SWI balance'
                : POOL_USDC
                ? `${(poolUsdcBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SWI`
                : 'Set NEXT_PUBLIC_POOL_USDC to view balance'}
            </p>
          </div>

          <button
            type="button"
            onClick={copyPoolAddress}
            disabled={!POOL_USDC}
            className="self-start md:self-center bg-surface2 hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed text-txt text-sm font-semibold px-3 py-2 rounded-lg border border-border transition-colors"
          >
            {copied ? 'Copied' : 'Copy address'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total transfers', value: stats.totalTransfers },
            { label: 'Volume (SWI)', value: `${(Number(stats.totalVolumeUsdc) / 1_000_000).toFixed(0)} SWI` },
            { label: 'Fees saved vs WU', value: `Rs ${Number(stats.totalSavedNpr).toLocaleString('en-IN')}` },
          ].map(s => (
            <div key={s.label} className="bg-surface rounded-xl p-4 border border-border">
              <p className="text-dim text-xs mb-1">{s.label}</p>
              <p className="text-txt font-bold text-xl">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Transfer feed */}
      <div className="space-y-2">
        {transfers.length === 0 && (
          <div className="text-center text-muted py-20 bg-surface rounded-2xl border border-border">
            No transfers yet. <Link href="/send" className="text-accent underline">Send the first one →</Link>
          </div>
        )}
        {transfers.map((t: any) => (
          <div key={t.id} className="bg-surface hover:bg-surface2 transition-colors rounded-xl p-4 border border-border flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-txt font-bold">{(Number(t.amountUsdc) / 1_000_000).toFixed(2)} SWI</span>
                <span className="text-dim">→</span>
                <span className="text-muted text-sm">{t.recipientPhone}</span>
              </div>
              <div className="text-dim text-xs mt-1 font-mono truncate">
                {t.solanaTxSignature
                  ? <a href={`https://explorer.solana.com/tx/${t.solanaTxSignature}?cluster=devnet`} target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">{t.solanaTxSignature.slice(0, 20)}…</a>
                  : 'pending'}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${STATUS_COLORS[t.status] ?? 'text-muted'}`}>
                {t.status}
              </span>
              <p className="text-dim text-xs mt-1">{timeAgo(t.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
