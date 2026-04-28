'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function SuccessContent() {
  const { id } = useParams<{ id: string }>()
  const params = useSearchParams()
  const router = useRouter()
  const savingsNpr = parseInt(params.get('savingsNpr') ?? '0')
  const amountNpr = parseInt(params.get('amountNpr') ?? '0')
  const phone = params.get('phone') ?? ''

  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API}/api/transfers/${id}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setSignature(data.solanaTxSignature ?? null)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [id])

  const explorerUrl = signature
    ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    : undefined

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-4xl font-extrabold text-txt mb-3">Money sent!</h1>
      <p className="text-muted text-lg mb-10">
        Rs {amountNpr.toLocaleString('en-IN')} delivered to {phone}
      </p>

      <div className="bg-surface rounded-2xl border border-border p-6 mb-6 text-left space-y-4">
        {[
          { label: 'Recipient receives', value: `Rs ${amountNpr.toLocaleString('en-IN')}`, highlight: false },
          { label: 'Fee paid', value: '0.4%', highlight: false },
          { label: 'Saved vs Western Union', value: `Rs ${savingsNpr.toLocaleString('en-IN')}`, highlight: true },
        ].map(r => (
          <div key={r.label} className="flex justify-between items-center border-b border-border pb-4 last:border-0 last:pb-0">
            <span className="text-muted">{r.label}</span>
            <span className={`font-bold ${r.highlight ? 'text-success' : 'text-txt'}`}>{r.value}</span>
          </div>
        ))}
      </div>

      {explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="text-accent text-sm hover:underline block mb-8"
        >
          View on Solana Explorer ↗
        </a>
      ) : (
        <p className="text-muted text-sm mb-8">Transaction details are propagating — check the explorer shortly.</p>
      )}

      <button
        onClick={() => router.push('/')}
        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        Done
      </button>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}
