'use client'

import { usePrivy, useSolanaWallets } from '@privy-io/react-auth'
import { motion } from 'framer-motion'

type WalletGateProps = {
  children: React.ReactNode
  title?: string
  description?: string
}

export function WalletGate({
  children,
  title = 'Connect wallet',
  description = 'Connect your wallet to access this Swiflo dashboard.',
}: WalletGateProps) {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useSolanaWallets()
  const address = wallets[0]?.address

  const loginWithEmail = () => login({ loginMethods: ['email', 'sms'] })
  const reconnect = async () => {
    await logout()
    loginWithEmail()
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1104px] items-center justify-center px-5 py-16 sm:px-8">
        <div className="h-12 w-12 animate-pulse rounded-full border border-[#BFD0FF] bg-white/75 shadow-[0_18px_45px_-28px_rgba(47,91,255,0.8)]" />
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1104px] items-center justify-center px-5 py-16 sm:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[520px] overflow-hidden rounded-3xl border border-[#DCE6FF] bg-white/75 p-8 text-center shadow-[0_26px_80px_-48px_rgba(47,91,255,0.8)] backdrop-blur"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#BEE7FF]/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#DDE7FF]/80 blur-3xl" />

          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#DCE6FF] bg-[#F7FAFF] text-[#2F5BFF] shadow-[0_18px_45px_-28px_rgba(47,91,255,0.85)]">
            <WalletIcon className="h-8 w-8" />
          </div>
          <h1 className="relative text-3xl font-extrabold tracking-tight text-[#07133A]">{title}</h1>
          <p className="relative mx-auto mt-3 max-w-sm text-sm font-semibold leading-relaxed text-[#6F7DA8]">
            {description}
          </p>
          <button
            type="button"
            onClick={loginWithEmail}
            className="relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2F5BFF] px-6 py-4 text-base font-extrabold text-white shadow-[0_18px_45px_-22px_rgba(47,91,255,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#254DF0] sm:w-auto"
          >
            Connect wallet
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </motion.section>
      </main>
    )
  }

  if (!address) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-[1104px] items-center justify-center px-5 py-16 sm:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[520px] overflow-hidden rounded-3xl border border-[#DCE6FF] bg-white/75 p-8 text-center shadow-[0_26px_80px_-48px_rgba(47,91,255,0.8)] backdrop-blur"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#BEE7FF]/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#DDE7FF]/80 blur-3xl" />

          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#DCE6FF] bg-[#F7FAFF] text-[#2F5BFF] shadow-[0_18px_45px_-28px_rgba(47,91,255,0.85)]">
            <div className="h-8 w-8 animate-pulse rounded-full border-2 border-[#BFD0FF] bg-white" />
          </div>
          <h1 className="relative text-3xl font-extrabold tracking-tight text-[#07133A]">Wallet setup did not finish</h1>
          <p className="relative mx-auto mt-3 max-w-sm text-sm font-semibold leading-relaxed text-[#6F7DA8]">
            You are signed in, but Privy has not returned a Solana wallet address yet. Reconnect once to finish wallet setup.
          </p>
          <button
            type="button"
            onClick={reconnect}
            className="relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2F5BFF] px-6 py-4 text-base font-extrabold text-white shadow-[0_18px_45px_-22px_rgba(47,91,255,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#254DF0] sm:w-auto"
          >
            Reconnect wallet
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </motion.section>
      </main>
    )
  }

  return <>{children}</>
}

function WalletIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 7.5A2.5 2.5 0 016.5 5H18a2 2 0 012 2v10a2 2 0 01-2 2H6.5A2.5 2.5 0 014 16.5v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 12h4v4h-4a2 2 0 110-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 8h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
