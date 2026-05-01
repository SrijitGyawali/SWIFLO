'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth'
import { useEffect, useState, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSidebar } from './SidebarContext'
import { NAV_LINKS } from './Navbar'

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const SWI_MINT   = '2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx'
const connection = new Connection(SOLANA_RPC, 'confirmed')

type TokenRow = { symbol: string; mint: string; amount: string }

async function loadWalletData(address: string) {
  const pubkey = new PublicKey(address)
  const [lamports, tokenAccounts] = await Promise.all([
    connection.getBalance(pubkey, 'confirmed'),
    connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    }, 'confirmed'),
  ])

  const tokens: TokenRow[] = tokenAccounts.value
    .map(entry => {
      const info        = entry.account.data.parsed?.info
      const tokenAmount = info?.tokenAmount
      return {
        symbol: info?.mint === SWI_MINT ? 'SWI' : info?.mint?.slice(0, 6) ?? '???',
        mint:   info?.mint ?? '',
        amount: tokenAmount?.uiAmountString ?? String(tokenAmount?.uiAmount ?? 0),
      }
    })
    .filter(t => t.mint && t.amount !== '0')

  return { sol: lamports / 1_000_000_000, tokens }
}

export function WalletSidebar() {
  const { open, close } = useSidebar()
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useSolanaWallets()
  const pathname = usePathname()

  const [copied, setCopied]   = useState(false)
  const [sol, setSol]         = useState<number | null>(null)
  const [tokens, setTokens]   = useState<TokenRow[]>([])
  const [loading, setLoading] = useState(false)

  const address = wallets[0]?.address

  const refresh = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const data = await loadWalletData(address)
      setSol(data.sol)
      setTokens(data.tokens)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [address])

  useEffect(() => {
    if (!authenticated || !address) { setSol(null); setTokens([]); return }
    void refresh()
    const id = setInterval(refresh, 10_000)
    return () => clearInterval(id)
  }, [authenticated, address, refresh])

  const copy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const swi    = tokens.find(t => t.mint === SWI_MINT)
  const others = tokens.filter(t => t.mint !== SWI_MINT)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed right-0 top-0 h-full w-72 border-l border-white/10 bg-[#0B0D10]/95 backdrop-blur-2xl shadow-[-10px_0_40px_rgba(0,0,0,0.6)] z-50 flex flex-col p-6 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mt-14 md:mt-20 flex flex-col flex-1 overflow-y-auto">

          {/* ── Mobile nav links (hidden on md+) ── */}
          <div className="md:hidden mb-6 pb-6 border-b border-white/10">
            <p className="font-space-grotesk text-[10px] tracking-[0.15em] uppercase text-gray-600 mb-3">Navigation</p>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className={`font-manrope text-sm tracking-widest font-semibold uppercase px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? 'text-white bg-indigo-500/10 border border-indigo-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
              {/* Mobile connect button */}
              {ready && !authenticated && (
                <button
                  onClick={() => { login(); close() }}
                  className="mt-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-manrope text-xs tracking-widest uppercase rounded-lg transition-all"
                >
                  CONNECT WALLET
                </button>
              )}
            </nav>
          </div>

          {/* ── Wallet header ── */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-indigo-400 text-xl leading-none">account_balance_wallet</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-manrope font-bold text-base">
                {authenticated ? 'Connected Wallet' : 'No Wallet'}
              </p>
              {address ? (
                <button
                  onClick={copy}
                  className="font-mono text-xs text-gray-500 hover:text-gray-300 transition-colors truncate block max-w-[170px] text-left"
                  title={address}
                >
                  {copied ? '✓ Copied!' : `${address.slice(0, 8)}...${address.slice(-4)}`}
                </button>
              ) : (
                <p className="font-mono text-xs text-gray-600">not connected</p>
              )}
            </div>
          </div>

          {/* Token balances */}
          {authenticated ? (
            <div className="space-y-2 flex-1">
              {loading && sol === null && (
                <p className="text-xs text-gray-600 font-mono py-4 text-center">Loading balances…</p>
              )}

              {/* SWI — highlighted */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border-r-2 border-indigo-500">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-indigo-400 text-lg leading-none">token</span>
                  <span className="font-space-grotesk text-sm text-indigo-300 font-semibold">SWI</span>
                </div>
                <span className="font-space-grotesk text-sm font-bold text-indigo-300">
                  {swi ? Number(swi.amount).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.00'}
                </span>
              </div>

              {/* SOL */}
              <div className="flex items-center justify-between p-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg leading-none">account_balance_wallet</span>
                  <span className="font-space-grotesk text-sm">SOL</span>
                </div>
                <span className="font-space-grotesk text-sm tabular-nums">
                  {sol !== null ? sol.toFixed(4) : '—'}
                </span>
              </div>

              {/* Other SPL tokens */}
              {others.map(t => (
                <div key={t.mint} className="flex items-center justify-between p-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg leading-none">payments</span>
                    <span className="font-space-grotesk text-sm font-mono">{t.symbol}</span>
                  </div>
                  <span className="font-space-grotesk text-sm tabular-nums">
                    {Number(t.amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}

              {/* Copy full address */}
              {address && (
                <button
                  onClick={copy}
                  className="w-full mt-2 flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-white/5 hover:text-gray-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg leading-none">content_copy</span>
                    <span className="font-space-grotesk text-xs">Copy full address</span>
                  </div>
                  <span className="font-mono text-xs">{copied ? 'Copied!' : `${address.slice(0,4)}...${address.slice(-4)}`}</span>
                </button>
              )}
            </div>
          ) : (
            /* Not connected */
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <span className="material-symbols-outlined text-5xl text-gray-700">account_balance_wallet</span>
              <p className="text-gray-500 text-sm font-space-grotesk text-center leading-relaxed">
                Connect your wallet to view balances
              </p>
              {ready && (
                <button
                  onClick={login}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-manrope text-sm tracking-widest uppercase rounded-lg transition-all"
                >
                  Connect
                </button>
              )}
            </div>
          )}

          {/* Disconnect */}
          {authenticated && (
            <button
              onClick={logout}
              className="mt-6 w-full py-3 border border-white/10 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white font-space-grotesk text-sm transition-all"
            >
              Disconnect Wallet
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
