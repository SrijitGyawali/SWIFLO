'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useSolanaWallets } from '@privy-io/react-auth'
import {
  Connection, PublicKey, Transaction, TransactionInstruction,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { motion } from 'framer-motion'
import { WalletGate } from '@/components/WalletGate'

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
  return (
    <WalletGate
      title="Connect to earn"
      description="Connect your wallet to deposit USDC, view LP tokens, and manage yield."
    >
      <LpDashboard />
    </WalletGate>
  )
}

function LpDashboard() {
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
    const load = () => fetch(`${API}/api/vault/state`).then(r => r.json()).then(setStats).catch(() => {})
    load()
    const id = setInterval(load, 10_000)
    return () => clearInterval(id)
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
      setSuccess(`Deposited ${amt} USDC - tx: ${sig.slice(0, 16)}...`)
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

    // Pre-flight: check vault has enough liquid USDC before sending on-chain
    if (stats) {
      const availableRaw = Number(stats.totalLiquidity) - Number(stats.activeAdvances)
      const requestedRaw = Math.round(amt * 1_000_000)
      if (requestedRaw > availableRaw) {
        const availableSWI = Math.max(0, availableRaw / 1_000_000)
        const lockedSWI    = (Number(stats.activeAdvances) / 1_000_000).toFixed(2)
        if (availableSWI <= 0) {
          setError(`No USDC is available right now - ${lockedSWI} USDC is fully locked in active remittances. Wait for settlements to complete.`)
        } else {
          setError(`Vault only has ${availableSWI.toFixed(2)} USDC available - ${lockedSWI} USDC is locked in active remittances. Withdraw up to ${availableSWI.toFixed(2)} USDC.`)
        }
        return
      }
    }

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

      // Ensure user's USDC ATA exists (some wallets reject txs that would require ATA creation)
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
      setSuccess(`Withdrew ${amt} USDC - tx: ${sig.slice(0, 16)}...`)
      setWithdrawAmt('')
    } catch (e: any) {
      const msg: string = e.message ?? ''
      if (msg.includes('insufficient funds') || msg.includes('0x1') || msg.includes('custom program error: 0x1')) {
        setError('Vault has insufficient liquidity to fulfil this withdrawal. Funds may still be locked in active remittances - try again after settlements complete.')
      } else if (msg.includes('insufficient lamports') || msg.includes('not enough SOL')) {
        setError('Your wallet does not have enough SOL to pay the transaction fee.')
      } else {
        setError(msg || 'Withdraw failed')
      }
    } finally {
      setLoading(null)
    }
  }

  const apr = stats ? (stats.currentAprBps / 100).toFixed(1) : '--'
  const utilPct = stats ? (stats.utilizationBps / 100).toFixed(1) : '--'
  const totalLiq = stats ? (Number(stats.totalLiquidity) / 1_000_000).toFixed(2) : '--'
  const availableUsdc = stats
    ? ((Number(stats.totalLiquidity) - Number(stats.activeAdvances)) / 1_000_000).toFixed(2)
    : '--'

  return (
    <div className="relative mx-auto w-full max-w-[1060px] overflow-hidden px-5 pb-12 pt-8 sm:px-8">
      <EarnBackground />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <EarnHero />

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <MetricCard
            icon={<ChartIcon className="h-6 w-6" />}
            label="APR"
            value={`${apr}%`}
            caption="Current Annual Percentage Rate"
            accent="green"
            badge="Live"
          />
          <MetricCard
            icon={<PieIcon className="h-6 w-6" />}
            label="Total USDC"
            value={totalLiq}
            caption="Total deposited by all users"
          />
          <MetricCard
            icon={<ShieldIcon className="h-6 w-6" />}
            label="Utilization"
            value={`${utilPct}%`}
            caption="Current pool utilization"
          />
        </div>

        {wallet && (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <BalanceCard
              icon={<WalletIcon className="h-6 w-6" />}
              label="Your USDC"
              value={swiBalance === null ? '--' : swiBalance.toFixed(2)}
              caption="Total deposited"
            />
            <BalanceCard
              icon={<LpIcon className="h-6 w-6" />}
              label="Your LP tokens"
              value={lpBalance === null ? '--' : lpBalance.toFixed(2)}
              caption="Total LP tokens earned"
            />
          </div>
        )}

        {(error || success) && (
          <div className="mt-5">
            {error && <p className="rounded-2xl border border-[#FFD1D7] bg-[#FFF0F2] p-4 text-sm font-bold text-[#D92D43]">{error}</p>}
            {success && <p className="rounded-2xl border border-[#BFF5DF] bg-[#F0FFF8] p-4 text-sm font-bold text-[#00A76F]">{success}</p>}
          </div>
        )}

        <ActionPanel
          title="Deposit USDC"
          subtitle="Deposit USDC and start earning yield instantly."
          icon={<UsdcIcon className="h-8 w-8" />}
          inputLabel="Amount"
          inputValue={depositAmt}
          inputPlaceholder="0.00"
          suffix="USDC"
          onInputChange={setDepositAmt}
          buttonLabel={loading === 'deposit' ? 'Depositing...' : 'Deposit'}
          buttonVariant="solid"
          disabled={loading !== null}
          onClick={handleDeposit}
        >
          <div className="mt-8 grid gap-5 border-b border-[#DCE6FF] pb-7 md:grid-cols-4">
            <Feature icon={<ChartIcon className="h-5 w-5" />} title="Earn yield" text={`${apr}% APR on your USDC deposits`} />
            <Feature icon={<BoltIcon className="h-5 w-5" />} title="Back remittances" text="Your funds help power real-time transfers" />
            <Feature icon={<LightningIcon className="h-5 w-5" />} title="Withdraw anytime" text="No lock-in period. Full flexibility" />
            <Feature icon={<ShieldIcon className="h-5 w-5" />} title="Secure & audited" text="Built on Solana with end-to-end security" />
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm font-extrabold text-[#7B8EC8]">
            <InfoIcon className="h-4 w-4" />
            You receive LP tokens (1:1) - redeemable anytime
          </p>
        </ActionPanel>

        <ActionPanel
          title="Withdraw"
          subtitle="Burn LP tokens to withdraw your USDC."
          icon={<LpIcon className="h-8 w-8" />}
          inputLabel="LP tokens to burn"
          inputValue={withdrawAmt}
          inputPlaceholder="0.00"
          suffix="LP"
          onInputChange={setWithdrawAmt}
          buttonLabel={loading === 'withdraw' ? 'Withdrawing...' : 'Withdraw'}
          buttonVariant="outline"
          disabled={loading !== null}
          onClick={handleWithdraw}
          footer={
            <>
              <p>Available: {availableUsdc} USDC</p>
              {stats && Number(stats.activeAdvances) > 0 && (
                <p>{(Number(stats.activeAdvances) / 1_000_000).toFixed(2)} USDC is locked in active remittances</p>
              )}
              <p>Burns LP tokens - returns USDC to your wallet</p>
            </>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.36 }}
          className="mt-6 flex flex-col gap-4 rounded-3xl border border-[#DCE6FF] bg-white/70 p-6 shadow-[0_24px_70px_-50px_rgba(47,91,255,0.65)] backdrop-blur md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#355BFF]">
              <ShieldIcon className="h-9 w-9" />
            </span>
            <div>
              <p className="text-lg font-extrabold text-[#07133A]">Your funds are always secure</p>
              <p className="mt-1 text-sm font-bold text-[#7B8EC8]">Smart contract audited - Non-custodial - Transparent</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 text-sm font-extrabold text-[#355BFF]">
            Learn more
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </motion.div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm font-extrabold text-[#9AA8CB]">
          <ShieldIcon className="h-4 w-4" />
          Earn yield. Power remittances. Build the future.
        </p>
      </motion.section>
    </div>
  )
}

function EarnBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -18, 0], opacity: [0.28, 0.5, 0.28] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-10 top-20 h-60 w-60 rounded-full bg-[#8CB2FF]/25 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -24, 0], y: [0, 18, 0], opacity: [0.2, 0.38, 0.2] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 left-6 h-56 w-56 rounded-full bg-[#B6F3FF]/35 blur-3xl"
      />
    </div>
  )
}

