'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

/* ────────────────────────────────────────────────────────────────────────── */
/*  Hero                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#EEF1FB] text-[#0A0F1F]">
      <BackgroundLayers />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-12 pt-10 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:pb-16 lg:pt-14">
        <HeroCopy />
        <HeroVisual />
      </div>

      <InfrastructureRow />
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Left column — copy + CTAs                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function HeroCopy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 lg:col-span-6"
    >
      <Badge />

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 text-[44px] font-extrabold leading-[1.05] tracking-tight text-[#0A0F1F] sm:text-[56px] lg:text-[68px] lg:leading-[1.04]"
      >
        Instant Gulf-Nepal
        <br />
        corridor remittance
        <br />
        <span className="bg-gradient-to-r from-[#2D45F2] via-[#3457FF] to-[#1F2EC9] bg-clip-text text-transparent">
          on Solana
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18 }}
        className="mt-6 max-w-md text-base leading-relaxed text-[#5A5F7A] sm:text-lg"
      >
        Send money instantly between the Gulf and Nepal corridor with the speed
        and security of Solana.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.26 }}
        className="mt-9 flex flex-col gap-3 sm:flex-row"
      >
        <Link
          href="/send"
          className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1A2BE0] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(26,43,224,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#2236E8] hover:shadow-[0_18px_36px_-14px_rgba(26,43,224,0.8)]"
        >
          <WalletIcon className="h-4 w-4" />
          Connect Wallet
        </Link>
        <Link
          href="/explorer"
          className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0A0F1F]/15 bg-white/60 px-6 py-3.5 text-sm font-semibold text-[#0A0F1F] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#0A0F1F]/35 hover:bg-white"
        >
          Try Demo
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </motion.div>
  )
}

function Badge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.05 }}
      className="inline-flex items-center gap-2 rounded-full border border-[#2D45F2]/15 bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-[#2D45F2] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_24px_-12px_rgba(45,69,242,0.35)] backdrop-blur"
    >
      <SparkleIcon className="h-3.5 w-3.5" />
      Fast, Secure, Effortless
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Right column — phone + exchange card + coins                              */
/* ────────────────────────────────────────────────────────────────────────── */

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto h-[460px] w-full max-w-[560px] sm:h-[560px] lg:col-span-6 lg:h-[620px]"
      aria-hidden
    >
      <PhoneOrbits />
      <PhoneMockup />
      <ExchangeCard />
      <FloatingCoins />
    </motion.div>
  )
}

function PhoneMockup() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute inset-0 flex items-center justify-end pr-2 sm:pr-6 [perspective:1200px]"
    >
      <div className="pointer-events-none absolute right-6 top-1/2 h-[440px] w-[300px] -translate-y-1/2 rounded-[60px] bg-[#3457FF]/35 blur-[80px]" />

      <div className="relative h-[440px] w-[220px] rounded-[42px] border border-white/40 bg-gradient-to-br from-[#1B2A8E] via-[#2B3DD8] to-[#0F1755] p-2 shadow-[0_40px_80px_-30px_rgba(31,46,201,0.6),0_20px_40px_-20px_rgba(11,11,20,0.5)] sm:h-[520px] sm:w-[260px] [transform:rotate(-7deg)_rotateY(-6deg)]">
        <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-gradient-to-br from-[#3D5BFF] via-[#2742E8] to-[#0E1A82]">
          <div className="flex items-center justify-between px-6 pt-3 text-[10px] font-semibold text-white/95">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <SignalIcon className="h-2.5 w-3.5" />
              <WifiIcon className="h-2.5 w-3" />
              <BatteryIcon className="h-2.5 w-4.5" />
            </span>
          </div>

          <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-black/85" />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-md">
              <div className="absolute inset-0 rounded-2xl bg-white/10 blur-md" />
              <SwifloMark className="relative h-8 w-8 text-white" />
            </div>
            <p className="text-xl font-extrabold tracking-[0.32em] text-white">
              SWIFLO
            </p>
          </div>

          <svg
            className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-50"
            width="320"
            height="160"
            viewBox="0 0 320 160"
            fill="none"
          >
            <ellipse cx="160" cy="160" rx="220" ry="80" stroke="white" strokeOpacity="0.3" />
            <ellipse cx="160" cy="160" rx="160" ry="55" stroke="white" strokeOpacity="0.25" />
            <ellipse cx="160" cy="160" rx="100" ry="32" stroke="white" strokeOpacity="0.2" />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}

