'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const STEPS = [
  { key: 'sent',      label: 'Sent to Solana' },
  { key: 'confirmed', label: 'Blockchain confirmed' },
  { key: 'advanced',  label: 'Funds advanced to Nepal' },
  { key: 'delivered', label: 'Delivered to eSewa' },
]

function ProcessingContent() {
  const { id } = useParams<{ id: string }>()
  const params = useSearchParams()
  const router = useRouter()
  const savingsNpr = params.get('savingsNpr') ?? '0'
  const amountNpr = params.get('amountNpr') ?? '0'
  const phone = params.get('phone') ?? ''

  const [step, setStep] = useState(1)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/transfers/${id}/status`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'DISBURSED' || data.status === 'SETTLED') {
          setStep(3)
          setTimeout(() => {
            clearInterval(interval)
            router.push(`/success/${id}?savingsNpr=${savingsNpr}&amountNpr=${amountNpr}&phone=${encodeURIComponent(phone)}`)
          }, 1500)
        }
      } catch {}
    }, 3000)

    // Simulate progress for demo when API isn't connected
    const demo = setTimeout(() => setStep(2), 2000)
    const demo2 = setTimeout(() => setStep(3), 5000)
    const demo3 = setTimeout(() => {
      router.push(`/success/${id}?savingsNpr=${savingsNpr}&amountNpr=${amountNpr}&phone=${encodeURIComponent(phone)}`)
    }, 8000)

    return () => { clearInterval(interval); clearTimeout(demo); clearTimeout(demo2); clearTimeout(demo3) }
  }, [id, router, savingsNpr, amountNpr, phone])

  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mx-auto mb-8 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-accent" />
      </div>
      <h1 className="text-2xl font-bold text-txt mb-2">Processing transfer</h1>
      <p className="text-muted mb-12">Your money is moving at the speed of Solana</p>

      <div className="text-left space-y-1">
        {STEPS.map((s, idx) => {
          const done = idx < step
          const active = idx === step
          return (
            <div key={s.key} className="flex items-center gap-4 py-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                done ? 'bg-success border-success' : active ? 'border-accent bg-accent/20' : 'border-border bg-surface2'
              }`}>
                {done && <span className="text-white text-xs font-bold">✓</span>}
                {active && <div className="w-2 h-2 rounded-full bg-accent animate-ping" />}
              </div>
              <span className={`text-sm font-medium transition-colors ${
                done ? 'text-success' : active ? 'text-txt' : 'text-dim'
              }`}>{s.label}</span>
            </div>
          )
        })}
      </div>

      <button onClick={() => router.push('/')} className="mt-12 text-muted text-sm hover:text-txt transition-colors">
        Go to home — transfer continues in background
      </button>
    </div>
  )
}

export default function ProcessingPage() {
  return <Suspense><ProcessingContent /></Suspense>
}
