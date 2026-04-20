import { PublicKey } from '@solana/web3.js'

// Program IDs — update after first deploy to Devnet
export const REMITTANCE_POOL_PROGRAM_ID = new PublicKey(
  process.env.REMITTANCE_POOL_PROGRAM_ID ?? '11111111111111111111111111111111'
)
export const LIQUIDITY_VAULT_PROGRAM_ID = new PublicKey(
  process.env.LIQUIDITY_VAULT_PROGRAM_ID ?? '11111111111111111111111111111111'
)
export const RATE_ORACLE_PROGRAM_ID = new PublicKey(
  process.env.RATE_ORACLE_PROGRAM_ID ?? '11111111111111111111111111111111'
)

// USDC mint on Devnet
export const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr')

// NPR/USD rate — admin-updatable, hard-coded for hackathon
export const NPR_PER_USD_DEFAULT = 133_500_000n // scaled 10^6 = 133.5 NPR/USD

// Fees
export const SWIFLO_FEE_BPS = 40 // 0.4%
export const WU_FEE_BPS = 600   // 6% Western Union estimate for comparison

// Settlement window (30s for demo, 2 days in production)
export const SETTLEMENT_DELAY_SECONDS = 30

// Solana
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet') as 'devnet' | 'mainnet-beta'
export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
