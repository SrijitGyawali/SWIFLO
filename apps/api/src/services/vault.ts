import crypto from 'crypto'
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
function base58Decode(s: string): Buffer {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let num = 0n
  for (const ch of s) {
    const idx = alphabet.indexOf(ch)
    if (idx === -1) throw new Error('Invalid base58 character')
    num = num * 58n + BigInt(idx)
  }
  const bytes: number[] = []
  while (num > 0n) {
    bytes.push(Number(num & 0xffn))
    num = num >> 8n
  }
  bytes.reverse()
  // leading zero bytes for '1' chars
  let leadingZeros = 0
  for (const ch of s) { if (ch === '1') leadingZeros++; else break }
  const out = Buffer.concat([Buffer.alloc(leadingZeros), Buffer.from(bytes)])
  return out
}
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

import { swifloApiChainLog } from '../lib/swifloChainLog'
import { logBox } from '../lib/structuredLog'

const RPC              = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const VAULT_PROGRAM_ID = new PublicKey(process.env.LIQUIDITY_VAULT_PROGRAM_ID ?? '13BEbXJJ2aLQ6yMQA9QdtwguL2rDKdzsVBZNEbATwBhN')
const POOL_PROGRAM_ID  = new PublicKey(process.env.REMITTANCE_POOL_PROGRAM_ID ?? 'GKWPTDkKS2jDrE3gkWWoTtbHnwaiqZwc8iM47QGsJ9mJ')
const SWI_MINT         = new PublicKey(process.env.TEST_USDC_MINT ?? '2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx')
const VAULT_SWI        = new PublicKey(process.env.VAULT_SWI ?? '3QpTAYX47hVjeL8WG7R8VoF5QncwZnA6ak4jEPUiDBtw')
const POOL_SWI         = new PublicKey(process.env.NEXT_PUBLIC_POOL_USDC ?? '8TrLtU1frZ8xmp8oJPmht3xwsuT2CqJzWjo3wbAW9JK3')

// SHA256("global:advance_to_mto")[0:8]
const ADVANCE_DISC = Buffer.from([109, 215, 229, 111, 172, 161, 73, 69])

// SHA256("global:settle_transfer")[0:8]
const SETTLE_DISC = Buffer.from([198, 182, 245, 201, 195, 254, 31, 253])

// SHA256("global:replenish_vault")[0:8] — computed at runtime so it's always correct
const VAULT_REPLENISH_DISC = crypto.createHash('sha256')
  .update('global:replenish_vault')
  .digest()
  .subarray(0, 8)

const INITIATE_TRANSFER_DISC = crypto.createHash('sha256')
  .update('global:initiate_transfer')
  .digest()
  .subarray(0, 8)

// Same as apps/mto-mock SHA256("global:confirm_disbursement")[0:8]
const CONFIRM_DISBURSEMENT_DISC = Buffer.from([157, 26, 17, 151, 82, 205, 12, 37])

const COLLECT_FEES_DISC = Buffer.from([164, 152, 207, 99, 30, 186, 19, 182])

const connection = new Connection(RPC, 'confirmed')

const CLAIM_YIELD_DISC = Buffer.from([49, 74, 111, 7, 186, 22, 61, 165])
const GET_TX_OPTS = {
  commitment: 'confirmed' as const,
  maxSupportedTransactionVersion: 0,
  encoding: 'jsonParsed' as const,
}

/** Default encoding keeps base58 ix.data for Anchor discriminators (jsonParsed often omits it). */
const CLASSIFY_TX_OPTS = {
  commitment: 'confirmed' as const,
  maxSupportedTransactionVersion: 0,
}

const TRANSFER_STATUS_OFFSET = 96

type OnChainTransferStatus = 'INITIATED' | 'DISBURSED' | 'SETTLED' | 'CANCELLED' | 'MISSING'

export async function getOnChainTransferStatus(transferId: bigint): Promise<OnChainTransferStatus> {
  const seqBuf = Buffer.alloc(8)
  seqBuf.writeBigUInt64LE(transferId)
  const [transferPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('transfer'), seqBuf],
    POOL_PROGRAM_ID
  )

  const account = await connection.getAccountInfo(transferPda)
  if (!account) return 'MISSING'

  const statusByte = account.data[TRANSFER_STATUS_OFFSET]
  switch (statusByte) {
    case 0: return 'INITIATED'
    case 1: return 'DISBURSED'
    case 2: return 'SETTLED'
    case 3: return 'CANCELLED'
    default: return 'MISSING'
  }
}

