'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { defaultSolanaRpcsPlugin } from '@privy-io/react-auth/solana'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#5865F2',
          walletChainType: 'solana-only',
        },
        loginMethods: ['email', 'sms'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
          showWalletUIs: true,
        },
        plugins: [defaultSolanaRpcsPlugin()],
      }}
    >
      {children}
    </PrivyProvider>
  )
}

