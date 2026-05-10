'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const ACCENT       = '#2D45F2'
const ACCENT_LIGHT = '#7B95FF'
const CYAN         = '#22D3EE'

/* ────────────────────────────────────────────────────────────────────────── */
/*  WorldMapPaymentFlowSection                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export function WorldMapPaymentFlowSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[#EEF1FB] text-[#0A0F1F]">
      <BackgroundLayers />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:py-28">
        <Copy />
        <Visual />
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  LEFT — copy + chips + CTA + social proof                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function Copy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 lg:col-span-5"
    >
      <Badge />

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 text-[44px] font-extrabold leading-[1.04] tracking-tight text-[#0A0F1F] sm:text-[58px] lg:text-[68px]"
      >
        Stop losing money
        <br />
        to fees.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: 0.18 }}
        className="mt-5 max-w-md text-base leading-relaxed text-[#5A5F7A] sm:text-lg"
      >
        Join thousands of workers sending money home faster and cheaper.
      </motion.p>

      <FeatureChips />
      <PrimaryCTA />
    </motion.div>
  )
}

function Badge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: 0.05 }}
      className="inline-flex items-center gap-2 rounded-full border border-[#2D45F2]/15 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-[#2D45F2] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_8px_24px_-12px_rgba(45,69,242,0.35)] backdrop-blur"
    >
      <SparkleIcon className="h-3.5 w-3.5" />
      Fast, Secure, Effortless
    </motion.div>
  )
}

function FeatureChips() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: 0.26 }}
      className="mt-8 flex flex-wrap items-center gap-3"
    >
      <FeatureChip
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF2FF]">
            <LockIcon className="h-4 w-4 text-[#2D45F2]" />
          </span>
        }
        title="Instant"
        sub="Transfers"
      />
      <FeatureChip
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF2FF]">
            <ShieldIcon className="h-4 w-4 text-[#2D45F2]" />
          </span>
        }
        title="Low Fees"
        sub="Always"
      />
      <FeatureChip
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A0F1F]">
            <SolanaMark className="h-4 w-4" />
          </span>
        }
        title="Powered by"
        sub="Solana"
      />
    </motion.div>
  )
}

function FeatureChip({
  icon,
  title,
  sub,
}: {
  icon: ReactNode
  title: string
  sub: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-[0_8px_24px_-12px_rgba(45,69,242,0.18),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur">
      {icon}
      <div className="flex flex-col text-[12px] leading-tight text-[#0A0F1F]">
        <span className="font-bold">{title}</span>
        <span className="text-[#5A5F7A]">{sub}</span>
      </div>
    </div>
  )
}

function PrimaryCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: 0.34 }}
      className="mt-9"
    >
      <Link
        href="/send"
        className="group inline-flex items-center gap-2 rounded-full bg-[#1A2BE0] py-3.5 pl-6 pr-3 text-sm font-bold text-white shadow-[0_18px_36px_-14px_rgba(26,43,224,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#2236E8] hover:shadow-[0_24px_44px_-16px_rgba(26,43,224,0.85)]"
      >
        Send home now
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </Link>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  RIGHT — dotted world map + arc + flag pins + phone + coins                */
/* ────────────────────────────────────────────────────────────────────────── */

function Visual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto h-[520px] w-full max-w-[680px] sm:h-[600px] lg:col-span-7 lg:h-[680px]"
      aria-hidden
    >
      <DottedMapBackdrop />
      <ArcLayer />

      <div
        className="absolute"
        style={{ left: '30%', top: '60%', transform: 'translate(-50%, -50%)' }}
      >
        <FlagPin label="UAE / GULF" flag={<UaeFlagDisc />} delay={0.7} />
      </div>
      <div
        className="absolute"
        style={{ left: '60%', top: '26%', transform: 'translate(-50%, -50%)' }}
      >
        <FlagPin label="NEPAL" flag={<NepalFlagDisc />} delay={0.85} />
      </div>

      <PhoneOrbits />
      <PhoneMockup />
      <FloatingCoins />
    </motion.div>
  )
}