export async function getTransferSignatures(onChainTransferId: bigint) {
  const seqBuf = Buffer.alloc(8)
  seqBuf.writeBigUInt64LE(onChainTransferId)
  const [transferPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('transfer'), seqBuf],
    POOL_PROGRAM_ID
  )

  // Return recent signatures involving the transfer PDA so callers can inspect
  // the settle/related transactions when reconciling.
  const sigs = await connection.getSignaturesForAddress(transferPda, { limit: 20 })
  return sigs
}

export async function getTransactionDetails(signature: string) {
  const tx = await connection.getTransaction(signature, GET_TX_OPTS)
  return tx
}

function collectInstructionPayloads(tx: { transaction?: { message?: any }; meta?: any }): Buffer[] {
  const out: Buffer[] = []
  const pushDecoded = (data: unknown) => {
    if (Buffer.isBuffer(data)) {
      if (data.length >= 8) out.push(data)
      return
    }
    if (typeof data !== 'string') return
    try {
      const buf = base58Decode(data)
      if (buf.length >= 8) out.push(buf)
    } catch {
      /* skip */
    }
  }
  const msg = tx.transaction?.message
  if (msg) {
    const outer = msg.instructions ?? msg.compiledInstructions ?? []
    for (const ix of outer) pushDecoded(ix.data)
  }
  for (const inner of tx.meta?.innerInstructions ?? []) {
    for (const ix of inner.instructions ?? []) pushDecoded(ix.data)
  }
  return out
}

function labelFromDiscriminator(buf: Buffer): string | null {
  if (buf.length < 8) return null
  const disc = buf.subarray(0, 8)
  if (disc.equals(INITIATE_TRANSFER_DISC)) return 'initiate_transfer'
  if (disc.equals(CONFIRM_DISBURSEMENT_DISC)) return 'confirm_disbursement'
  if (disc.equals(ADVANCE_DISC)) return 'advance_to_mto'
  if (disc.equals(SETTLE_DISC)) return 'settle_transfer'
  if (disc.equals(VAULT_REPLENISH_DISC)) return 'replenish_vault'
  if (disc.equals(COLLECT_FEES_DISC)) return 'collect_fees'
  return null
}

/** Match Swiflo Anchor names only (avoid first-line ComputeBudget etc.). */
function labelFromAnchorLogs(logMessages: string[] | null | undefined): string | null {
  const priority = [
    'InitiateTransfer',
    'ConfirmDisbursement',
    'SettleTransfer',
    'AdvanceToMto',
    'ReplenishVault',
    'CollectFees',
  ]
  const seen: string[] = []
  for (const line of logMessages ?? []) {
    const m = line.match(/Instruction:\s*([A-Za-z0-9_]+)/)
    if (m) seen.push(m[1])
  }
  for (const p of priority) {
    if (seen.includes(p)) return p
  }
  return null
}

export async function classifySignatures(sigs: Array<{ signature: string }>) {
  const out: Array<{ signature: string; label: string; blockTime: number | null }> = []
  for (const s of sigs) {
    try {
      const tx = await connection.getTransaction(s.signature, CLASSIFY_TX_OPTS)
      if (!tx || !tx.meta) {
        out.push({ signature: s.signature, label: 'unknown', blockTime: tx?.blockTime ?? null })
        continue
      }

      let label = 'unknown'

      for (const payload of collectInstructionPayloads(tx)) {
        const hit = labelFromDiscriminator(payload)
        if (hit) {
          label = hit
          break
        }
      }

      if (label === 'unknown') {
        const logLabel = labelFromAnchorLogs(tx.meta.logMessages)
        if (logLabel) label = logLabel
      }

      if (label === 'unknown') {
        const logs = (tx.meta.logMessages ?? []).join('\n')
        if (logs.includes('AdvanceToMto') || logs.includes('advance_to_mto')) label = 'advance_to_mto'
        else if (logs.includes('SettleTransfer') || logs.toLowerCase().includes('settletransfer')) label = 'settle_transfer'
        else if (logs.includes('ReplenishVault') || logs.includes('replenish_vault')) label = 'replenish_vault'
        else if (logs.includes('CollectFees') || logs.includes('collect_fees')) label = 'collect_fees'
        else if (logs.includes('InitiateTransfer')) label = 'initiate_transfer'
        else if (logs.includes('ConfirmDisbursement')) label = 'confirm_disbursement'
      }

      out.push({ signature: s.signature, label, blockTime: tx.blockTime ?? null })
    } catch {
      out.push({ signature: s.signature, label: 'unknown', blockTime: null })
    }
  }
  return out
}

