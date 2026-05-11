'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { AnimatePresence, motion } from 'framer-motion'
import { WalletSidebar } from './WalletSidebar'

type TokenHolding = {
  mint: string
  amount: string
}

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const SWI_MINT = '2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx'
const connection = new Connection(SOLANA_RPC, 'confirmed')

async function fetchTokenHoldings(address: string): Promise<TokenHolding[]> {
  const owner = new PublicKey(address)
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  }, 'confirmed')

  return accounts.value
    .map((entry) => {
      const info = entry.account.data.parsed?.info
      const tokenAmount = info?.tokenAmount
      return {
        mint: info?.mint ?? '',
        amount: tokenAmount?.uiAmountString ?? String(tokenAmount?.uiAmount ?? 0),
      }
    })
    .filter((holding: TokenHolding) => holding.mint && holding.amount !== '0')
}

async function fetchNativeBalance(address: string): Promise<number> {
  const lamports = await connection.getBalance(new PublicKey(address), 'confirmed')
  return lamports / 1_000_000_000
}

async function fetchUSDCBalance(address: string): Promise<number> {
  const pubkey = new PublicKey(address)
  const parsedAccount = await connection.getParsedAccountInfo(pubkey, 'confirmed')
  const parsedInfo = parsedAccount.value?.data && 'parsed' in parsedAccount.value.data
    ? (parsedAccount.value.data as any).parsed?.info
    : null

  if (parsedInfo?.mint === SWI_MINT && parsedInfo?.tokenAmount) {
    return Number(parsedInfo.tokenAmount.uiAmount ?? parsedInfo.tokenAmount.amount / 10 ** parsedInfo.tokenAmount.decimals)
  }

  const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
    mint: new PublicKey(SWI_MINT),
  }, 'confirmed')

  return accounts.value.reduce((sum, entry) => {
    const tokenAmount = entry.account.data.parsed?.info?.tokenAmount
    const amount = tokenAmount?.uiAmount ?? Number(tokenAmount?.amount ?? 0) / 10 ** Number(tokenAmount?.decimals ?? 0)
    return sum + Number(amount)
  }, 0)
}

