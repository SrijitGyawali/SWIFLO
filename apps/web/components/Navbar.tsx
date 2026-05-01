'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useSolanaWallets } from '@privy-io/react-auth'
import { useEffect } from 'react'
import { useSidebar } from './SidebarContext'

export const NAV_LINKS = [
  { label: 'GET SWI',  href: '/fund' },
  { label: 'SEND',     href: '/send' },
  { label: 'EXPLORER', href: '/explorer' },
]

export function Navbar() {
  const pathname = usePathname()
  const { ready, authenticated, login } = usePrivy()
  const { wallets, createWallet } = useSolanaWallets()
  const { open, toggle } = useSidebar()

  useEffect(() => {
    if (!ready || !authenticated || wallets.length > 0) return
    createWallet().catch((err: any) => {
      const msg = String(err?.message ?? err)
      if (msg.includes('User already has an embedded wallet')) return
      console.error('Navbar createWallet failed', err)
    })
  }, [authenticated, wallets.length])

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/20 backdrop-blur-md shadow-[0_0_20px_rgba(30,40,117,0.1)]">
      <div className="max-w-[1280px] mx-auto flex justify-between items-center h-16 md:h-20 px-5 md:px-8">

        {/* Logo */}
        <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-white font-manrope">
          SWIFLO
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center space-x-10">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`font-manrope text-sm tracking-widest font-semibold uppercase transition-colors pb-1 ${
                  active
                    ? 'text-white border-b border-indigo-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Connect button — only when not authenticated, hidden on smallest screens */}
          {ready && !authenticated && (
            <button
              onClick={login}
              className="hidden sm:block px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-manrope text-xs tracking-widest font-semibold uppercase rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(74,92,181,0.4)]"
            >
              CONNECT
            </button>
          )}

          {/* Animated hamburger — opens sidebar (contains nav links on mobile) */}
          <button
            onClick={toggle}
            className="flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${
                open ? 'w-5 rotate-45 translate-y-2' : 'w-5'
              }`}
            />
            <span
              className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${
                open ? 'w-0 opacity-0' : 'w-4'
              }`}
            />
            <span
              className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${
                open ? 'w-5 -rotate-45 -translate-y-2' : 'w-5'
              }`}
            />
          </button>
        </div>
      </div>
    </nav>
  )
}
