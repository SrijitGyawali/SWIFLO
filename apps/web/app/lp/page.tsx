'use client'

import { useState, useEffect } from 'react'
import { useSolanaWallets } from '@privy-io/react-auth'
import {
  Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const RPC         = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const API         = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const VAULT_PROGRAM = new PublicKey('13BEbXJJ2aLQ6yMQA9QdtwguL2rDKdzsVBZNEbATwBhN')
const SWI_MINT    = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT   ?? '2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx')
const LP_MINT     = new PublicKey(process.env.NEXT_PUBLIC_LP_MINT     ?? '99sFqGr245Dohx8P2F616sPp4magaR87E4sxX1RKoBxD')
const VAULT_SWI   = new PublicKey(process.env.NEXT_PUBLIC_VAULT_SWI   ?? '3QpTAYX47hVjeL8WG7R8VoF5QncwZnA6ak4jEPUiDBtw')

const DEPOSIT_DISC     = Buffer.from([245, 99, 59, 25, 151, 71, 233, 249])
const CLAIM_YIELD_DISC = Buffer.from([49, 74, 111, 7, 186, 22, 61, 165])

function buildDepositIx(
  vaultPda: PublicKey, userPubkey: PublicKey,
  userSwi: PublicKey, userLpAta: PublicKey, amount: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(16)
  DEPOSIT_DISC.copy(data, 0)
  data.writeBigUInt64LE(amount, 8)
  return new TransactionInstruction({
    programId: VAULT_PROGRAM,
    data,
    keys: [
      { pubkey: vaultPda,    isSigner: false, isWritable: true  },
      { pubkey: LP_MINT,     isSigner: false, isWritable: true  },
      { pubkey: userPubkey,  isSigner: true,  isWritable: true  },
      { pubkey: userSwi,     isSigner: false, isWritable: true  },
      { pubkey: VAULT_SWI,   isSigner: false, isWritable: true  },
      { pubkey: userLpAta,   isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
  })
}

function buildClaimIx(
  vaultPda: PublicKey, userPubkey: PublicKey,
  userSwi: PublicKey, userLpAta: PublicKey, lpTokens: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(16)
  CLAIM_YIELD_DISC.copy(data, 0)
  data.writeBigUInt64LE(lpTokens, 8)
  return new TransactionInstruction({
    programId: VAULT_PROGRAM,
    data,
    keys: [
      { pubkey: vaultPda,    isSigner: false, isWritable: true  },
      { pubkey: LP_MINT,     isSigner: false, isWritable: true  },
      { pubkey: userPubkey,  isSigner: true,  isWritable: true  },
      { pubkey: userSwi,     isSigner: false, isWritable: true  },
      { pubkey: VAULT_SWI,   isSigner: false, isWritable: true  },
      { pubkey: userLpAta,   isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
  })
}

type VaultStats = {
  totalLiquidity: string
  activeAdvances: string
  utilizationBps: number
  currentAprBps: number
}

export default function LpPage() {
  const { wallets } = useSolanaWallets()
  const wallet = wallets[0]

  const [stats, setStats]           = useState<VaultStats | null>(null)
  const [swiBalance, setSwiBalance]  = useState<number | null>(null)
  const [lpBalance, setLpBalance]    = useState<number | null>(null)
  const [depositAmt, setDepositAmt]  = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [loading, setLoading]        = useState<'deposit' | 'withdraw' | null>(null)
  const [error, setError]            = useState('')
  const [success, setSuccess]        = useState('')

  useEffect(() => {
    fetch(`${API}/api/vault/state`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [success])

  useEffect(() => {
    if (!wallet) return
    const connection = new Connection(RPC, 'confirmed')
    const pubkey = new PublicKey(wallet.address)

    const load = async () => {
      const [swiAta, lpAta] = await Promise.all([
        getAssociatedTokenAddress(SWI_MINT, pubkey),
        getAssociatedTokenAddress(LP_MINT, pubkey),
      ])
      const [swiInfo, lpInfo] = await Promise.all([
        connection.getParsedAccountInfo(swiAta),
        connection.getParsedAccountInfo(lpAta),
      ])
      const swiAmt = (swiInfo.value?.data as any)?.parsed?.info?.tokenAmount?.uiAmount ?? 0
      const lpAmt  = (lpInfo.value?.data as any)?.parsed?.info?.tokenAmount?.uiAmount ?? 0
      setSwiBalance(swiAmt)
      setLpBalance(lpAmt)
    }
    load().catch(() => {})
  }, [wallet, success])

  const handleDeposit = async () => {
    setError(''); setSuccess('')
    const amt = parseFloat(depositAmt)
    if (!wallet || isNaN(amt) || amt <= 0) return
    setLoading('deposit')
    try {
      const connection = new Connection(RPC, 'confirmed')
      const userPubkey = new PublicKey(wallet.address)
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], VAULT_PROGRAM)
      const userSwi  = await getAssociatedTokenAddress(SWI_MINT, userPubkey)
      const userLpAta = await getAssociatedTokenAddress(LP_MINT, userPubkey)

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const tx = new Transaction()
      tx.recentBlockhash = blockhash
      tx.feePayer = userPubkey

      // Create LP ATA if it doesn't exist
      const lpAtaInfo = await connection.getAccountInfo(userLpAta)
      if (!lpAtaInfo) {
        tx.add(createAssociatedTokenAccountInstruction(
          userPubkey, userLpAta, userPubkey, LP_MINT,
          TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
        ))
      }

      const amountRaw = BigInt(Math.round(amt * 1_000_000))
      tx.add(buildDepositIx(vaultPda, userPubkey, userSwi, userLpAta, amountRaw))

      const sig = await wallet.sendTransaction(tx, connection)
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
      setSuccess(`Deposited ${amt} SWI — tx: ${sig.slice(0, 16)}…`)
      setDepositAmt('')
    } catch (e: any) {
      setError(e.message ?? 'Deposit failed')
    } finally {
      setLoading(null)
    }
  }

  const handleWithdraw = async () => {
    setError(''); setSuccess('')
    const amt = parseFloat(withdrawAmt)
    if (!wallet || isNaN(amt) || amt <= 0) return
    setLoading('withdraw')
    try {
      const connection = new Connection(RPC, 'confirmed')
      const userPubkey = new PublicKey(wallet.address)
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], VAULT_PROGRAM)
      const userSwi   = await getAssociatedTokenAddress(SWI_MINT, userPubkey)
      const userLpAta = await getAssociatedTokenAddress(LP_MINT, userPubkey)

      const lpTokensRaw = BigInt(Math.round(amt * 1_000_000))
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const tx = new Transaction()
      tx.recentBlockhash = blockhash
      tx.feePayer = userPubkey

      // Ensure user's SWI ATA exists (some wallets reject txs that would require ATA creation)
      const swiInfo = await connection.getAccountInfo(userSwi)
      if (!swiInfo) {
        tx.add(createAssociatedTokenAccountInstruction(
          userPubkey, userSwi, userPubkey, SWI_MINT,
          TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
        ))
      }

      tx.add(buildClaimIx(vaultPda, userPubkey, userSwi, userLpAta, lpTokensRaw))

      const sig = await wallet.sendTransaction(tx, connection)
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
      setSuccess(`Withdrew ${amt} SWI — tx: ${sig.slice(0, 16)}…`)
      setWithdrawAmt('')
    } catch (e: any) {
      setError(e.message ?? 'Withdraw failed')
    } finally {
      setLoading(null)
    }
  }

  const apr = stats ? (stats.currentAprBps / 100).toFixed(1) : '—'
  const utilPct = stats ? (stats.utilizationBps / 100).toFixed(1) : '—'
  const totalLiq = stats ? (Number(stats.totalLiquidity) / 1_000_000).toFixed(2) : '—'

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-txt mb-2">Earn yield</h1>
      <p className="text-muted mb-8">Deposit SWI to back remittances · earn fees as yield</p>

      {/* Vault stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-dim text-xs uppercase tracking-wide mb-1">APR</p>
          <p className="text-success text-2xl font-bold">{apr}%</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-dim text-xs uppercase tracking-wide mb-1">Total SWI</p>
          <p className="text-txt text-xl font-bold">{totalLiq}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-dim text-xs uppercase tracking-wide mb-1">Utilization</p>
          <p className="text-txt text-xl font-bold">{utilPct}%</p>
        </div>
      </div>

      {/* User balances */}
      {wallet && (
        <div className="flex gap-3 mb-8">
          <div className="flex-1 bg-surface2 rounded-xl border border-border px-4 py-3">
            <p className="text-dim text-xs mb-1">Your SWI</p>
            <p className="text-txt font-bold">{swiBalance === null ? '—' : swiBalance.toFixed(2)}</p>
          </div>
          <div className="flex-1 bg-surface2 rounded-xl border border-border px-4 py-3">
            <p className="text-dim text-xs mb-1">Your LP tokens</p>
            <p className="text-txt font-bold">{lpBalance === null ? '—' : lpBalance.toFixed(2)}</p>
          </div>
        </div>
      )}

      {error   && <p className="text-danger text-sm mb-4 bg-danger/10 rounded-lg p-3">{error}</p>}
      {success && <p className="text-success text-sm mb-4 bg-success/10 rounded-lg p-3">{success}</p>}

      {/* Deposit */}
      <div className="bg-surface rounded-xl border border-border p-5 mb-4">
        <p className="text-txt font-bold mb-3">Deposit SWI</p>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Amount"
            value={depositAmt}
            onChange={e => setDepositAmt(e.target.value)}
            className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-txt outline-none placeholder-dim"
          />
          <button
            onClick={handleDeposit}
            disabled={loading !== null}
            className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {loading === 'deposit' ? 'Depositing…' : 'Deposit'}
          </button>
        </div>
        <p className="text-dim text-xs mt-2">You receive LP tokens 1:1 · redeemable anytime</p>
      </div>

      {/* Withdraw */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <p className="text-txt font-bold mb-3">Withdraw</p>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="LP tokens to burn"
            value={withdrawAmt}
            onChange={e => setWithdrawAmt(e.target.value)}
            className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-txt outline-none placeholder-dim"
          />
          <button
            onClick={handleWithdraw}
            disabled={loading !== null}
            className="bg-surface2 hover:bg-border disabled:opacity-50 text-txt font-semibold px-5 py-2 rounded-lg border border-border transition-colors"
          >
            {loading === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
          </button>
        </div>
        {stats && (
          <p className="text-dim text-xs mt-2">
            Available: {((Number(stats.totalLiquidity) - Number(stats.activeAdvances)) / 1_000_000).toFixed(2)} SWI
            {Number(stats.activeAdvances) > 0 && ` (${(Number(stats.activeAdvances) / 1_000_000).toFixed(2)} SWI locked)`}
          </p>
        )}
        <p className="text-dim text-xs mt-1">Burns LP tokens · returns SWI to your wallet</p>
      </div>
    </div>
  )
}
