import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SidebarProvider } from '@/components/SidebarContext'
import { Navbar } from '@/components/Navbar'
import { WalletSidebar } from '@/components/WalletSidebar'

export const metadata: Metadata = {
  title: 'Swiflo — Send money to Nepal in 30 seconds',
  description: 'Stablecoin-powered remittances for the Gulf-to-Nepal corridor. 0.4% fee vs 6% at Western Union.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <Providers>
          <SidebarProvider>
            <Navbar />
            <WalletSidebar />
            <main>{children}</main>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
