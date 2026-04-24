'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function LiveStats() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  const { data } = useSWR(`${api}/api/stats`, fetcher, { refreshInterval: 5000 })

  const totalUsdc = data ? (Number(data.totalVolumeUsdc) / 1_000_000).toFixed(0) : '—'
  const savedNpr = data ? Number(data.totalSavedNpr).toLocaleString('en-IN') : '—'
  const transfers = data?.totalTransfers ?? '—'
  const apr = data ? (data.currentAprBps / 100).toFixed(1) : '—'

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
      {[
        { label: 'Total transferred', value: `$${totalUsdc}`, unit: 'USDC' },
        { label: 'Transfers completed', value: transfers, unit: 'txns' },
        { label: 'Fees saved vs WU', value: `Rs ${savedNpr}`, unit: 'NPR' },
        { label: 'LP yield APR', value: `${apr}%`, unit: 'current' },
      ].map(s => (
        <div key={s.label} className="bg-surface rounded-2xl p-5 border border-border">
          <p className="text-dim text-xs uppercase tracking-wide mb-1">{s.label}</p>
          <p className="text-txt text-2xl font-bold">{s.value}</p>
          <p className="text-muted text-xs mt-1">{s.unit}</p>
        </div>
      ))}
    </section>
  )
}