function FlagPin({
  flag,
  label,
  delay = 0,
}: {
  flag: ReactNode
  label: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-[#2D45F2]/30 blur-md" />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_10px_24px_-8px_rgba(45,69,242,0.5)] ring-2 ring-white">
          {flag}
        </span>
      </div>
      <span className="mt-2 rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.16em] text-[#0A0F1F] shadow-[0_4px_12px_-4px_rgba(11,11,20,0.18)] backdrop-blur">
        {label}
      </span>
    </motion.div>
  )
}

/* ─── Flag discs (no emoji — drawn so they look crisp at any size) ───────── */

function UaeFlagDisc() {
  return (
    <span className="relative block h-10 w-10 overflow-hidden rounded-full">
      <span className="absolute inset-y-0 left-0 w-1/4 bg-[#EF3340]" />
      <span className="absolute inset-x-0 left-1/4 top-0 h-1/3 bg-[#009A44]" />
      <span className="absolute inset-x-0 left-1/4 top-1/3 h-1/3 bg-white" />
      <span className="absolute inset-x-0 left-1/4 top-2/3 h-1/3 bg-[#0A0A0A]" />
    </span>
  )
}

function NepalFlagDisc() {
  return (
    <span className="relative block h-10 w-10 overflow-hidden rounded-full bg-[#003893]">
      <svg viewBox="0 0 60 70" className="absolute inset-0 h-full w-full">
        <path d="M5 5 L55 25 L25 25 L55 50 L5 50 Z" fill="#DC143C" stroke="#003893" strokeWidth="3" />
      </svg>
    </span>
  )
}

/* ─── Dotted world map (continents from a code-defined land mask) ────────── */

const LAND_MASSES: Array<[number, number, number, number]> = [
  // North America
  [200, 150, 95, 75],
  [130, 110, 55, 30],
  [225, 95,  85, 25],
  [240, 215, 35, 25],
  // Greenland
  [400, 100, 30, 35],
  // South America
  [320, 280, 38, 40],
  [330, 360, 38, 75],
  // Europe
  [510, 130, 60, 32],
  [560, 105, 35, 22],
  // Africa
  [560, 230, 55, 50],
  [570, 320, 50, 75],
  [600, 200, 25, 18],
  // Middle East
  [625, 215, 32, 38],
  // Asia
  [750, 145, 140, 65],
  [820, 100, 80, 25],
  [710, 235, 30, 45],
  [820, 245, 22, 28],
  // Indonesia
  [820, 295, 35, 12],
  [870, 300, 18, 8],
  // Australia
  [880, 370, 55, 30],
  [920, 360, 18, 12],
  // Japan
  [905, 175, 14, 22],
  // UK
  [475, 115, 12, 18],
  // New Zealand
  [970, 410, 12, 14],
]

const WORLD_DOTS = (() => {
  const cols = 90
  const rows = 45
  const stepX = 1000 / cols
  const stepY = 500 / rows
  const out: Array<{ x: number; y: number }> = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * stepX + stepX / 2
      const y = r * stepY + stepY / 2
      const isLand = LAND_MASSES.some(([cx, cy, rx, ry]) => {
        const dx = (x - cx) / rx
        const dy = (y - cy) / ry
        return dx * dx + dy * dy <= 1
      })
      if (isLand) out.push({ x, y })
    }
  }
  return out
})()

function DottedMapBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1000 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {WORLD_DOTS.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r="1.4"
          fill={ACCENT}
          fillOpacity="0.28"
        />
      ))}
    </svg>
  )
}

/* ─── Arc + traveling pulse ──────────────────────────────────────────────── */

function ArcLayer() {
  // viewBox 0..100; pin centers are at (30, 60) and (60, 26) in this space
  const path = 'M 30 60 C 35 22, 56 20, 60 26'

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="ws-arc" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"  stopColor={ACCENT_LIGHT} />
          <stop offset="55%" stopColor={CYAN} />
          <stop offset="100%" stopColor={ACCENT} />
        </linearGradient>
      </defs>

      {/* Soft glow underlay */}
      <path
        d={path}
        stroke={ACCENT_LIGHT}
        strokeWidth="9"
        fill="none"
        opacity="0.35"
        vectorEffect="non-scaling-stroke"
        style={{ filter: 'blur(6px)' }}
      />

      {/* Crisp animated dashed line */}
      <motion.path
        d={path}
        stroke="url(#ws-arc)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="3 5"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.6, delay: 0.5, ease: 'easeOut' }}
      />

      {/* Traveling pulse */}
      <circle r="0.8" fill={CYAN}>
        <animateMotion dur="3s" repeatCount="indefinite" path={path} />
      </circle>
      <circle r="2.2" fill={CYAN} opacity="0.32">
        <animateMotion dur="3s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  )
}

/* ─── Phone mockup with payment screen ──────────────────────────────────── */

