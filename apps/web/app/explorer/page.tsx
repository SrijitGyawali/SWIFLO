'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
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
  const { data: transfers = [], mutate } = useSWR<any[]>(`${API}/api/transfers?limit=50`, fetcher, { refreshInterval: 4000 })
  const { data: stats } = useSWR(`${API}/api/stats`, fetcher, { refreshInterval: 5000 })

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-extrabold text-txt mb-2">Transaction Explorer</h1>
      <p className="text-muted mb-8">Every Swiflo transfer · fully on-chain · publicly auditable</p>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total transfers', value: stats.totalTransfers },
            { label: 'Volume (USDC)', value: `$${(Number(stats.totalVolumeUsdc) / 1_000_000).toFixed(0)}` },
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
                <span className="text-txt font-bold">{(Number(t.amountUsdc) / 1_000_000).toFixed(2)} USDC</span>
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