function EarnHero() {
  return (
    <div className="relative mx-auto flex h-[300px] max-w-[680px] items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute h-32 w-[420px] rounded-[50%] border border-[#D6E2FF]"
      />
      <motion.div
        animate={{ y: [0, -9, 0], scale: [1, 1.035, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[#9CB8FF] to-[#355BFF] shadow-[0_34px_74px_-32px_rgba(53,91,255,0.95)]"
      >
        <span className="absolute inset-3 rounded-full border-4 border-white/55" />
        <span className="text-6xl font-black text-white">$</span>
      </motion.div>
      <div className="absolute bottom-10 h-12 w-56 rounded-[50%] border border-[#C9D8FF] bg-[#F1F6FF] shadow-[0_28px_60px_-40px_rgba(53,91,255,0.9)]" />
      <FloatingToken className="left-14 top-16" icon={<SolanaIcon className="h-7 w-7" />} />
      <FloatingToken className="right-14 top-20" icon={<EthIcon className="h-7 w-7" />} />
      <FloatingToken className="left-4 bottom-24" icon={<DropIcon className="h-7 w-7" />} />
      <FloatingToken className="right-4 bottom-24" icon={<PolygonIcon className="h-7 w-7" />} />
    </div>
  )
}

function FloatingToken({ className, icon }: { className: string; icon: ReactNode }) {
  return (
    <motion.span
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute flex h-16 w-16 items-center justify-center rounded-full border border-[#DCE6FF] bg-white/80 text-[#355BFF] shadow-[0_22px_48px_-32px_rgba(47,91,255,0.8)] backdrop-blur ${className}`}
    >
      {icon}
    </motion.span>
  )
}

function MetricCard({ icon, label, value, caption, accent = 'blue', badge }: {
  icon: ReactNode
  label: string
  value: string
  caption: string
  accent?: 'blue' | 'green'
  badge?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34 }}
      className="rounded-3xl border border-[#DCE6FF] bg-white/72 p-6 shadow-[0_24px_70px_-50px_rgba(47,91,255,0.65)] backdrop-blur"
    >
      <div className="flex items-center gap-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FF] text-[#355BFF]">{icon}</span>
        <div>
          <p className="text-sm font-extrabold uppercase text-[#7B8EC8]">{label}</p>
          <div className="mt-2 flex items-center gap-3">
            <p className={`text-3xl font-extrabold ${accent === 'green' ? 'text-[#00B879]' : 'text-[#07133A]'}`}>{value}</p>
            {badge && <span className="rounded-full bg-[#DFFBEF] px-4 py-2 text-xs font-extrabold text-[#00A76F]">{badge}</span>}
          </div>
          <p className="mt-3 text-sm font-bold text-[#7B8EC8]">{caption}</p>
        </div>
      </div>
    </motion.div>
  )
}

function BalanceCard({ icon, label, value, caption }: { icon: ReactNode; label: string; value: string; caption: string }) {
  return (
    <div className="rounded-3xl border border-[#DCE6FF] bg-white/72 p-6 shadow-[0_24px_70px_-50px_rgba(47,91,255,0.65)] backdrop-blur">
      <div className="flex items-center gap-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FF] text-[#355BFF]">{icon}</span>
        <div>
          <p className="text-sm font-extrabold text-[#7B8EC8]">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-[#07133A]">{value}</p>
          <p className="mt-2 text-sm font-bold text-[#7B8EC8]">{caption}</p>
        </div>
      </div>
    </div>
  )
}

function ActionPanel({
  title, subtitle, icon, inputLabel, inputValue, inputPlaceholder, suffix, onInputChange,
  buttonLabel, buttonVariant, disabled, onClick, children, footer,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  inputLabel: string
  inputValue: string
  inputPlaceholder: string
  suffix: string
  onInputChange: (value: string) => void
  buttonLabel: string
  buttonVariant: 'solid' | 'outline'
  disabled: boolean
  onClick: () => void
  children?: ReactNode
  footer?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.36 }}
      className="mt-6 rounded-3xl border border-[#DCE6FF] bg-white/72 p-6 shadow-[0_24px_70px_-50px_rgba(47,91,255,0.65)] backdrop-blur sm:p-7"
    >
      <h2 className="text-2xl font-extrabold text-[#07133A]">{title}</h2>
      <p className="mt-2 text-sm font-bold text-[#60709A]">{subtitle}</p>

      <div className="mt-7 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex min-h-[84px] items-center gap-4 rounded-2xl border border-[#DCE6FF] bg-white/70 px-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF1FF] text-[#087DDC]">{icon}</span>
          <label className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-[#7B8EC8]">{inputLabel}</span>
            <input
              type="number"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={e => onInputChange(e.target.value)}
              className="mt-1 w-full bg-transparent text-2xl font-extrabold text-[#07133A] outline-none placeholder:text-[#A7B4D5]"
            />
          </label>
          <span className="rounded-xl bg-[#EEF3FF] px-4 py-2 text-xs font-extrabold text-[#355BFF]">{suffix}</span>
        </div>
        <button
          onClick={onClick}
          disabled={disabled}
          className={buttonVariant === 'solid'
            ? 'rounded-2xl bg-[#355BFF] px-8 py-5 text-xl font-extrabold text-white shadow-[0_22px_48px_-24px_rgba(53,91,255,0.95)] transition-all hover:-translate-y-0.5 hover:bg-[#294DF0] disabled:translate-y-0 disabled:opacity-60'
            : 'rounded-2xl border-2 border-[#6F86FF] bg-white px-8 py-5 text-xl font-extrabold text-[#355BFF] transition-all hover:-translate-y-0.5 hover:bg-[#F4F7FF] disabled:translate-y-0 disabled:opacity-60'}
        >
          {buttonLabel}
        </button>
      </div>

      {children}
      {footer && <div className="mt-5 space-y-2 text-sm font-bold text-[#60709A]">{footer}</div>}
    </motion.div>
  )
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#EEF3FF] text-[#355BFF]">{icon}</span>
      <div>
        <p className="text-sm font-extrabold text-[#07133A]">{title}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-[#60709A]">{text}</p>
      </div>
    </div>
  )
}

function ChartIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 19h16M7 16v-4m5 4V7m5 9v-7M6 10l4-4 4 3 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function PieIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M12 3v9h9A9 9 0 1012 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M15 3.5A9 9 0 0120.5 9H15V3.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M9 12l2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function WalletIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M16 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function LpIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" /><path d="M4 20a5 5 0 0110 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="17" cy="15" r="3" stroke="currentColor" strokeWidth="2" /><path d="M19.5 19.5l1.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function UsdcIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 7v10m3-7.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.2 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function BoltIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M13 2L4 14h7l-1 8 10-13h-7l0-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function LightningIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M13 3L6 13h6l-1 8 7-11h-6l1-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function InfoIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 11v5m0-8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M5 12h14m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

function SolanaIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M6 7h12l-3 3H3l3-3zm3 4h12l-3 3H6l3-3zm-3 4h12l-3 3H3l3-3z" fill="currentColor" /></svg>
}

function EthIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M12 3l6 9-6 3-6-3 6-9zm0 18l6-7-6 3-6-3 6 7z" fill="currentColor" /></svg>
}

function DropIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M12 3s6 6.2 6 11a6 6 0 11-12 0c0-4.8 6-11 6-11z" fill="currentColor" /></svg>
}

function PolygonIcon({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M8 8l4-2.3L16 8v4.6l-4 2.3-4-2.3V8zm8 0l4-2.3 4 2.3v4.6l-4 2.3-4-2.3M0 8l4-2.3L8 8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" transform="translate(0 2) scale(.9)" /></svg>
}