export function Navbar() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useSolanaWallets()
  const [copied, setCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [holdingsLoading, setHoldingsLoading] = useState(false)
  const [holdingsError, setHoldingsError] = useState('')
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [nativeBalance, setNativeBalance] = useState<number | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)

  const refreshHoldings = async (addressToLoad: string) => {
    setHoldingsLoading(true)
    setHoldingsError('')
    try {
      const [result, native, usdc, parsedAccount] = await Promise.all([
        fetchTokenHoldings(addressToLoad),
        fetchNativeBalance(addressToLoad),
        fetchUSDCBalance(addressToLoad),
        connection.getParsedAccountInfo(new PublicKey(addressToLoad), 'confirmed'),
      ])

      const combinedHoldings = [...result]
      const parsedInfo = parsedAccount.value?.data && 'parsed' in parsedAccount.value.data
        ? (parsedAccount.value.data as any).parsed?.info
        : null
      if (result.length === 0 && parsedInfo?.mint && parsedInfo?.tokenAmount) {
        combinedHoldings.push({
          mint: parsedInfo.mint,
          amount: parsedInfo.tokenAmount.uiAmountString ?? String(parsedInfo.tokenAmount.uiAmount ?? 0),
        })
      }

      setHoldings(combinedHoldings)
      setNativeBalance(native)
      setUsdcBalance(usdc)
    } catch (error) {
      setHoldingsError('Could not load token holdings')
      setHoldings([])
      setNativeBalance(null)
      setUsdcBalance(null)
    } finally {
      setHoldingsLoading(false)
    }
  }


  useEffect(() => {
    console.debug('Navbar wallets changed', { ready, authenticated, walletsLength: wallets.length, address: wallets[0]?.address })
  }, [ready, authenticated, wallets.length])

  const address = wallets[0]?.address

  useEffect(() => {
    const onFaucetComplete = () => {
      if (!address || !sidebarOpen) return
      void refreshHoldings(address)
    }

    window.addEventListener('swiflo:faucet-complete', onFaucetComplete)
    return () => window.removeEventListener('swiflo:faucet-complete', onFaucetComplete)
  }, [address, sidebarOpen])

  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!sidebarOpen || !address) return

    void refreshHoldings(address)

    return undefined
  }, [sidebarOpen, address])

  /* Derive SWI balance from holdings (the SWI mint amount, parsed as number) */
  const swiBalance = useMemo(() => {
    const swi = holdings.find((h) => h.mint === SWI_MINT)
    if (!swi) return null
    const n = Number(swi.amount)
    return Number.isFinite(n) ? n : null
  }, [holdings])

  const handleDisconnect = () => {
    setSidebarOpen(false)
    logout()
  }

  const handleLogin = () => {
    if (!ready) return
    login({ loginMethods: ['email', 'sms'] })
  }

  const handleReconnect = async () => {
    if (!ready) return
    setSidebarOpen(false)
    await logout()
    login({ loginMethods: ['email', 'sms'] })
  }

  const navLinks: NavLink[] = [
    { href: '/explorer', label: 'Explorer', Icon: CompassIcon },
    { href: '/fund',     label: 'Get USDC', Icon: UsdcIcon    },
    { href: '/send',     label: 'Send',     Icon: SendIcon    },
    { href: '/lp',       label: 'Earn',     Icon: WalletIcon  },
  ]

  const [mobileOpen, setMobileOpen] = useState(false)

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    const original = document.body.style.overflow
    document.body.style.overflow = mobileOpen ? 'hidden' : original
    return () => {
      document.body.style.overflow = original
    }
  }, [mobileOpen])

  return (
    <header className="pointer-events-none sticky top-0 z-50 w-full">
      <nav className="pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
        {/* Logo pill */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-1.5 shadow-[0_8px_24px_-12px_rgba(11,11,20,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_12px_28px_-14px_rgba(11,11,20,0.22)]"
        >
          <img
            src="/swiflo-logo.png"
            alt="Swiflo"
            className="h-7 w-auto select-none"
            draggable={false}
          />
          <span className="pr-1 text-lg font-bold tracking-tight text-[#0A0F1F]">swiflo</span>
        </Link>

        {/* Center nav pill */}
        <div className="hidden items-center rounded-full border border-white/40 bg-white/70 px-3 py-1.5 shadow-[0_8px_24px_-12px_rgba(11,11,20,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-5 py-2 text-sm font-medium text-[#3C4253] transition-colors hover:bg-white/60 hover:text-[#0A0F1F]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger — glassmorphism, icon-only, visible on small screens */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/30 text-[#0A0F1F] shadow-[0_8px_24px_-12px_rgba(11,11,20,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl transition-all hover:bg-white/50 active:scale-95 md:hidden"
        >
          {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <HamburgerIcon className="h-5 w-5" />}
        </button>

        {/* Desktop right buttons */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/explorer"
            className="hidden rounded-full border border-white/40 bg-white/70 px-5 py-2.5 text-sm font-semibold text-[#0A0F1F] shadow-[0_8px_24px_-12px_rgba(11,11,20,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_12px_28px_-14px_rgba(11,11,20,0.22)] sm:inline-flex"
          >
            Try Widget
          </Link>

          {ready && authenticated && address ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Open wallet"
              className="group inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 py-1.5 pl-1.5 pr-3.5 shadow-[0_8px_24px_-12px_rgba(11,11,20,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_12px_28px_-14px_rgba(11,11,20,0.22)]"
            >
              <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2D45F2] via-[#5B2CFF] to-[#22D3EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
              </span>
              <span className="font-mono text-xs font-semibold text-[#0A0F1F]">
                {`${address.slice(0, 4)}...${address.slice(-4)}`}
              </span>
            </button>
          ) : ready && authenticated ? (
            <button
              onClick={handleReconnect}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A2BE0] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(26,43,224,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#2236E8] hover:shadow-[0_16px_30px_-12px_rgba(26,43,224,0.8)]"
            >
              <NavWalletIcon className="h-4 w-4" />
              Reconnect Wallet
            </button>
          ) : (
            <button
              onClick={handleLogin}
              disabled={!ready}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A2BE0] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(26,43,224,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[#2236E8] hover:shadow-[0_16px_30px_-12px_rgba(26,43,224,0.8)] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <NavWalletIcon className="h-4 w-4" />
              {ready ? 'Connect Wallet' : 'Loading Wallet'}
            </button>
          )}
        </div>
      </nav>

      {/* Wallet sidebar */}
      <WalletSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        address={address ?? ''}
        copied={copied}
        onCopy={copyAddress}
        onDisconnect={handleDisconnect}
        nativeBalance={nativeBalance}
        usdcBalance={usdcBalance}
        swiBalance={swiBalance}
        holdings={holdings}
        loading={holdingsLoading}
        error={holdingsError}
      />

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto md:hidden"
          >
            <div className="mx-auto w-full max-w-7xl px-4 pb-6 pt-2 sm:px-6">
              {/* Nav links list */}
              <div className="overflow-hidden rounded-3xl border border-[#0A0F1F]/8 bg-white shadow-[0_20px_50px_-20px_rgba(11,11,20,0.18)]">
                {navLinks.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#0A0F1F]/3 active:bg-[#0A0F1F]/5 ${
                      i > 0 ? 'border-t border-[#0A0F1F]/6' : ''
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D45F2]/10 text-[#2D45F2]">
                      <link.Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-base font-semibold text-[#0A0F1F]">
                      {link.label}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-[#0A0F1F]/40" />
                  </Link>
                ))}
              </div>

              {/* Bottom action stack */}
              <div className="mt-3 flex flex-col gap-2.5">
                <Link
                  href="/explorer"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-[#0A0F1F]/15 bg-white px-5 py-3.5 text-sm font-semibold text-[#0A0F1F] shadow-[0_6px_22px_-12px_rgba(11,11,20,0.18)] transition-colors hover:border-[#0A0F1F]/35"
                >
                  Try Widget
                </Link>

                {ready && authenticated && address ? (
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      setSidebarOpen(true)
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#0A0F1F]/10 bg-white py-3.5 pl-3 pr-5 shadow-[0_6px_22px_-12px_rgba(11,11,20,0.18)] transition-colors hover:bg-[#F4F5FA]"
                  >
                    <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2D45F2] via-[#5B2CFF] to-[#22D3EE]">
                      <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#10B981] ring-2 ring-white" />
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#0A0F1F]">
                      {`${address.slice(0, 6)}...${address.slice(-4)}`}
                    </span>
                    <span className="ml-auto text-[11px] font-semibold text-[#5A5F7A]">View</span>
                  </button>
                ) : ready && authenticated ? (
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      void handleReconnect()
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A2BE0] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(26,43,224,0.7)] transition-colors hover:bg-[#2236E8]"
                  >
                    <NavWalletIcon className="h-4 w-4" />
                    Reconnect Wallet
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      handleLogin()
                    }}
                    disabled={!ready}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1A2BE0] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(26,43,224,0.7)] transition-colors hover:bg-[#2236E8] disabled:cursor-wait disabled:opacity-70"
                  >
                    <NavWalletIcon className="h-4 w-4" />
                    {ready ? 'Connect Wallet' : 'Loading Wallet'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

type NavLink = {
  href: string
  label: string
  Icon: (props: { className?: string }) => ReactElement
}

function HamburgerIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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

function CompassIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M15.5 8.5l-2 5-5 2 2-5 5-2z"
        fill="currentColor"
      />
    </svg>
  )
}

function UsdcIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 6.5v11M14.5 9c0-1.2-1-2-2.5-2s-2.5.7-2.5 1.9c0 1.4 1.5 1.7 2.5 2 1 .3 2.5.6 2.5 2 0 1.2-1 1.9-2.5 1.9s-2.5-.7-2.5-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
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

function NavWalletIcon({ className = '' }: { className?: string }) {
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
