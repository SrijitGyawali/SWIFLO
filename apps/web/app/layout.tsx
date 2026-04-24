import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Swiflo — Send money to Nepal in 30 seconds',
  description: 'Stablecoin-powered remittances for the Gulf-to-Nepal corridor. 0.4% fee vs 6% at Western Union.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
