'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana'
import {
  Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { motion } from 'framer-motion'

const API       = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const RPC       = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
const POOL_PROGRAM_ID = process.env.NEXT_PUBLIC_REMITTANCE_POOL_PROGRAM_ID
  ?? 'GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ'
const POOL_USDC = process.env.NEXT_PUBLIC_POOL_USDC ?? ''

// Discriminator from apps/web/idl/swiflo_remittance_pool.json
const INITIATE_TRANSFER_DISC = Buffer.from([128, 229, 77, 5, 65, 234, 228, 75])

// Pool account layout offsets (Anchor discriminator = 8 bytes)
// authority(32) + mto_authority(32) + fee_bps(2) = 74, then total_transfers u64
const POOL_TOTAL_TRANSFERS_OFFSET = 74

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
  // data = discriminator(8) + amount_usdc(8) + recipient_hash(32) + locked_rate(8)
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

function ConfirmContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { wallets } = useSolanaWallets()

  const amountUsdc      = params.get('amountUsdc') ?? '0'
  const phone           = params.get('phone') ?? ''
  const lockedRate      = parseFloat(params.get('lockedRate') ?? '133.5')
  const recipientGetsNpr = parseInt(params.get('recipientGetsNpr') ?? '0')
  const savingsNpr      = parseInt(params.get('savingsNpr') ?? '0')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const usdcNum  = parseFloat(amountUsdc)
  const nprGross = Math.round(usdcNum * lockedRate)
  const swifloFee = Math.round(nprGross * 0.004)

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const wallet = wallets[0]
      if (!wallet)    throw new Error('No Solana wallet found. Please log in again.')
      if (!POOL_USDC) throw new Error('NEXT_PUBLIC_POOL_USDC is not configured.')

      const connection  = new Connection(RPC, 'confirmed')
      const programId   = new PublicKey(POOL_PROGRAM_ID)
      const senderPubkey = new PublicKey(wallet.address)
      const usdcMint    = new PublicKey(USDC_MINT)
      const poolUsdc    = new PublicKey(POOL_USDC)

      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool')],
        programId,
      )

      const poolInfo = await connection.getAccountInfo(poolPda)
      if (!poolInfo) throw new Error('Remittance pool not found on devnet. Has it been initialized?')
      const totalTransfers = poolInfo.data.readBigUInt64LE(POOL_TOTAL_TRANSFERS_OFFSET)

      const seqBuf = Buffer.alloc(8)
      seqBuf.writeBigUInt64LE(totalTransfers)
      const [transferPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('transfer'), seqBuf],
        programId,
      )

      const senderUsdc = await getAssociatedTokenAddress(usdcMint, senderPubkey)

      const amountLamports = BigInt(Math.round(usdcNum * 1_000_000))
      const lockedRateScaled = BigInt(Math.round(lockedRate * 1_000_000))
      const recipientHash  = new Uint8Array(32)

      const ix = buildInitiateTransferIx(
        programId, poolPda, transferPda,
        senderPubkey, senderUsdc, poolUsdc,
        amountLamports, recipientHash, lockedRateScaled,
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
      console.log(`[swiflo-api] initiateTransfer on-chain: ${signature}`)

      const res = await fetch(`${API}/api/webhooks/transfer-initiated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferId:         totalTransfers.toString(),
          recipientPhone:     phone,
          amountUsdc:         amountLamports.toString(),
          lockedRate:         lockedRateScaled.toString(),
          solanaTxSignature:  signature,
          senderPubkey:       wallet.address,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Backend error')

      const id = data.transferId ?? 'demo'
      router.push(
        `/processing/${id}?savingsNpr=${savingsNpr}&amountUsdc=${amountUsdc}` +
        `&amountNpr=${recipientGetsNpr}&phone=${encodeURIComponent(phone)}`,
      )
    } catch (err: any) {
      setError(err.message ?? 'Transaction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-12 pt-8 sm:px-8">
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28 }}
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm font-bold text-[#60709A] transition-colors hover:text-[#2F5BFF]"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Edit transfer
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-2xl font-extrabold text-[#07133A]">Confirm transfer</h1>
        <p className="mt-2 text-sm font-bold text-[#60709A]">
          Sending {amountUsdc} USDC to {phone}
        </p>

        <div className="mt-7 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.34 }}
            className="flex items-center justify-between rounded-xl border border-[#DCE6FF] bg-white/80 p-5 shadow-[0_18px_46px_-34px_rgba(47,91,255,0.45)]"
          >
            <div>
              <p className="text-base font-extrabold text-[#07133A]">Western Union</p>
              <p className="mt-1 text-xs font-extrabold text-[#FF3158]">6% fee</p>
            </div>
            <p className="text-lg font-extrabold text-[#07133A]">
              Rs {Math.round(nprGross * 0.94).toLocaleString('en-IN')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.34 }}
            className="relative flex items-center justify-between rounded-xl border border-[#4F6BFF] bg-white/90 p-5 shadow-[0_20px_54px_-34px_rgba(47,91,255,0.55)]"
          >
            <div>
              <p className="text-base font-extrabold text-[#2F5BFF]">Swiflo</p>
              <p className="mt-1 text-xs font-extrabold text-[#00B879]">0.4% fee</p>
            </div>
            <p className="text-xl font-extrabold text-[#2F5BFF]">
              Rs {recipientGetsNpr.toLocaleString('en-IN')}
            </p>
            <span className="absolute bottom-[-11px] right-4 rounded-full bg-[#355BFF] px-3 py-1 text-xs font-extrabold text-white">
              Best rate
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.34 }}
            className="flex items-center justify-center gap-3 rounded-xl border border-[#CBEAFF] bg-[#F2FBFF] p-5 text-center text-sm font-extrabold text-[#2F5BFF]"
          >
            <TrendingIcon className="h-5 w-5" />
            Family gets Rs {savingsNpr.toLocaleString('en-IN')} more
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.34 }}
          className="mt-5 overflow-hidden rounded-xl border border-[#DCE6FF] bg-white/85 text-sm font-bold shadow-[0_18px_46px_-36px_rgba(47,91,255,0.4)]"
        >
          <SummaryRow label="Locked rate" value={`1 USDC = Rs ${lockedRate.toFixed(2)}`} />
          <SummaryRow label="Swiflo fee (0.4%)" value={`Rs ${swifloFee.toLocaleString('en-IN')}`} />
          <SummaryRow label="Recipient gets" value={`Rs ${recipientGetsNpr.toLocaleString('en-IN')}`} />
        </motion.div>

        {error && (
          <p className="mt-4 rounded-xl border border-[#FFD1D7] bg-[#FFF0F2] p-3 text-sm font-bold text-[#D92D43]">
            {error}
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#355BFF] px-5 py-4 text-base font-extrabold text-white shadow-[0_18px_42px_-24px_rgba(53,91,255,0.9)] transition-all hover:-translate-y-0.5 hover:bg-[#294DF0] disabled:translate-y-0 disabled:opacity-60"
        >
          {loading ? 'Confirming on-chain...' : 'Confirm & send'}
          <ArrowRightIcon className="h-5 w-5" />
        </button>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-[#60709A]">
          <LockIcon className="h-3.5 w-3.5 text-[#355BFF]" />
          Calls initiate_transfer on Solana Devnet - Rate locked
        </p>
      </motion.div>
    </div>
  )
}

export default function ConfirmPage() {
  return <Suspense><ConfirmContent /></Suspense>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#DCE6FF] px-5 py-4 last:border-b-0">
      <span className="text-[#60709A]">{label}</span>
      <span className="text-[#07133A]">{value}</span>
    </div>
  )
}

function ArrowLeftIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M19 12H5m0 0l6-6m-6 6l6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3z" />
    </svg>
  )
}

function TrendingIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 16l5-5 4 4 7-8m0 0v6m0-6h-6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
