'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const STEPS = [
  { key: 'sent',      label: 'Sent from wallet', chip: 'CONFIRMED' },
  { key: 'confirmed', label: 'Confirmed on Solana', chip: 'SETTLED' },
  { key: 'advanced',  label: 'Local payout initiated', chip: 'PROCESSING' },
  { key: 'delivered', label: 'Delivered to eSewa', chip: 'PENDING', detail: 'Estimated in a few seconds' },
]

const LIVE_MESSAGES = [
  'Securing transaction...',
  'Routing payout...',
  'Confirming settlement...',
  'Preparing eSewa delivery...',
]

function ProcessingContent() {
  const { id } = useParams<{ id: string }>()
  const params = useSearchParams()
  const router = useRouter()
  const savingsNpr = params.get('savingsNpr') ?? '0'
  const amountNpr = params.get('amountNpr') ?? '0'
  const amountUsdc = params.get('amountUsdc') ?? ''
  const phone = params.get('phone') ?? ''

  const [step, setStep] = useState(1)
  const [messageIndex, setMessageIndex] = useState(0)
  const [transferStatus, setTransferStatus] = useState<string>('INITIATED')

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex(index => (index + 1) % LIVE_MESSAGES.length)
    }, 1800)
    return () => clearInterval(messageTimer)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/transfers/${id}/status`)
        if (!res.ok) return
        const data = await res.json()
        setTransferStatus(data.status ?? 'INITIATED')
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
    <div className="relative mx-auto min-h-[calc(100vh-96px)] w-full max-w-[1120px] overflow-hidden px-5 pb-12 pt-8 sm:px-8">
      <AmbientBackground />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[28px] border border-white/70 bg-white/55 p-6 shadow-[0_30px_90px_-58px_rgba(47,91,255,0.85)] backdrop-blur-xl sm:p-8"
        >
          <TransferOrbit />

          <div className="mt-7">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#7B8EC8]">Live transfer journey</p>
            <h1 className="mt-3 text-3xl font-extrabold text-[#07133A] sm:text-4xl">Moving funds at Solana speed</h1>
            <p className="mt-3 max-w-xl text-sm font-bold leading-6 text-[#60709A]">
              Funds are moving from the Gulf to Nepal in real time, verified on-chain and routed securely.
            </p>
          </div>

          <div className="mt-8">
            {STEPS.map((s, idx) => {
              const done = idx < step
              const active = idx === step
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.08, duration: 0.34 }}
                  className="relative grid grid-cols-[32px_minmax(0,1fr)_auto] gap-4 pb-8 last:pb-0"
                >
                  {idx < STEPS.length - 1 && (
                    <span className="absolute left-[15px] top-8 h-[calc(100%-28px)] w-px bg-gradient-to-b from-[#4F6BFF] via-[#BFD0FF] to-transparent" />
                  )}
                  <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-[0_0_22px_rgba(53,91,255,0.18)] ${
                    done ? 'border-[#00C982] bg-[#00C982]' : active ? 'border-[#4F6BFF] bg-white' : 'border-[#DCE6FF] bg-white'
                  }`}>
                    {done && <CheckIcon className="h-4 w-4 text-white" />}
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-[#4F6BFF]" />}
                  </span>
                  <div>
                    <p className={`text-sm font-extrabold ${done ? 'text-[#00B879]' : active ? 'text-[#355BFF]' : 'text-[#7B8EC8]'}`}>
                      {s.label}
                    </p>
                    {s.detail && active && <p className="mt-1 text-xs font-semibold text-[#60709A]">{s.detail}</p>}
                  </div>
                  <span className={`h-fit rounded-full px-3 py-1 text-[10px] font-extrabold ${
                    done
                      ? 'bg-[#E7FFF6] text-[#00A76F]'
                      : active
                        ? 'bg-[#EAF1FF] text-[#355BFF] shadow-[0_0_24px_rgba(53,91,255,0.18)]'
                        : 'bg-white text-[#8EA0C8]'
                  }`}>
                    {done ? s.chip : active ? s.chip : 'WAITING'}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          <div className="rounded-[28px] border border-white/70 bg-white/65 p-6 shadow-[0_30px_90px_-58px_rgba(47,91,255,0.85)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#7B8EC8]">Transfer status</p>
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="mt-2 text-xl font-extrabold text-[#07133A]"
                >
                  {LIVE_MESSAGES[messageIndex]}
                </motion.p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-extrabold text-[#355BFF]">
                <span className="h-2 w-2 rounded-full bg-[#355BFF]" />
                {transferStatus}
              </div>
              </div>
              <span className="rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-extrabold text-[#355BFF]">LIVE</span>
            </div>

            <div className="mt-6 grid gap-3">
              <InfoRow label="Transfer Amount" value={amountUsdc ? `${Number(amountUsdc).toLocaleString('en-IN')} USDC` : 'Calculating'} />
              <InfoRow label="Recipient Gets" value={`Rs ${Number(amountNpr).toLocaleString('en-IN')}`} />
              <InfoRow label="Network Fee" value="0.4%" />
              <InfoRow label="Saved" value={`Rs ${Number(savingsNpr).toLocaleString('en-IN')}`} success />
            </div>
          </div>

          <motion.button
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push('/')}
            className="group relative w-full overflow-hidden rounded-[28px] border border-[#CFE0FF] bg-white/60 p-6 text-left shadow-[0_30px_90px_-58px_rgba(47,91,255,0.85)] backdrop-blur-xl"
          >
            <span className="absolute inset-y-0 left-[-45%] w-1/3 rotate-12 bg-white/55 blur-md transition-transform duration-700 group-hover:translate-x-[420%]" />
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#355BFF] shadow-[0_18px_40px_-24px_rgba(53,91,255,0.9)]">
              <PaperPlaneIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 text-lg font-extrabold text-[#07133A]">You can safely leave this screen.</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#60709A]">We will notify you once delivery completes.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#355BFF]">
              Back to dashboard
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </motion.button>
        </motion.aside>
      </div>
    </div>
  )
}