function ExchangeCard() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -16, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-2 top-1/2 z-20 w-[260px] -translate-y-1/2 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-[0_30px_60px_-20px_rgba(11,11,20,0.18),0_8px_24px_-8px_rgba(45,69,242,0.18)] backdrop-blur-xl sm:left-4 sm:w-[280px]"
    >
      <ExchangeRow
        label="You send"
        value="200"
        currency="AED"
        flag="🇦🇪"
      />

      <p className="mt-3 rounded-lg bg-[#F4F5FA] px-3 py-2 text-center text-[11px] font-medium text-[#5A5F7A]">
        1 AED = 41.13 NPR
      </p>

      <div className="my-3 h-px w-full bg-[#0A0F1F]/5" />

      <ExchangeRow
        label="You get"
        value="8,226.00"
        currency="NPR"
        flag="🇳🇵"
      />

      <div className="mt-4 flex items-center justify-between gap-2 text-[11px] font-semibold text-[#5A5F7A]">
        <span className="inline-flex items-center gap-1">
          <BoltIcon className="h-3 w-3 text-[#2D45F2]" />
          Instant
        </span>
        <span className="text-[#0A0F1F]/30">·</span>
        <span>Low Fee</span>
        <span className="text-[#0A0F1F]/30">·</span>
        <span>Secure</span>
      </div>
    </motion.aside>
  )
}

function ExchangeRow({
  label,
  value,
  currency,
  flag,
}: {
  label: string
  value: string
  currency: string
  flag: string
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#5A5F7A]">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-2xl font-extrabold tracking-tight text-[#0A0F1F]">
          {value}
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F5FA] px-2.5 py-1.5 text-xs font-semibold text-[#0A0F1F] transition-colors hover:bg-[#E8EBF5]"
        >
          <span className="text-base leading-none">{flag}</span>
          {currency}
          <ChevronDownIcon className="h-3 w-3 text-[#5A5F7A]" />
        </button>
      </div>
    </div>
  )
}

function FloatingCoins() {
  return (
    <>
      <FloatingCoin className="-right-2 top-10 sm:right-4 sm:top-14" size={70} delay={0} />
      <FloatingCoin className="right-24 -top-2 sm:right-28 sm:-top-2" size={56} delay={0.6} />
      <FloatingCoin className="-right-3 bottom-24 sm:right-2 sm:bottom-28" size={84} delay={1.1} />
      <FloatingCoin className="right-28 bottom-8 sm:right-36 sm:bottom-10" size={48} delay={1.6} />
    </>
  )
}

function FloatingCoin({
  className = '',
  size = 56,
  delay = 0,
}: {
  className?: string
  size?: number
  delay?: number
}) {
  return (
    <motion.div
      animate={{ y: [0, -14, 0], rotate: [-6, 6, -6] }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`pointer-events-none absolute z-30 ${className}`}
    >
      <SolanaCoin width={size} height={size} />
    </motion.div>
  )
}

function PhoneOrbits() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 600 600"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <ellipse
        cx="380"
        cy="300"
        rx="240"
        ry="80"
        stroke="#2D45F2"
        strokeOpacity="0.14"
        strokeWidth="1"
        fill="none"
        transform="rotate(-12 380 300)"
      />
      <ellipse
        cx="380"
        cy="300"
        rx="200"
        ry="65"
        stroke="#2D45F2"
        strokeOpacity="0.18"
        strokeWidth="1"
        fill="none"
        transform="rotate(18 380 300)"
      />
      <ellipse
        cx="380"
        cy="300"
        rx="270"
        ry="100"
        stroke="#2D45F2"
        strokeOpacity="0.1"
        strokeWidth="1"
        fill="none"
        transform="rotate(50 380 300)"
      />
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Background layers                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function BackgroundLayers() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_70%_30%,#E5EAFA_0%,#EEF1FB_55%,#E2E7F4_100%)]" />
      <div className="pointer-events-none absolute -left-32 -top-40 -z-20 h-[520px] w-[520px] rounded-full bg-[#3D5BFF]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-44 -right-32 -z-20 h-[600px] w-[600px] rounded-full bg-[#7B95FF]/25 blur-[140px]" />

      <div className="pointer-events-none absolute -z-10 right-[-6%] top-[8%] h-[640px] w-[860px] opacity-50 bg-[radial-gradient(circle,rgba(45,69,242,0.55)_1px,transparent_1.5px)] [background-size:14px_14px] [mask-image:radial-gradient(closest-side_at_60%_50%,black_35%,transparent_75%)] [-webkit-mask-image:radial-gradient(closest-side_at_60%_50%,black_35%,transparent_75%)]" />
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Bottom — infrastructure logos                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function InfrastructureRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative mx-auto max-w-7xl px-6 pb-12 sm:px-8"
    >
      <p className="text-center text-[11px] font-semibold tracking-[0.22em] text-[#7E7E92]">
        BUILT ON BEST-IN-CLASS INFRASTRUCTURE
      </p>
      <div className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-full border border-white/70 bg-white/70 px-8 py-4 shadow-[0_10px_30px_-10px_rgba(11,11,20,0.08)] backdrop-blur">
        <BrandPill name="Phantom" icon={<PhantomIcon className="h-5 w-5 text-[#7B61FF]" />} />
        <BrandPill name="Solana" icon={<SolanaMark className="h-5 w-5" />} />
        <BrandPill name="CoinBase" icon={<CoinbaseIcon className="h-5 w-5 text-[#1652F0]" />} />
        <BrandPill name="Turnkey" icon={<TurnkeyIcon className="h-5 w-5 text-[#0A0F1F]" />} />
      </div>
    </motion.div>
  )
}

