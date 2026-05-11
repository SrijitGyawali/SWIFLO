'use client'

import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CurrencyConverter } from '@/components/CurrencyConverter'
import { FaucetButton } from '@/components/FaucetButton'
import { motion } from 'framer-motion'
import { WalletGate } from '@/components/WalletGate'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type MintState = 'idle' | 'loading' | 'success' | 'error'

export default function FundPage() {
  return (
    <WalletGate
      title="Connect to get USDC"
      description="Connect your wallet to view your Solana address and fund it with test USDC."
    >
      <FundDashboard />
    </WalletGate>
  )
}

function FundDashboard() {
  const { wallets } = useSolanaWallets()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [quotedUsdc, setQuotedUsdc] = useState(0)
  const [mintState, setMintState] = useState<MintState>('idle')
  const [mintError, setMintError] = useState('')
  const [mintTxUrl, setMintTxUrl] = useState('')

  const wallet = wallets[0]
  const address = wallet?.address ?? ''
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  const copy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMintQuotedUsdc = async () => {
    if (!wallet || quotedUsdc <= 0) return

    setMintState('loading')
    setMintError('')
    setMintTxUrl('')

    try {
      const res = await fetch(`${API}/api/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.address,
          amount: Number(quotedUsdc.toFixed(2)),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Mint failed')

      setMintTxUrl(data.explorerUrl ?? '')
      setMintState('success')
    } catch (err: any) {
      setMintError(err.message ?? 'Mint failed. Please try again.')
      setMintState('error')
    }
  }
  return (
    <div className="mx-auto w-full max-w-[1104px] px-5 pb-12 pt-8 sm:px-8">
      {address && (
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 rounded-2xl border border-[#DFE8FA] bg-white/65 px-5 py-5 shadow-[0_16px_40px_-30px_rgba(17,25,54,0.35)] backdrop-blur sm:px-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#61709F]">Your Solana wallet</p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#07133A]">{short}</p>
            </div>
            <button
              onClick={copy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E0E8FA] bg-white/70 px-5 py-3 text-base font-extrabold text-[#2D5BFF] transition-all hover:-translate-y-0.5 hover:border-[#9FB6FF] hover:bg-white"
            >
              <CopyIcon className="h-4 w-4" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 rounded-2xl border border-[#DFE8FA] bg-white/55 px-5 py-5 shadow-[0_16px_40px_-30px_rgba(17,25,54,0.35)] backdrop-blur sm:px-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-full bg-[#2F5BFF] px-3 py-1 text-xs font-extrabold text-white">DEMO</span>
          <span className="text-sm font-semibold text-[#6F7DA8]">Recommended for testing</span>
        </div>
        <FaucetButton />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mb-4 rounded-2xl border border-[#DFE8FA] bg-white/55 px-5 py-5 shadow-[0_16px_40px_-30px_rgba(17,25,54,0.35)] backdrop-blur sm:px-6"
      >
        <div className="mb-4">
          <p className="text-xs font-extrabold tracking-wide text-[#61709F]">LIVE QUOTE</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#07133A]">Convert local currency to USDC</h2>
          <p className="mt-1 text-sm font-semibold text-[#6F7DA8]">Select where you are based and amount, then mint USDC to your connected wallet.</p>
        </div>

        <CurrencyConverter onAmountChange={setQuotedUsdc} showFamilyReceives={false} />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="rounded-xl border border-[#DFE8FA] bg-[#F7F9FF] px-4 py-3 text-sm font-bold text-[#4D5D90]">
            Estimated purchase: <span className="text-[#2F5BFF]">{quotedUsdc > 0 ? quotedUsdc.toFixed(2) : '0.00'} USDC</span>
          </p>
          <button
            onClick={handleMintQuotedUsdc}
            disabled={mintState === 'loading' || quotedUsdc <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2F5BFF] px-5 py-3 text-sm font-extrabold text-white shadow-[0_18px_42px_-24px_rgba(47,91,255,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#254DF0] disabled:translate-y-0 disabled:opacity-60"
          >
            {mintState === 'loading' ? 'Minting...' : 'Get USDC'}
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {mintState === 'success' && mintTxUrl && (
          <a
            href={mintTxUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block text-sm font-bold text-[#2D5BFF] hover:underline"
          >
            Mint complete. View transaction on Solana Explorer
          </a>
        )}

        {mintState === 'error' && (
          <p className="mt-4 rounded-2xl border border-[#FFD1D7] bg-[#FFF0F2] px-4 py-3 text-sm font-bold text-[#D92D43]">
            {mintError}
          </p>
        )}
      </motion.section>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#D7E0F5]" />
        </div>
        <div className="relative flex justify-center">
          <span className="rounded-full border border-[#D7E0F5] bg-[#EEF1FB] px-4 py-2 text-sm font-bold text-[#61709F]">OR</span>
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-48px' }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => alert('Card on-ramp coming soon — post-hackathon with Transak integration')}
        className="mb-5 flex w-full items-center justify-between gap-5 rounded-2xl border border-[#DFE8FA] bg-white/65 px-5 py-5 text-left shadow-[0_16px_40px_-30px_rgba(17,25,54,0.35)] backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white sm:px-6"
      >
        <div className="flex items-center gap-5">
          <span className="flex h-14 w-32 items-center justify-center rounded-2xl border border-[#DFE8FA] bg-white text-base font-extrabold text-[#151B3F]">
            <span className="mr-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#9B35FF] text-[10px] text-white">o</span>
            onramper
          </span>
          <span>
            <span className="block text-xl font-extrabold text-[#07133A]">Buy with Onramper</span>
            <span className="mt-2 block text-sm font-semibold text-[#6F7DA8]">
              Instant USDC with card, bank transfer &amp; more
            </span>
          </span>
        </div>
        <ChevronRightIcon className="h-5 w-5 flex-none text-[#2D5BFF]" />
      </motion.button>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-48px' }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-[#DFE8FA] bg-white/55 shadow-[0_16px_40px_-30px_rgba(17,25,54,0.35)] backdrop-blur md:grid-cols-3"
      >
        <FeatureCard icon={<BoltIcon className="h-5 w-5" />} title="Instant" body="Receive USDC in seconds" />
        <FeatureCard icon={<ShieldIcon className="h-5 w-5" />} title="Secure" body="Audited & non-custodial infrastructure" />
        <FeatureCard icon={<GlobeIcon className="h-5 w-5" />} title="Global" body="Available in 100+ countries" />
      </motion.section>

      <p className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-[#9AA8CB]">
        <ShieldTinyIcon className="h-4 w-4 text-[#8FA8FF]" />
        Swiflo does not hold your funds. All transactions are secured on Solana.
      </p>

      <button
        onClick={() => router.push('/send')}
        className="sr-only"
        tabIndex={-1}
      >
        Send money now
      </button>
    </div>
  )
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 border-[#DFE8FA] px-5 py-5 md:border-r md:last:border-r-0">
      <span className="mt-1 flex-none text-[#2F5BFF]">{icon}</span>
      <div>
        <p className="text-base font-extrabold text-[#07133A]">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-[#6F7DA8]">{body}</p>
      </div>
    </div>
  )
}

function CopyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15V6a1 1 0 011-1h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BoltIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M13 2L5 13h6l-1 9 8-12h-6l1-8z" fill="currentColor" />
    </svg>
  )
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12.5l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GlobeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ShieldTinyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3l8 3v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3z" />
    </svg>
  )
}
