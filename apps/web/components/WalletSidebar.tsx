'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

const SWI_MINT = '2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx'

/* Mock prices — replace with a real oracle later */
const PRICE_SOL  = 153.69
const PRICE_USDC = 1
const PRICE_SWI  = 0.5

type TokenHolding = {
  mint: string
  amount: string
}

type WalletSidebarProps = {
  isOpen: boolean
  onClose: () => void
  address: string
  copied: boolean
  onCopy: () => void
  onDisconnect: () => void
  nativeBalance: number | null
  usdcBalance: number | null
  swiBalance: number | null
  holdings: TokenHolding[]
  loading: boolean
  error: string
}

const fmt = (n: number, dp = 2) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })

const usd = (n: number | null) =>
  n === null
    ? '—'
    : `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* ────────────────────────────────────────────────────────────────────────── */
/*  WalletSidebar                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

export function WalletSidebar({
  isOpen,
  onClose,
  address,
  copied,
  onCopy,
  onDisconnect,
  nativeBalance,
  usdcBalance,
  swiBalance,
  holdings,
  loading,
  error,
}: WalletSidebarProps) {
  /* Lock body scroll while open */
  useEffect(() => {
    if (typeof document === 'undefined' || !isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  /* Close on ESC */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : ''

  const solUsd  = nativeBalance === null ? null : nativeBalance * PRICE_SOL
  const usdcUsd = usdcBalance   === null ? null : usdcBalance   * PRICE_USDC
  const swiUsd  = swiBalance    === null ? null : swiBalance    * PRICE_SWI

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ws-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="pointer-events-auto fixed inset-0 z-[70] bg-[#0A0F1F]/35 backdrop-blur-[2px]"
            aria-hidden
          />

          {/* Sidebar */}
          <motion.aside
            key="ws-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 240, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Connected Wallet"
            className="pointer-events-auto fixed inset-y-0 right-0 z-[80] flex w-full max-w-[400px] flex-col overflow-hidden border-l border-[#E8EAF0] bg-white text-[#0A0F1F] shadow-[-30px_0_60px_-20px_rgba(11,11,20,0.18)]"
          >
            <Header shortAddress={shortAddress} onClose={onClose} />

            <div className="flex-1 overflow-y-auto px-5 pb-6 [scrollbar-width:thin] [scrollbar-color:#D5D8E0_transparent]">
              <AddressBar address={address} copied={copied} onCopy={onCopy} />

              {error && (
                <p className="mt-4 rounded-xl border border-[#FF4757]/20 bg-[#FFEDEF] px-3 py-2 text-xs text-[#D63647]">
                  {error}
                </p>
              )}

              <div className="mt-5 space-y-2.5">
                <BalanceCard
                  token="SOL"
                  amount={nativeBalance}
                  decimals={4}
                  usdValue={solUsd}
                  loading={loading}
                  icon={<SolIcon />}
                />
                <BalanceCard
                  token="USDC"
                  amount={usdcBalance}
                  decimals={2}
                  usdValue={usdcUsd}
                  loading={loading}
                  icon={<UsdcIcon />}
                />
                <BalanceCard
                  token="SWI"
                  amount={swiBalance}
                  decimals={2}
                  usdValue={swiUsd}
                  loading={loading}
                  icon={<SwiTokenIcon />}
                  highlight
                />
              </div>

              <SectionTitle>Quick Actions</SectionTitle>
              <div className="grid grid-cols-3 gap-2.5">
                <ActionButton
                  href="/send"
                  icon={<SendIcon className="h-[18px] w-[18px]" />}
                  label="Send"
                  primary
                  onClick={onClose}
                />
                <ActionButton
                  href="/fund"
                  icon={<DownloadIcon className="h-[18px] w-[18px]" />}
                  label="Get USDC"
                  onClick={onClose}
                />
                <ActionButton
                  href="/explorer"
                  icon={<CompassIcon className="h-[18px] w-[18px]" />}
                  label="Explorer"
                  onClick={onClose}
                />
              </div>

              <SectionTitle>All Tokens</SectionTitle>
              {loading ? (
                <SkeletonRows />
              ) : holdings.length === 0 ? (
                <div className="rounded-2xl border border-[#E8EAF0] bg-[#F7F8FB] p-4 text-xs text-[#7E8597]">
                  No SPL token balances yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {holdings.map((h) => (
                    <TokenRow key={h.mint} mint={h.mint} amount={h.amount} />
                  ))}
                </div>
              )}
            </div>

            <DisconnectFooter onDisconnect={onDisconnect} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Header                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function Header({
  shortAddress,
  onClose,
}: {
  shortAddress: string
  onClose: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-5">
      <div className="flex items-center gap-3">
        <Avatar />
        <div>
          <p className="text-[15px] font-bold leading-tight text-[#0A0F1F]">
            Connected Wallet
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[11.5px] text-[#7E8597]">
              {shortAddress}
            </span>
            <span className="relative flex h-1.5 w-1.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            </span>
            <span className="text-[10.5px] font-semibold text-[#10B981]">
              Online
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close wallet"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#5A5F7A] transition-colors hover:bg-[#F1F2F6] hover:text-[#0A0F1F]"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

function Avatar() {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#7B61FF] via-[#5B2CFF] to-[#22D3EE] shadow-[0_6px_18px_-6px_rgba(91,44,255,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]">
      <span className="absolute left-1/2 top-[28%] h-[36%] w-[36%] -translate-x-1/2 rounded-full bg-white/55" />
      <span className="absolute left-1/2 top-[68%] h-[55%] w-[78%] -translate-x-1/2 rounded-t-full bg-white/30" />
    </span>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Address bar with copy + tooltip                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function AddressBar({
  address,
  copied,
  onCopy,
}: {
  address: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[#E8EAF0] bg-[#F7F8FB] p-1.5">
      <div className="flex-1 overflow-hidden px-2.5">
        <p className="truncate font-mono text-[11px] text-[#5A5F7A]">{address}</p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded-xl border border-[#E8EAF0] bg-white px-3 py-1.5 text-[11.5px] font-bold text-[#0A0F1F] transition-colors hover:bg-[#F1F2F6]"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? 'Copied' : 'Copy'}
        </button>

        <AnimatePresence>
          {copied && (
            <motion.span
              key="copy-tooltip"
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-lg bg-[#0A0F1F] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_-8px_rgba(0,0,0,0.35)]"
            >
              Copied wallet address
              <span className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-[#0A0F1F]" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Section title                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 mt-7 text-[12.5px] font-bold text-[#0A0F1F]">
      {children}
    </h3>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Balance cards                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function BalanceCard({
  token,
  amount,
  decimals,
  usdValue,
  loading,
  icon,
  highlight,
}: {
  token: string
  amount: number | null
  decimals: number
  usdValue: number | null
  loading: boolean
  icon: ReactNode
  highlight?: boolean
}) {
  const display =
    amount === null ? (loading ? '—' : '—') : fmt(amount, decimals)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
        highlight
          ? 'border-[#C9D4FF] bg-[#F2F4FF]'
          : 'border-[#E8EAF0] bg-white hover:bg-[#FAFBFD]'
      }`}
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#7E8597]">
            {token}
          </p>
          {highlight && (
            <span className="rounded-full text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#7E8597]">
              NATIVE
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[15px] font-extrabold leading-tight text-[#0A0F1F]">
          {display}{' '}
          <span className="text-[12px] font-semibold text-[#7E8597]">
            {token}
          </span>
        </p>
      </div>

      <div className="flex-none whitespace-nowrap text-right text-[13px] font-bold text-[#0A0F1F]">
        {usd(usdValue)}
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Action buttons                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

function ActionButton({
  href,
  icon,
  label,
  primary,
  onClick,
}: {
  href: string
  icon: ReactNode
  label: string
  primary?: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl px-3 py-3.5 text-[12.5px] font-semibold transition-all ${
        primary
          ? 'bg-[#2D45F2] text-white shadow-[0_10px_24px_-12px_rgba(45,69,242,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:bg-[#3457FF] hover:shadow-[0_16px_30px_-14px_rgba(45,69,242,0.7)]'
          : 'border border-[#E8EAF0] bg-white text-[#0A0F1F] hover:-translate-y-0.5 hover:border-[#D5D8E0] hover:bg-[#FAFBFD]'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Token rows                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function TokenRow({ mint, amount }: { mint: string; amount: string }) {
  const isSwi = mint === SWI_MINT
  const name = isSwi ? 'SWI' : 'Token'
  const shortMint = `${mint.slice(0, 4)}...${mint.slice(-4)}`
  const numericAmount = Number(amount)
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0
  const usdValue = isSwi ? safeAmount * PRICE_SWI : null

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl border border-[#E8EAF0] bg-white p-3 text-left transition-colors hover:bg-[#FAFBFD]"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full">
        {isSwi ? <SwiTokenIcon /> : <GenericTokenIcon className="h-7 w-7 text-[#7E8597]" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#0A0F1F]">{name}</p>
        <p className="truncate font-mono text-[11px] text-[#7E8597]">
          {shortMint}
        </p>
      </div>

      <div className="flex flex-col items-end">
        <p className="whitespace-nowrap text-sm font-extrabold text-[#0A0F1F]">
          {Number.isFinite(numericAmount)
            ? numericAmount.toLocaleString(undefined, {
                maximumFractionDigits: 4,
              })
            : amount}
        </p>
        {usdValue !== null && (
          <p className="whitespace-nowrap text-[11px] font-semibold text-[#7E8597]">
            {usd(usdValue)}
          </p>
        )}
      </div>

      <ChevronRightIcon className="h-4 w-4 flex-none text-[#B6BCCB]" />
    </button>
  )
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EAF0] bg-white p-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="h-10 w-10 animate-pulse rounded-full bg-[#F1F2F6]" />
            <div className="space-y-1.5">
              <span className="block h-3 w-16 animate-pulse rounded bg-[#F1F2F6]" />
              <span className="block h-2.5 w-24 animate-pulse rounded bg-[#F4F5F9]" />
            </div>
          </div>
          <span className="h-3 w-12 animate-pulse rounded bg-[#F1F2F6]" />
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Disconnect footer                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function DisconnectFooter({ onDisconnect }: { onDisconnect: () => void }) {
  return (
    <div className="border-t border-[#E8EAF0] bg-white p-5">
      <button
        type="button"
        onClick={onDisconnect}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#FFB4BD] bg-[#FFEDEF] px-5 py-3.5 text-sm font-bold text-[#E13344] transition-all hover:-translate-y-0.5 hover:border-[#FF8A95] hover:bg-[#FFE0E4]"
      >
        <DisconnectIcon className="h-4 w-4" />
        Disconnect Wallet
      </button>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Icons                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="8" y="8" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15V7a3 3 0 013-3h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3.5 12L20 5l-3 14-5-5-2.5 4-1-7-5-1z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CompassIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill="currentColor" />
    </svg>
  )
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DisconnectIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 12h-9m0 0l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GenericTokenIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    </svg>
  )
}

/* Solana coin */
function SolIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden>
      <defs>
        <linearGradient id="ws-sol-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0E1428" />
          <stop offset="100%" stopColor="#1A2342" />
        </linearGradient>
        <linearGradient id="ws-sol-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#ws-sol-bg)" />
      <g fill="url(#ws-sol-grad)">
        <path d="M18 22 L42 22 L46 26 L22 26 Z" />
        <path d="M18 30 L42 30 L46 34 L22 34 Z" />
        <path d="M18 38 L42 38 L46 42 L22 42 Z" />
      </g>
    </svg>
  )
}

/* USDC coin */
function UsdcIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden>
      <circle cx="32" cy="32" r="32" fill="#2775CA" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="white" strokeWidth="2.4" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize="22"
        fill="white"
      >
        $
      </text>
    </svg>
  )
}

/* Custom SWI token mark */
function SwiTokenIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="ws-swi-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B95FF" />
          <stop offset="100%" stopColor="#1B2AB0" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#ws-swi-grad)" />
      <path
        d="M14 38c5-2.5 9-7 18-7s13 4.5 18 7"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 28c5-2.5 9-7 18-7s13 4.5 18 7"
        stroke="white"
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  )
}
