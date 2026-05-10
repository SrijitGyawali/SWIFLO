'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const COMPLETED_MESSAGES = [
  'Securing transaction...',
  'Routing payout...',
  'Confirming settlement...',
  'Transfer completed.',
]

function SuccessContent() {
  const { id } = useParams<{ id: string }>()
  const params = useSearchParams()
  const router = useRouter()
  const savingsNpr = parseInt(params.get('savingsNpr') ?? '0')
  const amountNpr = parseInt(params.get('amountNpr') ?? '0')
  const phone = params.get('phone') ?? ''

  const [signature, setSignature] = useState<string | null>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex(index => Math.min(index + 1, COMPLETED_MESSAGES.length - 1))
    }, 850)
    return () => clearInterval(timer)
  }, [])

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
    <div className="relative mx-auto min-h-[calc(100vh-96px)] w-full max-w-[1120px] overflow-hidden px-5 pb-12 pt-8 sm:px-8">
      <SuccessBackground />

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid items-center gap-8 rounded-[32px] border border-white/70 bg-white/52 p-6 shadow-[0_34px_100px_-60px_rgba(47,91,255,0.85)] backdrop-blur-xl md:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)] sm:p-8"
      >
        <SuccessIllustration />

        <section>
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="text-sm font-extrabold text-[#00A76F]"
          >
            {COMPLETED_MESSAGES[messageIndex]}
          </motion.p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#07133A] sm:text-4xl">Money delivered successfully</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-[#60709A]">
            Rs {amountNpr.toLocaleString('en-IN')} has been delivered to<br className="hidden sm:block" />
            <span className="text-[#07133A]"> {phone}</span>
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E7FFF6] px-4 py-2 text-xs font-extrabold text-[#00A76F]">
            <span className="h-2 w-2 rounded-full bg-[#00C982] shadow-[0_0_14px_rgba(0,201,130,0.75)]" />
            Completed in 12 seconds
          </span>

          <div className="mt-8 overflow-hidden rounded-[24px] border border-[#DCE6FF] bg-white/72 shadow-[0_28px_80px_-52px_rgba(47,91,255,0.8)] backdrop-blur">
            <SummaryRow icon={<WalletIcon className="h-5 w-5" />} label="Recipient receives" value={`Rs ${amountNpr.toLocaleString('en-IN')}`} />
            <SummaryRow icon={<ShieldIcon className="h-5 w-5" />} label="Network fee" value="0.4%" />
            <SummaryRow icon={<SparkIcon className="h-5 w-5" />} label="Saved vs Western Union" value={`Rs ${savingsNpr.toLocaleString('en-IN')}`} success />
          </div>

          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#355BFF] hover:underline"
            >
              View on Solana Explorer
              <ArrowUpRightIcon className="h-4 w-4" />
            </a>
          ) : (
            <p className="mt-6 text-sm font-bold text-[#60709A]">
              Transaction details are propagating - check the explorer shortly.
            </p>
          )}

          <button
            onClick={() => router.push('/')}
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#355BFF] px-5 py-4 text-base font-extrabold text-white shadow-[0_22px_48px_-24px_rgba(53,91,255,0.95)] transition-all hover:-translate-y-0.5 hover:bg-[#294DF0]"
          >
            Done
          </button>
        </section>
      </motion.div>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}

function SuccessBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,rgba(53,91,255,0.18)_1px,transparent_1px)] [background-size:38px_38px]" />
      <motion.div
        animate={{ x: [0, 28, 0], y: [0, -18, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-16 top-12 h-56 w-56 rounded-full bg-[#78A2FF]/25 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -26, 0], y: [0, 22, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-10 h-60 w-60 rounded-full bg-[#9DF5FF]/35 blur-3xl"
      />
    </div>
  )
}

function SuccessIllustration() {
  return (
    <div className="relative mx-auto flex h-[360px] w-full max-w-[360px] items-center justify-center">
      {Array.from({ length: 20 }).map((_, idx) => (
        <motion.span
          key={idx}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 0.92], opacity: [0, 1, 0.75], y: [0, -8, 0] }}
          transition={{ delay: 0.08 + idx * 0.025, duration: 0.8, repeat: Infinity, repeatDelay: 3.5 }}
          className="absolute h-2 w-2 rounded-full"
          style={{
            backgroundColor: ['#355BFF', '#00B879', '#FFC43D', '#FF6B6B'][idx % 4],
            left: `${50 + Math.cos((idx / 20) * Math.PI * 2) * 38}%`,
            top: `${50 + Math.sin((idx / 20) * Math.PI * 2) * 38}%`,
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{ scale: [0.7, 1.18, 1.42], opacity: [0.3, 0.18, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        className="absolute h-56 w-56 rounded-full border border-[#00C982]"
      />
      <motion.div
        initial={{ scale: 0.55, opacity: 0 }}
        animate={{ scale: [0.7, 1.3, 1.62], opacity: [0.24, 0.14, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.45, ease: 'easeOut' }}
        className="absolute h-56 w-56 rounded-full border border-[#355BFF]"
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute h-72 w-72 rounded-full border border-[#C9D8FF]"
      >
        <motion.span
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute right-8 top-8 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#8FB0FF] to-[#355BFF] text-lg font-black text-white shadow-[0_18px_40px_-18px_rgba(53,91,255,0.9)]"
        >
          $
        </motion.span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#18C981] shadow-[0_36px_80px_-32px_rgba(0,184,121,0.95)]"
      >
        <CheckIcon className="h-16 w-16 text-white" />
      </motion.div>

      <motion.div
        animate={{ x: [-120, 120], y: [58, -58], opacity: [0, 1, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute text-[#355BFF]"
      >
        <PaperPlaneIcon className="h-8 w-8" />
      </motion.div>
    </div>
  )
}

function SummaryRow({ icon, label, value, success = false }: { icon: ReactNode; label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#DCE6FF] px-5 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${success ? 'bg-[#E7FFF6] text-[#00A76F]' : 'bg-[#EAF1FF] text-[#355BFF]'}`}>
          {icon}
        </span>
        <span className="text-sm font-bold text-[#60709A]">{label}</span>
      </div>
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`text-sm font-extrabold ${success ? 'text-[#00B879]' : 'text-[#07133A]'}`}
      >
        {value}
      </motion.span>
    </div>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PaperPlaneIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.8 3.6L3.9 10.7c-1 .4-1 1.8.1 2.1l6 1.8 1.8 5.8c.3 1.1 1.8 1.2 2.2.2l7.1-16.8c.3-.8-.5-1.5-1.3-1.2zM12 14.5l-1.5 4.1-1.2-4 7.2-7.2-4.5 7.1z" />
    </svg>
  )
}

function ArrowUpRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 17L17 7m0 0H9m8 0v8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WalletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
