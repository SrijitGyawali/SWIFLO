'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth'
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

// Discriminator from apps/web/idl/swiflo_remittance_pool.json
const INITIATE_TRANSFER_DISC = Buffer.from([128, 229, 77, 5, 65, 234, 228, 75])

// Pool account layout offsets (Anchor discriminator = 8 bytes)
// authority(32) + mto_authority(32) + fee_bps(2) = 74 → total_transfers u64
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
  const { getAccessToken } = usePrivy()
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
      const token  = await getAccessToken()
      const wallet = wallets[0]
      if (!wallet)    throw new Error('No Solana wallet found. Please log in again.')
      if (!POOL_USDC) throw new Error('NEXT_PUBLIC_POOL_USDC is not configured.')

      const connection  = new Connection(RPC, 'confirmed')
      const programId   = new PublicKey(POOL_PROGRAM_ID)
      const senderPubkey = new PublicKey(wallet.address)
      const usdcMint    = new PublicKey(USDC_MINT)
      const poolUsdc    = new PublicKey(POOL_USDC)

      // Derive pool PDA  seeds = [b"pool"]
      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool')],
        programId,
      )

      // Read pool account to get current total_transfers (used as transfer PDA seed)
      const poolInfo = await connection.getAccountInfo(poolPda)
      if (!poolInfo) throw new Error('Remittance pool not found on devnet. Has it been initialized?')
      const totalTransfers = poolInfo.data.readBigUInt64LE(POOL_TOTAL_TRANSFERS_OFFSET)

      // Derive transfer PDA  seeds = [b"transfer", total_transfers as le64]
      const seqBuf = Buffer.alloc(8)
      seqBuf.writeBigUInt64LE(totalTransfers)
      const [transferPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('transfer'), seqBuf],
        programId,
      )

      // Sender's USDC ATA
      const senderUsdc = await getAssociatedTokenAddress(usdcMint, senderPubkey)

      const amountLamports = BigInt(Math.round(usdcNum * 1_000_000))
      const lockedRateScaled = BigInt(Math.round(lockedRate * 1_000_000))
      const recipientHash  = new Uint8Array(32) // zero hash — phone kept off-chain

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

      // Notify backend with the on-chain transfer_id and real signature
      const res = await fetch(`${API}/api/webhooks/transfer-initiated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
    <div className="max-w-lg mx-auto px-6 py-16">
      <button onClick={() => router.back()} className="text-muted text-sm hover:text-txt mb-8 block transition-colors">
        ← Edit transfer
      </button>

      <h1 className="text-3xl font-extrabold text-txt mb-2">Confirm transfer</h1>
      <p className="text-muted mb-8">Sending {amountUsdc} SWI → {phone}</p>

      {/* Comparison */}
      <div className="space-y-3 mb-8">
        <div className="bg-surface2 rounded-xl p-4 border border-border flex justify-between items-center">
          <div>
            <p className="text-muted font-semibold">Western Union</p>
            <p className="text-danger text-xs mt-1">6% fee</p>
          </div>
          <p className="text-muted text-xl font-bold">Rs {Math.round(nprGross * 0.94).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-accent/10 rounded-xl p-4 border border-accent flex justify-between items-center">
          <div>
            <p className="text-txt font-bold">Swiflo</p>
            <p className="text-success text-xs mt-1">0.4% fee</p>
          </div>
          <p className="text-txt text-xl font-bold">Rs {recipientGetsNpr.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-success/10 rounded-xl p-3 text-center border border-success/20">
          <p className="text-success font-semibold">Family gets Rs {savingsNpr.toLocaleString('en-IN')} more</p>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Locked rate</span>
          <span className="text-txt">1 SWI = Rs {lockedRate.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Swiflo fee (0.4%)</span>
          <span className="text-txt">Rs {swifloFee.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-muted">Recipient gets</span>
          <span className="text-txt font-bold">Rs {recipientGetsNpr.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {error && <p className="text-danger text-sm mb-4 bg-danger/10 rounded-lg p-3">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-colors"
      >
        {loading ? 'Confirming on-chain...' : 'Confirm & send →'}
      </button>
      <p className="text-dim text-xs text-center mt-4">
        Calls <code>initiate_transfer</code> on Solana Devnet · Rate locked
      </p>
    </div>
  )
}

export default function ConfirmPage() {
  return <Suspense><ConfirmContent /></Suspense>
}