export default function ProcessingPage() {
  return <Suspense><ProcessingContent /></Suspense>
}

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 opacity-[0.38] [background-image:linear-gradient(rgba(94,122,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(94,122,255,0.14)_1px,transparent_1px)] [background-size:44px_44px]" />
      <motion.div
        animate={{ x: [0, 26, 0], y: [0, -18, 0], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-12 top-10 h-48 w-48 rounded-full bg-[#6BA6FF]/25 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -22, 0], y: [0, 22, 0], opacity: [0.2, 0.42, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-10 h-52 w-52 rounded-full bg-[#A9F2FF]/35 blur-3xl"
      />
      {Array.from({ length: 10 }).map((_, idx) => (
        <motion.span
          key={idx}
          animate={{ y: [0, -18, 0], opacity: [0.18, 0.65, 0.18] }}
          transition={{ duration: 2.8 + idx * 0.25, repeat: Infinity, delay: idx * 0.18 }}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#355BFF]"
          style={{ left: `${8 + idx * 9}%`, top: `${18 + (idx % 5) * 13}%` }}
        />
      ))}
    </div>
  )
}

function TransferOrbit() {
  return (
    <div className="relative mx-auto h-64 max-w-[520px] overflow-hidden rounded-[28px] border border-[#DCE6FF] bg-gradient-to-br from-white via-[#F8FBFF] to-[#EAF4FF] shadow-inner">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 256" fill="none">
        <path d="M70 160C160 60 305 60 450 126" stroke="#D8E3FF" strokeWidth="3" strokeLinecap="round" />
        <motion.path
          d="M70 160C160 60 305 60 450 126"
          stroke="#355BFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="46 260"
          animate={{ strokeDashoffset: [0, -306] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
        />
      </svg>
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        className="absolute left-12 top-[138px] h-5 w-5 rounded-full bg-[#355BFF] shadow-[0_0_28px_rgba(53,91,255,0.75)]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="absolute right-14 top-[112px] h-8 w-8 rounded-full border-4 border-[#00C982] bg-white shadow-[0_0_32px_rgba(0,201,130,0.5)]"
      />
      <motion.div
        animate={{
          x: [54, 128, 218, 312, 428],
          y: [136, 70, 54, 78, 104],
          scale: [0.9, 1.04, 1, 1.04, 0.92],
        }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-0 top-0 h-16 w-16 rounded-full bg-gradient-to-br from-[#7EA0FF] to-[#355BFF] shadow-[0_26px_50px_-22px_rgba(53,91,255,0.9)]"
      >
        <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white">$</span>
      </motion.div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C9D8FF]"
      />
      <div className="absolute bottom-6 left-6 rounded-full bg-white/70 px-4 py-2 text-xs font-extrabold text-[#60709A] backdrop-blur">UAE</div>
      <div className="absolute bottom-6 right-6 rounded-full bg-white/70 px-4 py-2 text-xs font-extrabold text-[#60709A] backdrop-blur">Nepal</div>
    </div>
  )
}

function InfoRow({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#DCE6FF] bg-white/70 px-4 py-3">
      <span className="text-sm font-bold text-[#60709A]">{label}</span>
      <span className={`text-sm font-extrabold ${success ? 'text-[#00B879]' : 'text-[#07133A]'}`}>{value}</span>
    </div>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
