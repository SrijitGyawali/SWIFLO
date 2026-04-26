'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'

type TokenHolding = {
  mint: string
  amount: string
}

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
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

  if (parsedInfo?.mint === USDC_MINT && parsedInfo?.tokenAmount) {
    return Number(parsedInfo.tokenAmount.uiAmount ?? parsedInfo.tokenAmount.amount / 10 ** parsedInfo.tokenAmount.decimals)
  }

  const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
    mint: new PublicKey(USDC_MINT),
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
  const [holdingsOpen, setHoldingsOpen] = useState(false)
  const [holdingsLoading, setHoldingsLoading] = useState(false)
  const [holdingsError, setHoldingsError] = useState('')
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [nativeBalance, setNativeBalance] = useState<number | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null)

  const address = wallets[0]?.address

  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!holdingsOpen || !address) return

    let cancelled = false

    const loadHoldings = async () => {
      setHoldingsLoading(true)
      setHoldingsError('')
      try {
        const [result, native, usdc, parsedAccount] = await Promise.all([
          fetchTokenHoldings(address),
          fetchNativeBalance(address),
          fetchUSDCBalance(address),
          connection.getParsedAccountInfo(new PublicKey(address), 'confirmed'),
        ])
        if (!cancelled) {
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
        }
      } catch (error) {
        if (!cancelled) {
          setHoldingsError('Could not load token holdings')
          setHoldings([])
          setNativeBalance(null)
          setUsdcBalance(null)
        }
      } finally {
        if (!cancelled) setHoldingsLoading(false)
      }
    }

    void loadHoldings()

    return () => {
      cancelled = true
    }
  }, [holdingsOpen, address])

  return (
    <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
      <Link href="/" className="text-xl font-bold text-txt tracking-tight">
        swiflo
      </Link>
      <div className="flex items-center gap-6">
        <Link href="/explorer" className="text-muted hover:text-txt text-sm transition-colors">Explorer</Link>
        <Link href="/send" className="text-muted hover:text-txt text-sm transition-colors">Send</Link>
        <Link href="/lp" className="text-muted hover:text-txt text-sm transition-colors">Earn</Link>
        {ready && (
          authenticated ? (
            <div
              className="relative flex items-center gap-3"
              onMouseEnter={() => setHoldingsOpen(true)}
              onMouseLeave={() => setHoldingsOpen(false)}
            >
              {address && (
                <button
                  onClick={copyAddress}
                  title="Click to copy wallet address"
                  className="text-xs font-mono text-muted hover:text-txt bg-surface border border-border px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? 'Copied!' : `${address.slice(0, 4)}...${address.slice(-4)}`}
                </button>
              )}

              {address && holdingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-surface shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-dim">Wallet holdings</p>
                      <p className="text-sm text-muted font-mono truncate">{address}</p>
                    </div>
                    <button
                      onClick={copyAddress}
                      className="text-xs font-semibold px-2 py-1 rounded-md bg-surface2 border border-border text-txt hover:bg-border transition-colors"
                    >
                      Copy
                    </button>
                  </div>

                  {holdingsLoading && <p className="text-sm text-muted">Loading tokens...</p>}
                  {holdingsError && <p className="text-sm text-danger">{holdingsError}</p>}

                  {!holdingsLoading && !holdingsError && (
                    <div className="space-y-3 max-h-72 overflow-auto pr-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-surface2 border border-border px-3 py-2">
                          <p className="text-xs text-dim uppercase tracking-wide mb-1">Native SOL</p>
                          <p className="text-sm font-bold text-txt">{nativeBalance === null ? '—' : `${nativeBalance.toFixed(4)} SOL`}</p>
                        </div>
                        <div className="rounded-xl bg-surface2 border border-border px-3 py-2">
                          <p className="text-xs text-dim uppercase tracking-wide mb-1">USDC</p>
                          <p className="text-sm font-bold text-txt">{usdcBalance === null ? '—' : `${usdcBalance.toFixed(2)} USDC`}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-dim mb-2">All tokens</p>
                        {holdings.length === 0 ? (
                          <p className="text-sm text-muted">No SPL token balances found.</p>
                        ) : (
                          holdings.map((holding) => (
                            <div key={holding.mint} className="flex items-center justify-between gap-4 rounded-xl bg-surface2 border border-border px-3 py-2 mb-2 last:mb-0">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-txt truncate">{holding.mint === USDC_MINT ? 'USDC' : `${holding.mint.slice(0, 6)}...${holding.mint.slice(-6)}`}</p>
                                <p className="text-xs text-dim font-mono truncate">{holding.mint}</p>
                              </div>
                              <p className="text-sm font-bold text-txt whitespace-nowrap">{holding.amount}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button onClick={logout} className="text-sm text-muted hover:text-danger transition-colors">
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Connect
            </button>
          )
        )}
      </div>
    </nav>
  )
}
