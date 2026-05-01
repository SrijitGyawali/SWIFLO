'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useSolanaWallets } from '@privy-io/react-auth'
import {
  Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction,
} from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'

const API       = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const RPC       = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
const POOL_PROGRAM_ID = process.env.NEXT_PUBLIC_REMITTANCE_POOL_PROGRAM_ID
  ?? 'GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ'
const POOL_USDC = process.env.NEXT_PUBLIC_POOL_USDC ?? ''

const INITIATE_TRANSFER_DISC = Buffer.from([128, 229, 77, 5, 65, 234, 228, 75])
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

  const amountUsdc       = params.get('amountUsdc') ?? '0'
  const phone            = params.get('phone') ?? ''
  const lockedRate       = parseFloat(params.get('lockedRate') ?? '133.5')
  const recipientGetsNpr = parseInt(params.get('recipientGetsNpr') ?? '0')
  const savingsNpr       = parseInt(params.get('savingsNpr') ?? '0')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const usdcNum    = parseFloat(amountUsdc)
  const nprGross   = Math.round(usdcNum * lockedRate)
  const swifloFee  = Math.round(nprGross * 0.004)
  const wuReceives = Math.round(nprGross * 0.94)

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const wallet = wallets[0]
      if (!wallet)    throw new Error('No Solana wallet found. Please log in again.')
      if (!POOL_USDC) throw new Error('NEXT_PUBLIC_POOL_USDC is not configured.')

      const connection   = new Connection(RPC, 'confirmed')
      const programId    = new PublicKey(POOL_PROGRAM_ID)
      const senderPubkey = new PublicKey(wallet.address)
      const usdcMint     = new PublicKey(USDC_MINT)
      const poolUsdc     = new PublicKey(POOL_USDC)

      const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], programId)

      const poolInfo = await connection.getAccountInfo(poolPda)
      if (!poolInfo) throw new Error('Remittance pool not found on devnet. Has it been initialized?')
      const totalTransfers = poolInfo.data.readBigUInt64LE(POOL_TOTAL_TRANSFERS_OFFSET)

      const seqBuf = Buffer.alloc(8)
      seqBuf.writeBigUInt64LE(totalTransfers)
      const [transferPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('transfer'), seqBuf],
        programId,
      )

      const senderUsdc       = await getAssociatedTokenAddress(usdcMint, senderPubkey)
      const amountLamports   = BigInt(Math.round(usdcNum * 1_000_000))
      const lockedRateScaled = BigInt(Math.round(lockedRate * 1_000_000))
      const recipientHash    = new Uint8Array(32)

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

      const signature = await wallet.sendTransaction(tx, connection)
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')

      const res = await fetch(`${API}/api/webhooks/transfer-initiated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId:        totalTransfers.toString(),
          recipientPhone:    phone,
          amountUsdc:        amountLamports.toString(),
          lockedRate:        lockedRateScaled.toString(),
          solanaTxSignature: signature,
          senderPubkey:      wallet.address,
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
    <div className="relative min-h-screen bg-[#0B0D10] overflow-hidden flex flex-col">
      {/* Atmospheric blobs */}
      <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/5 rounded-full blur-[150px] -z-10" />

      <div className="flex-grow pt-24 md:pt-32 pb-16 md:pb-24 px-5 md:px-8">
        <div className="max-w-lg mx-auto">

          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-on-surface-variant hover:text-white text-sm mb-8 transition-colors group"
          >
            <span className="material-symbols-outlined text-base leading-none group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Edit transfer
          </button>

          {/* Header */}
          <header className="mb-8">
            <span className="font-space-grotesk text-xs tracking-[0.2em] text-primary uppercase mb-3 block">Review</span>
            <h1 className="font-manrope text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">Confirm transfer</h1>
            <p className="text-on-surface-variant text-sm">
              Sending <span className="text-white font-semibold">{amountUsdc} SWI</span> → <span className="text-white font-semibold">{phone}</span>
            </p>
          </header>

          {/* Comparison */}
          <div className="space-y-3 mb-6">
            <div className="glass-card rounded-xl p-4 flex justify-between items-center opacity-60">
              <div>
                <p className="font-space-grotesk text-sm text-on-surface-variant font-semibold">Western Union</p>
                <p className="font-space-grotesk text-xs text-red-400 mt-0.5">~1.8% markup</p>
              </div>
              <p className="font-manrope text-xl font-bold text-on-surface-variant tabular-nums">
                Rs {wuReceives.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 flex justify-between items-center bg-indigo-500/5 border-l-2 border-indigo-500">
              <div>
                <p className="font-manrope text-sm text-white font-bold">Swiflo</p>
                <p className="font-space-grotesk text-xs text-primary mt-0.5">0.4% fee only</p>
              </div>
              <p className="font-manrope text-xl font-bold text-primary tabular-nums">
                Rs {recipientGetsNpr.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-xl bg-green-500/5 border border-green-500/20 px-4 py-3 text-center">
              <p className="font-space-grotesk text-xs text-green-400">
                Family gets Rs {savingsNpr.toLocaleString('en-IN')} more with Swiflo
              </p>
            </div>
          </div>

          {/* Fee breakdown */}
          <div className="glass-card rounded-xl border-t border-l border-white/15 p-5 mb-6 space-y-3">
            <p className="font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant mb-1">Breakdown</p>
            {[
              { label: 'Locked rate',     value: `1 SWI = Rs ${lockedRate.toFixed(2)}` },
              { label: 'Gross NPR',       value: `Rs ${nprGross.toLocaleString('en-IN')}` },
              { label: 'Swiflo fee (0.4%)', value: `− Rs ${swifloFee.toLocaleString('en-IN')}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{label}</span>
                <span className="text-white font-space-grotesk tabular-nums">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t border-white/10 pt-3">
              <span className="text-on-surface-variant font-semibold">Recipient gets</span>
              <span className="text-primary font-bold font-manrope text-base tabular-nums">
                Rs {recipientGetsNpr.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 mb-6">
              <span className="material-symbols-outlined text-red-400 text-xl leading-none flex-shrink-0 mt-0.5">error</span>
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-[#1E2875] hover:bg-[#4A5CB5] py-5 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(30,40,117,0.3)]"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
            <span className="relative z-10 font-manrope text-xl text-white tracking-widest flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin leading-none">sync</span>
                  Confirming on-chain…
                </>
              ) : (
                <>
                  Confirm & send
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform leading-none">arrow_forward</span>
                </>
              )}
            </span>
          </button>

          <p className="text-on-surface-variant/50 text-xs text-center mt-4 font-space-grotesk">
            Calls <code className="text-primary/60">initiate_transfer</code> on Solana Devnet · Rate locked
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return <React.Suspense><ConfirmContent /></React.Suspense>
}
