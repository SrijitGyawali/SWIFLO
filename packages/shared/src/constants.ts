import { PublicKey } from '@solana/web3.js'

// Program IDs — deployed to Solana Devnet 2026-04-22
export const REMITTANCE_POOL_PROGRAM_ID = new PublicKey(
  process.env.REMITTANCE_POOL_PROGRAM_ID ?? '6M9yzRSkn5c94dAvE8v9YJMGyoqHQKEurDTrM8AerQ56'
)
export const LIQUIDITY_VAULT_PROGRAM_ID = new PublicKey(
  process.env.LIQUIDITY_VAULT_PROGRAM_ID ?? 'EqjvuWUyH9A1iz3voRpN58MErsB2e7D4fa5S1LWpsgKa'
)
export const RATE_ORACLE_PROGRAM_ID = new PublicKey(
  process.env.RATE_ORACLE_PROGRAM_ID ?? '3Zy46BADoCvhCad3xp1wHwiXMytbEAwy73E5G5mfvSUV'
)

// IDL accounts (on-chain)
export const REMITTANCE_POOL_IDL_ADDRESS = 'HuJF6LZHmbLqpCDnZktE9tce9eCP1pp3m3SLCFezD8as'
export const LIQUIDITY_VAULT_IDL_ADDRESS  = '2Yq2Q1WF62tTCpXLxmYTgFcJyQY5wZjHyTtf5jHC1Cvk'
export const RATE_ORACLE_IDL_ADDRESS      = '44vMHoYkNu1WJuoHabPbfSaSKmeJnJFFn35MksqsxZ1e'

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