function loadAuthorityKeypair(): Keypair {
  const raw = process.env.FAUCET_SECRET_KEY
  if (!raw) throw new Error('FAUCET_SECRET_KEY not set')
  return Keypair.fromSecretKey(Buffer.from(JSON.parse(raw)))
}

export async function advanceToMTO(transferId: bigint, amount: bigint): Promise<string> {
  const authority    = loadAuthorityKeypair()
  const mtoAuthority = new PublicKey(process.env.MTO_AUTHORITY ?? '')

  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], VAULT_PROGRAM_ID)
  const mtoSwi     = await getAssociatedTokenAddress(SWI_MINT, mtoAuthority)

  // Fast guard: if the vault token account is short, skip the transaction.
  const vaultBalanceResp = await connection.getTokenAccountBalance(VAULT_SWI)
  const vaultBalance = BigInt(vaultBalanceResp.value.amount)
  if (vaultBalance < amount) {
    logBox('SWIFLO API', 'ADVANCE TO MTO SKIPPED', {
      reason: 'insufficient vault liquidity',
      vaultBalance,
      requiredAmount: amount,
    })
    throw new Error('InsufficientVaultLiquidity')
  }

  const tx = new Transaction()

  const mtoSwiInfo = await connection.getAccountInfo(mtoSwi)
  if (!mtoSwiInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      authority.publicKey, mtoSwi, mtoAuthority, SWI_MINT,
      TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
    ))
  }

  const data = Buffer.alloc(24)
  ADVANCE_DISC.copy(data, 0)
  data.writeBigUInt64LE(transferId, 8)
  data.writeBigUInt64LE(amount, 16)

  tx.add(new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    data,
    keys: [
      { pubkey: vaultPda,            isSigner: false, isWritable: true  },
      { pubkey: authority.publicKey, isSigner: true,  isWritable: false },
      { pubkey: VAULT_SWI,           isSigner: false, isWritable: true  },
      { pubkey: mtoSwi,              isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
    ],
  }))

  try {
    const sig = await sendAndConfirmTransaction(connection, tx, [authority], { commitment: 'confirmed' })
    swifloApiChainLog('advanceToMto', sig)
    return sig
  } catch (err: any) {
    const message = String(err?.message ?? err)
    if (message.includes('InsufficientLiquidity')) {
      logBox('SWIFLO API', 'ADVANCE TO MTO SKIPPED', {
        reason: 'program returned InsufficientLiquidity',
      })
      throw new Error('InsufficientVaultLiquidity')
    }
    throw err
  }
}

export async function settleTransfer(onChainTransferId: bigint): Promise<string> {
  const authority = loadAuthorityKeypair()

  const [poolPda] = PublicKey.findProgramAddressSync([Buffer.from('pool')], POOL_PROGRAM_ID)

  const seqBuf = Buffer.alloc(8)
  seqBuf.writeBigUInt64LE(onChainTransferId)
  const [transferPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('transfer'), seqBuf],
    POOL_PROGRAM_ID
  )

  const data = Buffer.alloc(16)
  SETTLE_DISC.copy(data, 0)
  data.writeBigUInt64LE(onChainTransferId, 8)

  const ix = new TransactionInstruction({
    programId: POOL_PROGRAM_ID,
    data,
    keys: [
      { pubkey: poolPda,             isSigner: false, isWritable: false },
      { pubkey: transferPda,         isSigner: false, isWritable: true  },
      { pubkey: authority.publicKey, isSigner: true,  isWritable: false },
      { pubkey: POOL_SWI,            isSigner: false, isWritable: true  },
      { pubkey: VAULT_SWI,           isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
    ],
  })

  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [authority], { commitment: 'confirmed' })
  return sig
}

/**
 * Decrements vault.active_advances on-chain by calling the vault program's
 * replenish_vault instruction. Uses the faucet keypair + its SWI ATA as the
 * token source (faucet mints more SWI if needed). settle_transfer already
 * returned pool funds to the vault; this call just fixes the accounting counter.
 */
