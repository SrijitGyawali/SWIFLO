'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Connection, PublicKey } from '@solana/web3.js'

const API       = process.env.NEXT_PUBLIC_API_URL      ?? 'http://localhost:3001'
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const POOL_USDC  = process.env.NEXT_PUBLIC_POOL_USDC   ?? ''
const fetcher    = (url: string) => fetch(url).then(r => r.json())

const PAGE_SIZE = 10

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)} mins ago`
  return `${Math.floor(s / 3600)} hours ago`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SETTLED' || status === 'DISBURSED') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
        <span className="material-symbols-outlined text-sm text-primary leading-none">verified</span>
        <span className="font-space-grotesk text-xs tracking-widest uppercase text-primary">SUCCESS</span>
      </div>
    )
  }
  if (status === 'FAILED') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30">
        <span className="material-symbols-outlined text-sm text-red-400 leading-none">error</span>
        <span className="font-space-grotesk text-xs tracking-widest uppercase text-red-400">FAILED</span>
      </div>
    )
  }
  // INITIATED / pending
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
      <span className="material-symbols-outlined text-sm text-gray-400 leading-none animate-spin" style={{ animationDuration: '2s' }}>sync</span>
      <span className="font-space-grotesk text-xs tracking-widest uppercase text-gray-400">VERIFYING</span>
    </div>
  )
}

export default function ExplorerPage() {
  const { data: transfersRaw, error: transfersError, isLoading: transfersLoading } = useSWR(`${API}/api/transfers?limit=200`, fetcher, { refreshInterval: 4000 })
  const transfers: any[] = Array.isArray(transfersRaw) ? transfersRaw : (transfersRaw?.data ?? transfersRaw?.transfers ?? [])
  const { data: stats }          = useSWR(`${API}/api/stats`, fetcher, { refreshInterval: 5000 })

  const { data: poolUsdcBalance, error: poolUsdcBalanceError, isLoading: poolUsdcBalanceLoading } = useSWR(
    POOL_USDC ? ['pool-usdc-balance', POOL_USDC, SOLANA_RPC] : null,
    async ([, poolAddress, rpc]) => {
      const connection = new Connection(rpc, 'confirmed')
      const balance = await connection.getTokenAccountBalance(new PublicKey(poolAddress), 'confirmed')
      return Number(balance.value.amount) / 1_000_000
    },
    { refreshInterval: 10000 },
  )

  const [copied, setCopied]   = useState(false)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(0)

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(t)
  }, [copied])

  const copyPoolAddress = async () => {
    if (!POOL_USDC || !navigator.clipboard) return
    await navigator.clipboard.writeText(POOL_USDC)
    setCopied(true)
  }

  const filtered = transfers.filter((t: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.solanaTxSignature?.toLowerCase().includes(q) ||
      String(t.amountUsdc).includes(q) ||
      String(t.recipientNpr).includes(q) ||
      t.recipientPhone?.includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const volume24hNpr = transfers
    .filter((t: any) => Date.now() - new Date(t.createdAt).getTime() < 86_400_000)
    .reduce((sum: number, t: any) => sum + Number(t.recipientNpr ?? 0), 0)

  return (
    <div className="relative min-h-screen bg-[#0B0D10]">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-[600px] atmospheric-radial -z-10" />

      <div className="pt-24 md:pt-32 pb-16 md:pb-24 px-5 md:px-8 max-w-[1280px] mx-auto">

        {/* Header */}
        <header className="mb-8 md:mb-12">
          <h1 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">Explorer</h1>
          <p className="text-on-surface-variant text-base md:text-lg max-w-2xl">
            Real-time ledger of all network activity. Verify transaction status and monitor asset flow across the SWIFLO ecosystem.
          </p>
        </header>

        {/* Metrics bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Network status */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 blur-3xl rounded-full transition-all group-hover:scale-150" />
            <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-3">NETWORK STATUS</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="font-manrope text-2xl font-bold text-white">Operational</h2>
            </div>
          </div>

          {/* Pool balance */}
          <div className="glass-card p-6 rounded-2xl">
            <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-3">POOL BALANCE (SWI)</p>
            <h2 className="font-manrope text-2xl font-bold text-white">
              {poolUsdcBalanceLoading && POOL_USDC
                ? '...'
                : poolUsdcBalanceError || !POOL_USDC
                ? '—'
                : (poolUsdcBalance ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </h2>
            {POOL_USDC && (
              <button
                onClick={copyPoolAddress}
                className="mt-2 font-space-grotesk text-xs text-on-surface-variant hover:text-white transition-colors font-mono truncate block max-w-full text-left"
                title={POOL_USDC}
              >
                {copied ? 'Copied!' : `${POOL_USDC.slice(0, 8)}...${POOL_USDC.slice(-6)}`}
              </button>
            )}
          </div>

          {/* 24h Volume */}
          <div className="glass-card p-6 rounded-2xl">
            <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-3">24H VOLUME (NPR)</p>
            <h2 className="font-manrope text-2xl font-bold text-white">
              {volume24hNpr > 0
                ? `रु ${volume24hNpr.toLocaleString('en-IN')}`
                : stats?.totalVolumeUsdc
                  ? `${(Number(stats.totalVolumeUsdc) / 1_000_000).toFixed(0)} SWI total`
                  : '—'}
            </h2>
          </div>
        </div>

        {/* Transaction table */}
        <section className="glass-card rounded-3xl overflow-hidden border border-white/5">

          {/* Table header */}
          <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-manrope text-xl font-semibold text-white">Recent Transactions</h3>
              {stats && (
                <p className="font-space-grotesk text-xs tracking-widest uppercase text-on-surface-variant mt-1">
                  {stats.totalTransfers ?? filtered.length} total · Rs {Number(stats.totalSavedNpr ?? 0).toLocaleString('en-IN')} saved vs WU
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 bg-[#050816] px-4 py-2 rounded-lg border border-white/10 focus-within:border-indigo-500 focus-within:shadow-[0_0_10px_rgba(30,40,117,0.3)] transition-all">
              <span className="material-symbols-outlined text-gray-500 text-lg leading-none">search</span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="bg-transparent border-none focus:ring-0 text-sm text-white w-full md:w-64 placeholder:text-gray-600 outline-none"
                placeholder="Search by hash, amount or phone"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  {['Transaction Hash', 'Amount', 'Status', 'Timestamp'].map(h => (
                    <th key={h} className="px-6 md:px-8 py-5 font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(transfersLoading && transfers.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-2xl text-gray-600 block mx-auto mb-2">sync</span>
                      Loading transactions…
                    </td>
                  </tr>
                )}
                {transfersError && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center">
                      <div className="inline-flex flex-col items-center gap-3 text-red-400">
                        <span className="material-symbols-outlined text-2xl">error</span>
                        <p className="text-sm font-mono">Cannot reach API at {API}</p>
                        <p className="text-xs text-gray-500">{String(transfersError?.message ?? transfersError)}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!transfersLoading && !transfersError && paged.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-on-surface-variant">
                      {search ? 'No results match your search.' : (
                        <>No transfers yet. <Link href="/send" className="text-primary underline">Send the first one →</Link></>
                      )}
                    </td>
                  </tr>
                )}
                {paged.map((t: any) => (
                  <tr key={t.id} className="hover:bg-white/[0.03] transition-colors group">
                    {/* Hash */}
                    <td className="px-6 md:px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-indigo-400/60 group-hover:text-indigo-400 transition-colors leading-none">token</span>
                        {t.solanaTxSignature ? (
                          <a
                            href={`https://explorer.solana.com/tx/${t.solanaTxSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-sm text-indigo-300 hover:text-primary transition-colors"
                          >
                            {t.solanaTxSignature.slice(0, 8)}...{t.solanaTxSignature.slice(-4)}
                          </a>
                        ) : (
                          <span className="font-mono text-sm text-gray-600">pending</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 md:px-8 py-5">
                      <div>
                        <p className="font-space-grotesk text-sm text-white">
                          {t.recipientNpr
                            ? `रु ${Number(t.recipientNpr).toLocaleString('en-IN')}`
                            : `${(Number(t.amountUsdc) / 1_000_000).toFixed(2)} SWI`}
                        </p>
                        <p className="font-mono text-xs text-on-surface-variant mt-0.5">{t.recipientPhone}</p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 md:px-8 py-5">
                      <StatusBadge status={t.status} />
                    </td>

                    {/* Time */}
                    <td className="px-6 md:px-8 py-5 font-mono text-sm text-on-surface-variant">
                      {timeAgo(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-5 md:p-6 bg-white/[0.01] flex items-center justify-between border-t border-white/5 gap-4">
            <p className="font-space-grotesk text-[10px] md:text-xs tracking-widest uppercase text-gray-500">
              {paged.length} / {filtered.length} txns
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 glass-card rounded hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm leading-none">chevron_left</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 glass-card rounded hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 md:mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-manrope text-xs tracking-widest text-gray-600 uppercase">
            © 2025 SWIFLO. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            {['Docs', 'GitHub', 'Twitter', 'Contact'].map(l => (
              <a key={l} href="#" className="font-manrope text-xs tracking-widest text-gray-600 hover:text-indigo-400 transition-colors uppercase">{l}</a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