function BrandPill({ name, icon }: { name: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-[#0A0F1F]">
      {icon}
      {name}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Icons                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z"
        fill="currentColor"
      />
      <path
        d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  )
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 12h14m0 0l-6-6m6 6l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WalletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 8a3 3 0 013-3h11a2 2 0 012 2v1H6a3 3 0 00-3 3V8z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M3 11a3 3 0 013-3h13a2 2 0 012 2v8a2 2 0 01-2 2H6a3 3 0 01-3-3v-6z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="17" cy="14.5" r="1.4" fill="currentColor" />
    </svg>
  )
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BoltIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  )
}

function SignalIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 14" fill="currentColor" className={className} aria-hidden>
      <rect x="0" y="9" width="3" height="5" rx="0.6" />
      <rect x="5" y="6" width="3" height="8" rx="0.6" />
      <rect x="10" y="3" width="3" height="11" rx="0.6" />
      <rect x="15" y="0" width="3" height="14" rx="0.6" />
    </svg>
  )
}

function WifiIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 12" fill="currentColor" className={className} aria-hidden>
      <path d="M8 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      <path
        d="M2 5a8 8 0 0112 0M4 7.5a5 5 0 018 0"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BatteryIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 14" fill="none" className={className} aria-hidden>
      <rect x="0.6" y="0.6" width="22" height="12.8" rx="3" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2" y="2" width="18" height="10" rx="2" fill="currentColor" />
      <rect x="23.5" y="4.5" width="2" height="5" rx="1" fill="currentColor" />
    </svg>
  )
}

function SwifloMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
      <path
        d="M8 26c4-2 7-6 12-6s8 4 12 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M8 18c4-2 7-6 12-6s8 4 12 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  )
}

function SolanaCoin({ width = 56, height = 56 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={width} height={height} aria-hidden>
      <defs>
        <radialGradient id="solana-coin-face" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#A5BBFF" />
          <stop offset="40%" stopColor="#5478FF" />
          <stop offset="100%" stopColor="#1B2AB0" />
        </radialGradient>
        <linearGradient id="solana-coin-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B95FF" />
          <stop offset="100%" stopColor="#1B2AB0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#solana-coin-rim)" />
      <circle cx="32" cy="32" r="26" fill="url(#solana-coin-face)" />
      <g fill="white" opacity="0.95">
        <path d="M20 22 L42 22 L46 26 L24 26 Z" />
        <path d="M18 30 L40 30 L44 34 L22 34 Z" />
        <path d="M20 38 L42 38 L46 42 L24 42 Z" />
      </g>
      <ellipse cx="26" cy="20" rx="10" ry="3" fill="white" opacity="0.18" />
    </svg>
  )
}

function SolanaMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="solana-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <g fill="url(#solana-mark-grad)">
        <path d="M14 18 L46 18 L50 22 L18 22 Z" />
        <path d="M14 30 L46 30 L50 34 L18 34 Z" />
        <path d="M14 42 L46 42 L50 46 L18 46 Z" />
      </g>
    </svg>
  )
}

function PhantomIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden>
      <path d="M32 6C18 6 8 16 8 30v22c0 1.5 1.5 2.5 3 1.7l5.5-3a3 3 0 013 0l4 2.3a3 3 0 003 0l4-2.3a3 3 0 013 0l4 2.3a3 3 0 003 0l4-2.3a3 3 0 013 0l5.5 3c1.5.8 3-.2 3-1.7V30C56 16 46 6 32 6z" />
      <circle cx="24" cy="28" r="3.5" fill="white" />
      <circle cx="40" cy="28" r="3.5" fill="white" />
    </svg>
  )
}

function CoinbaseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      <rect x="22" y="26" width="20" height="12" rx="2" fill="white" />
    </svg>
  )
}

function TurnkeyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      <circle cx="32" cy="26" r="6" fill="white" />
      <path d="M28 32h8v18a4 4 0 01-4 4 4 4 0 01-4-4V32z" fill="white" />
    </svg>
  )
}
