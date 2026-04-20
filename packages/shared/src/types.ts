export type TransferStatus = 'INITIATED' | 'DISBURSED' | 'SETTLED' | 'FAILED' | 'CANCELLED'

export type LPTxType = 'DEPOSIT' | 'WITHDRAW' | 'YIELD_CLAIM'

export interface Transfer {
  id: string
  transferId: string
  senderPubkey: string
  senderCountry?: string
  amountUsdc: string        // BigInt as string (6 decimals)
  amountNpr: string         // BigInt as string (2 decimals)
  recipientPhone: string    // masked for public display
  recipientHash: string
  lockedRate: string        // NPR per USDC scaled 10^6
  feeBps: number
  status: TransferStatus
  solanaTxSignature?: string
  mtoReference?: string
  createdAt: string
  initiatedAt?: string
  disbursedAt?: string
  settledAt?: string
}

export interface VaultState {
  id: string
  totalLiquidity: string
  activeAdvances: string
  utilizationBps: number
  currentAprBps: number
  totalYieldPaid: string
  updatedAt: string
}

export interface LPPosition {
  pubkey: string
  totalDeposited: string
  totalWithdrawn: string
  lpTokens: string
  createdAt: string
  updatedAt: string
}

export interface TransferEstimate {
  amountUsdc: number
  lockedRate: number           // NPR per USDC
  amountNpr: number
  swifloFeeNpr: number
  recipientGetsNpr: number
  wuRecipientGetsNpr: number
  savingsNpr: number
  savingsPercent: number
}

export interface GlobalStats {
  totalTransfers: number
  totalVolumeUsdc: string
  totalSavedNpr: string
  activeAdvances: number
  currentAprBps: number
}

export interface RateSnapshot {
  usdcToNprRate: string
  pythPrice: string
  recordedAt: string
}

export interface HeliusWebhookPayload {
  transactions: Array<{
    signature: string
    meta: {
      logMessages: string[]
    }
  }>
}

export interface MtoWebhookPayload {
  transferId: string
  status: 'DISBURSED' | 'FAILED'
  mtoReference: string
  solanaSignature: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
