'use client'

import Link from 'next/link'
import { usePrivy } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth'
import { useState } from 'react'

export function Navbar() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useSolanaWallets()
  const [copied, setCopied] = useState(false)

  const address = wallets[0]?.address

  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
            <div className="flex items-center gap-3">
              {address && (
                <button
                  onClick={copyAddress}
                  title="Click to copy wallet address"
                  className="text-xs font-mono text-muted hover:text-txt bg-surface border border-border px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copied ? 'Copied!' : `${address.slice(0, 4)}...${address.slice(-4)}`}
                </button>
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
