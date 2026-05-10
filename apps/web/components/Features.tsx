'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/* ────────────────────────────────────────────────────────────────────────── */
/*  Features                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

export function Features() {
  return (
    <section className="relative bg-[#EEF1FB] text-[#0A0F1F]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2D45F2]/40 to-transparent" />

      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:py-28">
        <SectionHeader />

        <div className="mt-14 flex flex-col gap-6">
          <FlowCard
            step="01"
            variant="text-left"
            partner="Onramper"
            heading="Fund with Onramper"
            description="Convert local currency into USDC."
            visual={<OnramperVisual />}
            chips={['AED', 'Card', 'Bank']}
          />
          <FlowCard
            step="02"
            variant="text-right"
            partner="Solana"
            heading="Settle on Solana"
            description="Move USDC through Swiflo’s on-chain escrow."
            visual={<SolanaSettleVisual />}
            chips={['4s settle', 'On-chain', 'Auditable']}
          />
          <FlowCard
            step="03"
            variant="text-left"
            partner="Bridge"
            heading="Off-ramp with Bridge"
            description="Convert Solana USDC into USD settlement rails."
            visual={<BridgeVisual />}
            chips={['USD', 'Settlement', 'Compliant']}
          />
          <FlowCard
            step="04"
            variant="text-right"
            partner="Thunes"
            heading="Payout with Thunes"
            description="Deliver funds through local bank and wallet networks."
            visual={<ThunesPayoutVisual />}
            chips={['130+ countries', 'Bank', 'eSewa']}
          />
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Section header                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function SectionHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="text-xs font-semibold tracking-[0.28em] text-[#2D45F2]">
        THE FLOW
      </p>
      <h2 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-[#0A0F1F] sm:text-5xl">
        From local money to
        <br className="hidden sm:block" />
        {' '}global settlement
      </h2>
      <p className="mt-5 text-base leading-relaxed text-[#5A5F7A] sm:text-lg">
        Swiflo connects on-ramp, stablecoin settlement, off-ramp, and local
        payout in one simple flow.
      </p>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Flow card                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

type FlowCardProps = {
  step: string
  variant: 'text-left' | 'text-right'
  partner: string
  heading: string
  description: string
  visual: ReactNode
  chips: string[]
}

function FlowCard({ step, variant, partner, heading, description, visual, chips }: FlowCardProps) {
  const textFirst = variant === 'text-left'

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group relative grid grid-cols-1 items-center gap-8 overflow-hidden rounded-3xl border border-[#0A0F1F]/8 bg-white p-6 shadow-[0_20px_50px_-25px_rgba(11,11,20,0.18)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#2D45F2]/30 hover:shadow-[0_30px_70px_-25px_rgba(45,69,242,0.25)] sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10"
    >
      <div className={textFirst ? 'lg:order-1' : 'lg:order-2'}>
        <FlowText step={step} partner={partner} heading={heading} description={description} />
      </div>

      <div className={textFirst ? 'lg:order-2' : 'lg:order-1'}>
        <div className="relative">
          {visual}
          <FloatingChips chips={chips} variant={variant} />
        </div>
      </div>
    </motion.article>
  )
}

function FlowText({
  step,
  partner,
  heading,
  description,
}: {
  step: string
  partner: string
  heading: string
  description: string
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2D45F2] to-[#1B2AB0] text-base font-extrabold tracking-tight text-white shadow-[0_10px_24px_-10px_rgba(45,69,242,0.55)]">
          {step}
        </span>
        <span className="rounded-full border border-[#2D45F2]/20 bg-[#2D45F2]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2D45F2]">
          {partner}
        </span>
      </div>
      <h3 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight text-[#0A0F1F] sm:text-4xl">
        {heading}
      </h3>
      <p className="mt-4 max-w-md text-base leading-relaxed text-[#5A5F7A]">
        {description}
      </p>
    </div>
  )
}

function FloatingChips({ chips, variant }: { chips: string[]; variant: 'text-left' | 'text-right' }) {
  const positions =
    variant === 'text-left'
      ? [
          'top-3 -left-2 sm:-left-4',
          '-top-3 right-6 sm:right-10',
          'bottom-4 -left-3 sm:-left-5',
        ]
      : [
          '-top-2 left-6 sm:left-10',
          'top-2 -right-2 sm:-right-4',
          'bottom-6 -right-3 sm:-right-5',
        ]

  return (
    <>
      {chips.map((chip, i) => (
        <motion.span
          key={chip}
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute z-20 inline-flex items-center gap-1.5 rounded-full border border-[#0A0F1F]/8 bg-white px-3 py-1.5 text-xs font-semibold text-[#0A0F1F] shadow-[0_10px_24px_-12px_rgba(11,11,20,0.2)] ${positions[i] ?? ''}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#2D45F2]" />
          {chip}
        </motion.span>
      ))}
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Visual — Step 01: Onramper                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function OnramperVisual() {
  return (
    <VisualFrame>
      <ConvertRow
        side="from"
        label="You pay"
        value="5,500"
        currency="AED"
        flag="🇦🇪"
      />

      <div className="my-2 flex justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0A0F1F]/8 bg-white shadow-[0_6px_16px_-8px_rgba(11,11,20,0.18)]">
          <ArrowDownIcon className="h-4 w-4 text-[#2D45F2]" />
        </span>
      </div>

      <ConvertRow
        side="to"
        label="You receive"
        value="1,500"
        currency="USDC"
        token
      />

      <PartnerFooter brand="Onramper" />
    </VisualFrame>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Visual — Step 02: Solana settle                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function SolanaSettleVisual() {
  return (
    <VisualFrame>
      <div className="rounded-2xl bg-gradient-to-br from-[#2335E6] via-[#1A2BE0] to-[#0E1A82] p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
            <SolanaMark className="h-3 w-3" />
            Solana
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
            Devnet
          </span>
        </div>
        <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-white/70">
          USDC locked in escrow
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">1,500 USDC</p>
      </div>

      <div className="mt-4 space-y-2.5">
        <DetailRow
          label="Tx signature"
          value={
            <span className="font-mono text-[11px] text-[#0A0F1F]">
              5xK3…9mNp
            </span>
          }
        />
        <DetailRow
          label="Confirmed"
          value={
            <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/12 px-2 py-0.5 text-xs font-semibold text-[#059669]">
              4s
              <CheckCircleIcon className="h-3 w-3" />
            </span>
          }
        />
      </div>

      <PartnerFooter brand="Solana" />
    </VisualFrame>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Visual — Step 03: Bridge off-ramp                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function BridgeVisual() {
  return (
    <VisualFrame>
      <ConvertRow
        side="from"
        label="From Solana"
        value="1,500"
        currency="USDC"
        token
      />

      <div className="my-2 flex justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#0A0F1F]/8 bg-white shadow-[0_6px_16px_-8px_rgba(11,11,20,0.18)]">
          <ArrowDownIcon className="h-4 w-4 text-[#2D45F2]" />
        </span>
      </div>

      <ConvertRow
        side="to"
        label="Settlement rails"
        value="1,499.40"
        currency="USD"
        flag="🇺🇸"
      />

      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#10B981]/10 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
          <ShieldIcon className="h-3.5 w-3.5" />
          Compliant
        </span>
        <span className="text-[11px] font-medium text-[#5A5F7A]">
          KYB / Travel Rule
        </span>
      </div>

      <PartnerFooter brand="Bridge" />
    </VisualFrame>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Visual — Step 04: Thunes payout                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function ThunesPayoutVisual() {
  return (
    <VisualFrame>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#0A0F1F]">Local payout</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/12 px-2 py-0.5 text-xs font-semibold text-[#059669]">
          <CheckCircleIcon className="h-3 w-3" />
          Delivered
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <PayoutRow
          icon={<LandmarkIcon className="h-4 w-4 text-[#2D45F2]" />}
          name="NIC Asia Bank"
          subtitle="Account ••• 4421"
          tone="primary"
        />
        <PayoutRow
          icon={<EsewaIcon className="h-4 w-4 text-[#2D45F2]" />}
          name="eSewa"
          subtitle="+977 98•••••21"
        />
        <PayoutRow
          icon={<WalletIcon className="h-4 w-4 text-[#2D45F2]" />}
          name="Khalti"
          subtitle="Mobile wallet"
        />
      </div>

      <div className="mt-4 rounded-xl bg-[#F4F5FA] px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#5A5F7A]">
            Sita receives
          </span>
          <span className="text-base font-extrabold tracking-tight text-[#0A0F1F]">
            Rs 2,01,000
          </span>
        </div>
      </div>

      <PartnerFooter brand="Thunes" />
    </VisualFrame>
  )
}

function PayoutRow({
  icon,
  name,
  subtitle,
  tone,
}: {
  icon: ReactNode
  name: string
  subtitle: string
  tone?: 'primary'
}) {
  const isPrimary = tone === 'primary'
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-2.5 ${
        isPrimary
          ? 'border-[#2D45F2]/30 bg-[#2D45F2]/5'
          : 'border-[#0A0F1F]/8 bg-white'
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-[0_4px_12px_-6px_rgba(11,11,20,0.15)]">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#0A0F1F]">{name}</p>
        <p className="text-[11px] text-[#5A5F7A]">{subtitle}</p>
      </div>
      {isPrimary && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2D45F2] text-white">
          <CheckIcon className="h-3 w-3" />
        </span>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shared visual primitives                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function VisualFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-3xl border border-[#0A0F1F]/8 bg-gradient-to-br from-white to-[#F4F5FA] p-5 shadow-[0_20px_40px_-20px_rgba(11,11,20,0.18)] sm:p-6">
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br from-[#2D45F2]/8 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  )
}

function ConvertRow({
  side,
  label,
  value,
  currency,
  flag,
  token,
}: {
  side: 'from' | 'to'
  label: string
  value: string
  currency: string
  flag?: string
  token?: boolean
}) {
  const isTo = side === 'to'
  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        isTo ? 'bg-[#2D45F2]/6 ring-1 ring-[#2D45F2]/15' : 'bg-[#F4F5FA]'
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#5A5F7A]">
        {label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-2xl font-extrabold tracking-tight text-[#0A0F1F]">
          {value}
        </span>
        {token ? (
          <TokenBadge code={currency} />
        ) : (
          <FlagBadge flag={flag ?? ''} code={currency} />
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#5A5F7A]">{label}</span>
      <span className="font-semibold text-[#0A0F1F]">{value}</span>
    </div>
  )
}

function TokenBadge({ code = 'USDC' }: { code?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#0A0F1F] shadow-[0_4px_12px_-6px_rgba(11,11,20,0.15)]">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2775CA] text-[8px] font-black text-white">
        $
      </span>
      {code}
    </span>
  )
}

function FlagBadge({ flag, code }: { flag: string; code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#0A0F1F] shadow-[0_4px_12px_-6px_rgba(11,11,20,0.15)]">
      <span className="text-base leading-none">{flag}</span>
      {code}
    </span>
  )
}

function PartnerFooter({ brand }: { brand: string }) {
  return (
    <div className="mt-5 flex items-center justify-between border-t border-[#0A0F1F]/6 pt-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[#5A5F7A]">
        Powered by
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0F1F]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#2D45F2]" />
        {brand}
      </span>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Icons                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function ArrowDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 5v14m0 0l-6-6m6 6l6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 12.5l4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z"
        fill="currentColor"
        opacity="0.18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.5l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LandmarkIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3l9 5H3l9-5z" fill="currentColor" />
      <path
        d="M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EsewaIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" opacity="0.18" />
      <path d="M7 10h10M7 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function WalletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 8a3 3 0 013-3h11a2 2 0 012 2v1H6a3 3 0 00-3 3V8z"
        fill="currentColor"
        opacity="0.4"
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

function SolanaMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g fill="currentColor">
        <path d="M14 18 L46 18 L50 22 L18 22 Z" />
        <path d="M14 30 L46 30 L50 34 L18 34 Z" />
        <path d="M14 42 L46 42 L50 46 L18 46 Z" />
      </g>
    </svg>
  )
}
