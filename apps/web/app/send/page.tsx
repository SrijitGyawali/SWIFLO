'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana'
import {
  Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { motion } from 'framer-motion'
import { WalletGate } from '@/components/WalletGate'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
const POOL_PROGRAM_ID = process.env.NEXT_PUBLIC_REMITTANCE_POOL_PROGRAM_ID
  ?? 'GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ'
const POOL_USDC = process.env.NEXT_PUBLIC_POOL_USDC ?? ''

const INITIATE_TRANSFER_DISC = Buffer.from([128, 229, 77, 5, 65, 234, 228, 75])
const POOL_TOTAL_TRANSFERS_OFFSET = 74

type RateData = {
  nprPerUsd: number
  source: string
  cachedAt: string
  swifloNpr?: number
  wuNpr?: number
  savingsNpr?: number
}

type CurrencyInfo = {
  name: string
  country: string
}

type CurrencyMap = Record<string, CurrencyInfo>

type ExchangeRateData = {
  currency: string
  usdToRate: string
  cachedAt: string
}

function buildInitiateTransferIx(
  programId: PublicKey,
  poolPda: PublicKey,
  transferPda: PublicKey,
  sender: PublicKey,
  senderUsdc: PublicKey,
  poolUsdc: PublicKey,
  amountUsdc: bigint,
  recipientHash: Uint8Array,
  lockedRate: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(56)
  INITIATE_TRANSFER_DISC.copy(data, 0)
  data.writeBigUInt64LE(amountUsdc, 8)
  Buffer.from(recipientHash).copy(data, 16)
  data.writeBigUInt64LE(lockedRate, 48)

  return new TransactionInstruction({
    programId,
    data,
    keys: [
      { pubkey: poolPda,            isSigner: false, isWritable: true  },
      { pubkey: transferPda,        isSigner: false, isWritable: true  },
      { pubkey: sender,             isSigner: true,  isWritable: true  },
      { pubkey: senderUsdc,         isSigner: false, isWritable: true  },
      { pubkey: poolUsdc,           isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,   isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
  })
}

function useRate(amountUsdc: number) {
  const [data, setData]       = useState<RateData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const url = amountUsdc > 0
      ? `${API}/api/rates?amount=${amountUsdc}`
      : `${API}/api/rates`

    const fetch_ = () =>
      fetch(url)
        .then(r => r.json())
        .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
        .catch(() => setLoading(false))

    fetch_()
    const interval = setInterval(fetch_, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [amountUsdc])

  return { data, loading }
}

function useCurrencies() {
  const [currencies, setCurrencies] = useState<CurrencyMap>({})

  useEffect(() => {
    let cancelled = false
    fetch(`${API}/api/exchange/currencies`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setCurrencies(d) })
      .catch(() => undefined)

    return () => { cancelled = true }
  }, [])

  return currencies
}

function useExchangeRate(currency: string) {
  const [data, setData] = useState<ExchangeRateData | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchRate = () =>
      fetch(`${API}/api/exchange/rate?currency=${currency}`)
        .then(r => r.json())
        .then(d => { if (!cancelled) setData(d) })
        .catch(() => undefined)

    fetchRate()
    const interval = setInterval(fetchRate, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [currency])

  return data
}

export default function SendPage() {
  return (
    <WalletGate
      title="Connect to send money"
      description="Connect your wallet to estimate rates, confirm transfers, and send funds securely."
    >
      <SendDashboard />
    </WalletGate>
  )
}

function SendDashboard() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()
  const { wallets } = useSolanaWallets()
  const [amountUsdc, setAmountUsdc] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('AED')
  const [phone, setPhone]           = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const usdcNum       = parseFloat(amountUsdc) || 0
  const { data: rate } = useRate(usdcNum)
  const currencies = useCurrencies()
  const exchangeRate = useExchangeRate(selectedCurrency)

  const nprPerUsd   = rate?.nprPerUsd  ?? 133.5
  const senderRate = parseFloat(exchangeRate?.usdToRate ?? '0') || 0
  const senderFiatAmount = usdcNum > 0 && senderRate > 0 ? usdcNum * senderRate : 0
  const familyGetsNpr = usdcNum > 0 ? usdcNum * nprPerUsd : 0

  const currencyList = Object.entries(currencies).filter(([code]) =>
    ['AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR'].includes(code)
  )

  const selectedCountry = currencies[selectedCurrency]?.country ?? 'United Arab Emirates'

  const validate = () => {
    if (!phone.match(/^9[678]\d{8}$/)) {
      setPhoneError('Enter a valid 10-digit Nepali mobile number (starts with 96/97/98)')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSend = async () => {
    if (!validate() || usdcNum <= 0) return
    setSubmitting(true)
    try {
      const estimateRes = await fetch(`${API}/api/transfers/estimate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amountUsdc: usdcNum }),
      })
      const estimate = await estimateRes.json()
      if (!estimateRes.ok) throw new Error(estimate.error ?? 'Failed to estimate transfer')

      const wallet = wallets[0]
      if (!wallet) throw new Error('No Solana wallet found. Please reconnect and try again.')
      if (!POOL_USDC) throw new Error('NEXT_PUBLIC_POOL_USDC is not configured.')

      const connection = new Connection(RPC, 'confirmed')
      const programId = new PublicKey(POOL_PROGRAM_ID)
      const senderPubkey = new PublicKey(wallet.address)
      const usdcMint = new PublicKey(USDC_MINT)
      const poolUsdc = new PublicKey(POOL_USDC)

      const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], programId)
      const poolInfo = await connection.getAccountInfo(poolPda)
      if (!poolInfo) throw new Error('Remittance pool not found on devnet. Has it been initialized?')

      const totalTransfers = poolInfo.data.readBigUInt64LE(POOL_TOTAL_TRANSFERS_OFFSET)
      const seqBuf = Buffer.alloc(8)
      seqBuf.writeBigUInt64LE(totalTransfers)
      const [transferPda] = PublicKey.findProgramAddressSync([Buffer.from('transfer'), seqBuf], programId)

      const senderUsdc = await getAssociatedTokenAddress(usdcMint, senderPubkey)
      const amountLamports = BigInt(Math.round(usdcNum * 1_000_000))
      const lockedRateScaled = BigInt(Math.round((estimate.lockedRate ?? nprPerUsd) * 1_000_000))
      const recipientHash = new Uint8Array(32)

      const ix = buildInitiateTransferIx(
        programId,
        poolPda,
        transferPda,
        senderPubkey,
        senderUsdc,
        poolUsdc,
        amountLamports,
        recipientHash,
        lockedRateScaled,
      )

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const tx = new Transaction()
      tx.recentBlockhash = blockhash
      tx.feePayer = senderPubkey
      tx.add(ix)

      const { signedTransaction } = await wallet.signTransaction({
        transaction: tx.serialize({ requireAllSignatures: false, verifySignatures: false }),
        chain: 'solana:devnet',
      })
      const signature = await connection.sendRawTransaction(Buffer.from(signedTransaction), {
        preflightCommitment: 'confirmed',
      })
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')

      const webhookRes = await fetch(`${API}/api/webhooks/transfer-initiated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId: totalTransfers.toString(),
          recipientPhone: `+977${phone}`,
          amountUsdc: amountLamports.toString(),
          lockedRate: lockedRateScaled.toString(),
          solanaTxSignature: signature,
          senderPubkey: wallet.address,
        }),
      })

      const webhookData = await webhookRes.json()
      if (!webhookRes.ok) throw new Error(webhookData.error ?? 'Backend error')

      const id = webhookData.transferId ?? 'demo'
      router.push(
        `/processing/${id}?savingsNpr=${estimate.savingsNpr ?? 0}&amountUsdc=${amountUsdc}` +
        `&amountNpr=${estimate.recipientGetsNpr ?? Math.round(familyGetsNpr)}&phone=${encodeURIComponent(`+977${phone}`)}`,
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Transfer failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-12 pt-8 sm:px-8">
      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-[#DCE6FF] bg-white/70 p-5 shadow-[0_24px_70px_-45px_rgba(47,91,255,0.65)] backdrop-blur"
      >
        <div className="rounded-2xl border border-[#DCE6FF] bg-white/55 p-5 shadow-[0_18px_45px_-36px_rgba(47,91,255,0.45)]">
          <div className="mb-5 flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#2F5BFF]">
              <UsdIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-extrabold text-[#2F5BFF]">Send with USDC</p>
              <p className="mt-1 text-sm font-bold text-[#7484B6]">We show your fiat equivalent and Nepal payout instantly</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-xs font-bold text-[#60709A]">USDC amount</label>
            <div className="flex h-14 items-center gap-3 rounded-xl border border-[#DCE6FF] bg-white px-4">
              <input
                type="text"
                inputMode="decimal"
                value={amountUsdc}
                onChange={e => {
                  const next = e.target.value.replace(/[^\d.]/g, '')
                  if ((next.match(/\./g) ?? []).length <= 1) setAmountUsdc(next)
                }}
                className="min-w-0 flex-1 bg-transparent text-2xl font-extrabold text-[#07133A] outline-none"
                placeholder="100"
              />
              <span className="text-lg font-extrabold text-[#2F5BFF]">USDC</span>
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-xs font-bold text-[#60709A]">Your local currency</label>
            <div className="relative">
              <select
                value={selectedCurrency}
                onChange={e => setSelectedCurrency(e.target.value)}
                disabled={currencyList.length === 0}
                className="h-11 w-full appearance-none rounded-xl border border-[#DCE6FF] bg-white px-4 pr-10 text-sm font-extrabold text-[#07133A] outline-none transition-colors focus:border-[#7B95FF] disabled:opacity-60"
              >
                {currencyList.map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.country} ({code})
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2F5BFF]" />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] overflow-hidden rounded-xl border border-[#DCE6FF] bg-white">
            <div className="p-4">
              <p className="mb-2 text-xs font-bold text-[#7484B6]">You pay (~{selectedCurrency})</p>
              <p className="text-base font-extrabold text-[#07133A]">
                {senderFiatAmount > 0 ? senderFiatAmount.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}{' '}
                <span className="text-[#2F5BFF]">{selectedCurrency}</span>
              </p>
            </div>
            <div className="flex items-center justify-center border-x border-[#DCE6FF]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#7D8DB8] shadow-[0_8px_22px_-14px_rgba(17,25,54,0.5)]">
                <ArrowDownIcon className="h-5 w-5" />
              </span>
            </div>
            <div className="p-4">
              <p className="mb-2 text-xs font-bold text-[#7484B6]">Family gets</p>
              <p className="text-base font-extrabold text-[#00B879]">
                Rs {Math.round(familyGetsNpr).toLocaleString('en-IN')} <span className="text-sm">NPR</span>
              </p>
            </div>
          </div>

          <p className="mt-3 text-center text-xs font-semibold text-[#9AA8CB]">
            {selectedCountry} FX + live NPR quote active
          </p>
        </div>

        <div className="mt-5 border-t border-[#DCE6FF] pt-5">
          <label className="mb-2 block text-xs font-bold text-[#60709A]">Recipient eSewa number</label>
          <div className={`flex h-12 items-center overflow-hidden rounded-xl border bg-white ${phoneError ? 'border-[#D92D43]' : 'border-[#DCE6FF]'}`}>
            <span className="flex h-full items-center border-r border-[#DCE6FF] px-4 text-sm font-extrabold text-[#2F5BFF]">NP +977</span>
            <input
              type="tel"
              placeholder="9847033308"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={10}
              className="min-w-0 flex-1 bg-transparent px-4 text-base font-extrabold text-[#07133A] outline-none placeholder:text-[#9AA8CB]"
            />
            <UserIcon className="mr-4 h-5 w-5 flex-none text-[#60709A]" />
          </div>
          {phoneError && <p className="mt-2 text-xs font-bold text-[#D92D43]">{phoneError}</p>}
        </div>

        <button
          onClick={handleSend}
          disabled={submitting || !phone || usdcNum <= 0}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#355BFF] px-5 py-4 text-base font-extrabold text-white shadow-[0_18px_42px_-24px_rgba(53,91,255,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#294DF0] disabled:translate-y-0 disabled:opacity-60"
        >
          {!ready ? 'Loading...' : !authenticated ? 'Connect wallet to continue' : submitting ? 'Initiating transfer...' : 'Send now'}
          <ArrowRightIcon className="h-5 w-5" />
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-[#60709A]">
          <LockIcon className="h-3.5 w-3.5 text-[#355BFF]" />
          Calls initiate_transfer on Solana Devnet - Rate locked
        </p>
      </motion.section>
    </div>
  )
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" />
    </svg>
  )
}

function UserIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function UsdIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v10m2.8-7.5c0-1.2-1.3-2-2.8-2s-2.8.8-2.8 2 1.2 1.7 2.8 2c1.6.3 2.8.8 2.8 2s-1.3 2-2.8 2-2.8-.8-2.8-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