export async function decrementVaultAdvances(transferId: bigint, amount: bigint): Promise<string> {
  const faucet  = loadAuthorityKeypair()
  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], VAULT_PROGRAM_ID)

  // Ensure faucet has enough SWI to cover the replenish call
  const faucetAta = await getOrCreateAssociatedTokenAccount(connection, faucet, SWI_MINT, faucet.publicKey)
  if (BigInt(faucetAta.amount.toString()) < amount) {
    await mintTo(connection, faucet, SWI_MINT, faucetAta.address, faucet.publicKey, amount)
  }

  const data = Buffer.alloc(24)
  Buffer.from(VAULT_REPLENISH_DISC).copy(data, 0)
  data.writeBigUInt64LE(transferId, 8)
  data.writeBigUInt64LE(amount, 16)

  const ix = new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    data,
    keys: [
      { pubkey: vaultPda,          isSigner: false, isWritable: true  },
      { pubkey: faucet.publicKey,  isSigner: true,  isWritable: false },
      { pubkey: faucetAta.address, isSigner: false, isWritable: true  },
      { pubkey: VAULT_SWI,         isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,  isSigner: false, isWritable: false },
    ],
  })

  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [faucet], { commitment: 'confirmed' })
  return sig
}

/**
 * Collects 30 bps treasury fee from vault and transfers to SWIFLO_TREASURY_PUBKEY.
 * Calls the vault program's collect_fees instruction.
 * Uses the authority keypair as the signer.
 */
export async function collectFees(amount: bigint): Promise<string> {
  const authority = loadAuthorityKeypair()
  const treasuryPubkey = new PublicKey(process.env.SWIFLO_TREASURY_PUBKEY ?? '')

  if (!treasuryPubkey || treasuryPubkey.toBase58() === '11111111111111111111111111111111') {
    throw new Error('SWIFLO_TREASURY_PUBKEY not configured')
  }

  // Get or create treasury ATA for SWI mint
  const treasuryAta = await getOrCreateAssociatedTokenAccount(
    connection,
    authority,
    SWI_MINT,
    treasuryPubkey
  )

  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], VAULT_PROGRAM_ID)

  // Discriminator for collect_fees instruction (from IDL)
  const COLLECT_FEES_DISC = Buffer.from([164, 152, 207, 99, 30, 186, 19, 182])

  const data = Buffer.alloc(16)
  COLLECT_FEES_DISC.copy(data, 0)
  data.writeBigUInt64LE(amount, 8)

  const ix = new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    data,
    keys: [
      { pubkey: vaultPda,            isSigner: false, isWritable: true  },
      { pubkey: authority.publicKey, isSigner: true,  isWritable: false },
      { pubkey: VAULT_SWI,           isSigner: false, isWritable: true  },
      { pubkey: treasuryAta.address, isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
    ],
  })

  const sig = await sendAndConfirmTransaction(connection, new Transaction().add(ix), [authority], { commitment: 'confirmed' })
  return sig
}

export async function buildClaimYieldTx(userPubkeyString: string, lpTokens: bigint): Promise<string> {
  const userPubkey = new PublicKey(userPubkeyString)
  const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], VAULT_PROGRAM_ID)
  const userSwi = await getAssociatedTokenAddress(SWI_MINT, userPubkey)
  const userLpAta = await getAssociatedTokenAddress(
    new PublicKey(process.env.LP_MINT ?? '99sFqGr245Dohx8P2F616sPp4magaR87E4sxX1RKoBxD'),
    userPubkey,
  )

  const data = Buffer.alloc(16)
  CLAIM_YIELD_DISC.copy(data, 0)
  data.writeBigUInt64LE(lpTokens, 8)

  const { blockhash } = await connection.getLatestBlockhash()
  const tx = new Transaction({
    recentBlockhash: blockhash,
    feePayer: userPubkey,
  })

  tx.add(new TransactionInstruction({
    programId: VAULT_PROGRAM_ID,
    data,
    keys: [
      { pubkey: vaultPda,       isSigner: false, isWritable: true  },
      { pubkey: new PublicKey(process.env.LP_MINT ?? '99sFqGr245Dohx8P2F616sPp4magaR87E4sxX1RKoBxD'), isSigner: false, isWritable: true },
      { pubkey: userPubkey,     isSigner: true,  isWritable: true  },
      { pubkey: userSwi,        isSigner: false, isWritable: true  },
      { pubkey: VAULT_SWI,      isSigner: false, isWritable: true  },
      { pubkey: userLpAta,      isSigner: false, isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
  }))

  return tx.serialize({ requireAllSignatures: false }).toString('base64')
}