function PhoneMockup() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute right-0 top-1/2 -translate-y-1/2 [perspective:1200px] sm:right-2 lg:right-4"
    >
      <div className="pointer-events-none absolute -inset-12 -z-10 rounded-[80px] bg-[#3D5BFF]/35 blur-[80px]" />

      <div className="relative h-[480px] w-[240px] rounded-[44px] border border-white/40 bg-gradient-to-br from-[#1B2A8E] via-[#2B3DD8] to-[#0F1755] p-2 shadow-[0_50px_100px_-30px_rgba(31,46,201,0.6),0_30px_60px_-20px_rgba(11,11,20,0.5)] sm:h-[540px] sm:w-[270px] [transform:rotate(-6deg)_rotateY(-5deg)]">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[36px] bg-gradient-to-br from-[#1A2A6B] via-[#0F1F5A] to-[#06093A] p-3">
          {/* Status bar + notch */}
          <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-semibold text-white/95">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <SignalIcon className="h-2.5 w-3.5 text-white/95" />
              <WifiIcon className="h-2.5 w-3 text-white/95" />
              <BatteryIcon className="h-2.5 w-4.5 text-white/95" />
            </span>
          </div>
          <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black/85" />

          {/* Notification card */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 rounded-2xl border border-white/15 bg-white/[0.08] p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#10B981] shadow-[0_0_0_3px_rgba(16,185,129,0.18)]">
                <CheckIcon className="h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-[12.5px] font-bold leading-tight text-white">
                  Payment Delivered
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-white/70">
                  Local payout completed
                </p>
              </div>
            </div>
          </motion.div>

          {/* You sent */}
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
            <p className="text-[10.5px] text-white/60">You sent</p>
            <p className="mt-1 text-[26px] font-extrabold leading-none tracking-tight text-white">
              500 AED
            </p>
          </div>

          {/* Down arrow */}
          <div className="my-2 flex justify-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
              <ArrowDownIcon className="h-3.5 w-3.5 text-white/90" />
            </span>
          </div>

          {/* Family received */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
            <p className="text-[10.5px] text-white/60">Family received</p>
            <p className="mt-1 text-[26px] font-extrabold leading-none tracking-tight text-white">
              Rs 20,565
            </p>
            <div className="mt-3 flex items-end justify-between border-t border-white/10 pt-3 text-[10.5px]">
              <div>
                <p className="text-white/50">Fee</p>
                <p className="mt-0.5 font-semibold text-white">Rs 80</p>
              </div>
              <div className="text-right">
                <p className="text-white/50">Time</p>
                <p className="mt-0.5 font-semibold text-white">~30 sec</p>
              </div>
            </div>
          </div>

          {/* Settled on Solana pill */}
          <div className="mt-auto pb-1 pt-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-white/95 py-2 text-[11px] font-bold text-[#0A0F1F] shadow-[0_10px_30px_-10px_rgba(11,11,20,0.4)]">
              <SolanaMark className="h-3 w-3" />
              Settled on Solana
            </div>
          </div>
        </div>
      </div>
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
      <ellipse cx="420" cy="320" rx="240" ry="80" stroke={ACCENT} strokeOpacity="0.12" strokeWidth="1" fill="none" transform="rotate(-12 420 320)" />
      <ellipse cx="420" cy="320" rx="200" ry="65" stroke={ACCENT} strokeOpacity="0.16" strokeWidth="1" fill="none" transform="rotate(18 420 320)" />
      <ellipse cx="420" cy="320" rx="270" ry="100" stroke={ACCENT} strokeOpacity="0.09" strokeWidth="1" fill="none" transform="rotate(50 420 320)" />
    </svg>
  )
}

/* ─── Floating Solana coins ─────────────────────────────────────────────── */

function FloatingCoins() {
  return (
    <>
      <FloatingCoin className="right-[2%] top-[14%]" size={56} delay={0} />
      <FloatingCoin className="right-[-2%] top-[44%]" size={70} delay={0.6} />
      <FloatingCoin className="right-[6%] bottom-[10%]" size={56} delay={1.2} />
      <FloatingCoin className="right-[40%] bottom-[18%]" size={42} delay={1.6} />
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

/* ────────────────────────────────────────────────────────────────────────── */
/*  Background layers                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function BackgroundLayers() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_70%_30%,#E5EAFA_0%,#EEF1FB_55%,#E2E7F4_100%)]" />
      <div className="pointer-events-none absolute -left-32 -top-40 -z-20 h-[520px] w-[520px] rounded-full bg-[#3D5BFF]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-44 -right-32 -z-20 h-[600px] w-[600px] rounded-full bg-[#7B95FF]/25 blur-[140px]" />
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Icons & Solana visuals                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function SparkleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z" fill="currentColor" />
      <path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14z" fill="currentColor" opacity="0.7" />
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

function ArrowDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10.5V8a4 4 0 018 0v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  )
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12.5l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
      <path d="M2 5a8 8 0 0112 0M4 7.5a5 5 0 018 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
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

function SolanaCoin({ width = 56, height = 56 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={width} height={height} aria-hidden>
      <defs>
        <radialGradient id="ws-solana-coin-face" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#A5BBFF" />
          <stop offset="40%" stopColor="#5478FF" />
          <stop offset="100%" stopColor="#1B2AB0" />
        </radialGradient>
        <linearGradient id="ws-solana-coin-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B95FF" />
          <stop offset="100%" stopColor="#1B2AB0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ws-solana-coin-rim)" />
      <circle cx="32" cy="32" r="26" fill="url(#ws-solana-coin-face)" />
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
        <linearGradient id="ws-solana-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <g fill="url(#ws-solana-mark-grad)">
        <path d="M14 18 L46 18 L50 22 L18 22 Z" />
        <path d="M14 30 L46 30 L50 34 L18 34 Z" />
        <path d="M14 42 L46 42 L50 46 L18 46 Z" />
      </g>
    </svg>
  )
}
