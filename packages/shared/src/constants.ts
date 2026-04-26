import { PublicKey } from '@solana/web3.js'

// Program IDs — deployed to Solana Devnet 2026-04-23
export const REMITTANCE_POOL_PROGRAM_ID = new PublicKey('GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ')
export const LIQUIDITY_VAULT_PROGRAM_ID = new PublicKey('13BEbXJJ2aLQ6yMQA9QdtwguL2rDKdzsVBZNEbATwBhN')
export const RATE_ORACLE_PROGRAM_ID     = new PublicKey('AxbYcPE2L99uruyDN9RcsTpwui4JUvVGMsT1nupVazLC')

// IDL accounts (on-chain)
export const REMITTANCE_POOL_IDL_ADDRESS = 'Ftm8BBErHvX9ibV1kK7jCsfkqRRYDm8GX5PX2fi4Jf8B'
export const LIQUIDITY_VAULT_IDL_ADDRESS  = '8gNdDFZZ4r9o5deTjrsFwNVy3iKr7hrW7tGGKKv1nCSS'
export const RATE_ORACLE_IDL_ADDRESS      = '9jRxKWV12kFYxwrF2trCrJt3XhNzwND6pjYQU1BW9neF'

// Standard devnet dummy USDC from spl-token-faucet.com — faucet wallet is pre-funded, no mint authority needed
export const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr')

// NPR/USD rate — admin-updatable, hard-coded for hackathon (133.5 NPR per USD, scaled 10^6)
export const NPR_PER_USD_DEFAULT = 133_500_000n

// Fees
export const SWIFLO_FEE_BPS = 40  // 0.4%
export const WU_FEE_BPS     = 600 // 6% Western Union estimate for comparison

// Settlement window (30s for demo, 2 days in production)
export const SETTLEMENT_DELAY_SECONDS = 30

// Solana network
export const SOLANA_NETWORK = 'devnet' as const
export const SOLANA_RPC_URL = 'https://api.devnet.solana.com'
