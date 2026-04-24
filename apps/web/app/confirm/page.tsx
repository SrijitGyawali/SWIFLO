'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { usePrivy, useSolanaWallets } from '@privy-io/react-auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function ConfirmContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { getAccessToken } = usePrivy()
  const { wallets } = useSolanaWallets()

  const amountUsdc = params.get('amountUsdc') ?? '0'
  const phone = params.get('phone') ?? ''
  const lockedRate = parseFloat(params.get('lockedRate') ?? '133.5')
  const recipientGetsNpr = parseInt(params.get('recipientGetsNpr') ?? '0')
  const savingsNpr = parseInt(params.get('savingsNpr') ?? '0')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const usdcNum = parseFloat(amountUsdc)
  const nprGross = Math.round(usdcNum * lockedRate)
  const swifloFee = Math.round(nprGross * 0.004)

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getAccessToken()
      const wallet = wallets[0]
      if (!wallet) throw new Error('No Solana wallet found')

      // Notify backend — for demo this triggers the full flow
      const res = await fetch(`${API}/api/webhooks/transfer-initiated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transferId: String(Date.now()),
          recipientPhone: phone,
          amountUsdc: String(Math.round(usdcNum * 1_000_000)),
          lockedRate: String(Math.round(lockedRate * 1_000_000)),
          solanaTxSignature: `DEMO_${Date.now()}`,
          senderPubkey: wallet.address,
        }),
      })
      const data = await res.json()
      const id = data.transferId ?? 'demo'
      router.push(`/processing/${id}?savingsNpr=${savingsNpr}&amountUsdc=${amountUsdc}&amountNpr=${recipientGetsNpr}&phone=${encodeURIComponent(phone)}`)
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
      <p className="text-muted mb-8">Sending {amountUsdc} USDC → {phone}</p>

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
          <span className="text-txt">1 USDC = Rs {lockedRate.toFixed(2)}</span>
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
        {loading ? 'Confirming...' : 'Confirm & send →'}
      </button>
      <p className="text-dim text-xs text-center mt-4">Rate locked · Powered by Solana Devnet</p>
    </div>
  )
}

export default function ConfirmPage() {
  return <Suspense><ConfirmContent /></Suspense>
}
