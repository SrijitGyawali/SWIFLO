'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/* ────────────────────────────────────────────────────────────────────────── */
/*  FooterSection                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export function FooterSection() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#070B14] text-white">
      <TopGlow />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8">
        <CtaStrip />
        <FooterGrid />
        <BottomBar />
      </div>
    </footer>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Top decorative glow                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function TopGlow() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#3D5BFF]/60 to-transparent" />
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[1100px] -translate-x-1/2 rounded-full bg-[#2D45F2]/15 blur-[140px]" />
      <div className="pointer-events-none absolute -top-32 right-[10%] -z-10 h-[280px] w-[420px] rounded-full bg-[#7B61FF]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -top-24 left-[8%] -z-10 h-[260px] w-[380px] rounded-full bg-[#22D3EE]/10 blur-[120px]" />
    </>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  CTA strip                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function CtaStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-20 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-white/[0.02] p-8 shadow-[0_30px_80px_-30px_rgba(45,69,242,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-10 lg:p-14"
    >
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-[radial-gradient(120%_80%_at_80%_0%,rgba(61,91,255,0.25),transparent_60%)]" />

      <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px]">
            Ready to move money{' '}
            <span className="bg-gradient-to-r from-[#7B95FF] via-[#A0B5FF] to-[#22D3EE] bg-clip-text text-transparent">
              faster
            </span>
            ?
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-base">
            Experience instant cross-border settlement from the Gulf to Nepal.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/demo"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2D45F2] px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_40px_-14px_rgba(45,69,242,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#3457FF] hover:shadow-[0_24px_50px_-16px_rgba(45,69,242,0.85)]"
          >
            Try Demo
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/architecture"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.08]"
          >
            View Architecture
            <ExternalIcon className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main grid                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function FooterGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="mt-20 grid grid-cols-2 gap-x-8 gap-y-10 pb-12 sm:grid-cols-3 lg:grid-cols-12 lg:gap-x-10"
    >
      <BrandColumn />

      <FooterColumn
        title="Product"
        links={[
          { label: 'Send',     href: '/send' },
          { label: 'Explorer', href: '/explorer' },
          { label: 'Get SWI',  href: '/swi' },
          { label: 'Demo',     href: '/demo' },
        ]}
      />
      <FooterColumn
        title="Infrastructure"
        links={[
          { label: 'Onramper', href: 'https://onramper.com',     external: true },
          { label: 'Solana',   href: 'https://solana.com',       external: true },
          { label: 'Bridge',   href: 'https://www.bridge.xyz',   external: true },
          { label: 'Thunes',   href: 'https://www.thunes.com',   external: true },
          { label: 'Squads',   href: 'https://squads.so',        external: true },
        ]}
      />
      <FooterColumn
        title="Company"
        links={[
          { label: 'About',      href: '/about' },
          { label: 'Team',       href: '/team' },
          { label: 'Pitch Deck', href: '/pitch' },
          { label: 'Contact',    href: '/contact' },
        ]}
      />
      <FooterColumn
        title="Legal"
        links={[
          { label: 'Privacy Policy',    href: '/privacy' },
          { label: 'Terms of Use',      href: '/terms' },
          { label: 'Compliance Notice', href: '/compliance' },
        ]}
      />
    </motion.div>
  )
}

function BrandColumn() {
  return (
    <div className="col-span-2 sm:col-span-3 lg:col-span-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/15">
          <SwifloMark className="h-5 w-5 text-white" />
        </span>
        <span className="text-lg font-extrabold tracking-[0.18em] text-white">
          SWIFLO
        </span>
      </div>

      <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
        Instant cross-border payments powered by Solana settlement and global
        payout rails.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur">
        <SolanaMark className="h-3.5 w-3.5" />
        Built on Solana
      </div>
    </div>
  )
}

type FooterLink = {
  label: string
  href: string
  external?: boolean
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="lg:col-span-2">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
        {title}
      </h4>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLinkItem {...link} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterLinkItem({ label, href, external }: FooterLink) {
  const className =
    'group inline-flex items-center gap-1.5 text-sm text-white/65 transition-colors duration-200 hover:text-white'

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
        <ExternalIcon className="h-3 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-70" />
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Bottom bar                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function BottomBar() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] py-6 text-xs text-white/45 sm:flex-row sm:items-center"
    >
      <p>© 2026 SWIFLO. Built for the Gulf → Nepal corridor.</p>
      <p className="flex items-center gap-2">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981] shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
        Demo product
        <span className="text-white/25">·</span>
        Production integrations require regulated partners
      </p>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Icons                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5 12h14m0 0l-6-6m6 6l-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExternalIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M14 4h6v6m0-6L10 14M5 8v11a1 1 0 001 1h11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function SolanaMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="footer-solana-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <g fill="url(#footer-solana-mark)">
        <path d="M14 18 L46 18 L50 22 L18 22 Z" />
        <path d="M14 30 L46 30 L50 34 L18 34 Z" />
        <path d="M14 42 L46 42 L50 46 L18 46 Z" />
      </g>
    </svg>
  )
}
