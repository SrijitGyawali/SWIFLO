import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { mockEsewaCredit } from './esewa-mock'
import { loadMtoKeypair, confirmDisbursementOnChain } from './solana'

const app = Fastify({ logger: true })
const mtoKeypair = loadMtoKeypair()

console.log(`[mto] MTO authority: ${mtoKeypair.publicKey.toBase58()}`)

async function main() {
  await app.register(cors, { origin: true })

  app.get('/health', async () => ({ status: 'ok', mtoAuthority: mtoKeypair.publicKey.toBase58() }))

  app.post('/api/mto/disburse', async (req, reply) => {
    const {
      transferId,
      onChainTransferId,
      recipientPhone,
      amountNpr,
      amountUsdc,
      lockedRate,
      reference,
    } = req.body as {
      transferId: string
      onChainTransferId: string
      recipientPhone: string
      amountNpr: string
      amountUsdc: string
      lockedRate: string
      reference: string
    }

    const displayNpr = (Number(amountNpr) / 1_000_000).toFixed(3)
    console.log(`[mto] Received disburse request — transfer ${transferId}, ${displayNpr} NPR → ${recipientPhone}`)

    // Step 1: Call mock eSewa API
    const esewaResp = await mockEsewaCredit({
      phone: recipientPhone,
      amountNpr,
      reference,
    })

    if (esewaResp.status !== 'SUCCESS') {
      await notifyBackend(transferId, 'FAILED', '', '')
      return reply.status(500).send({ error: 'eSewa credit failed' })
    }

    console.log(`[mto] eSewa credited — ref: ${esewaResp.txRef}`)

    // Step 2: Sign confirmDisbursement on Solana
    const solanaSig = await confirmDisbursementOnChain(onChainTransferId, esewaResp.txRef, mtoKeypair)

    // Step 3: Notify backend API
    await notifyBackend(transferId, 'DISBURSED', esewaResp.txRef, solanaSig)

    return {
      success: true,
      reference: esewaResp.txRef,
      creditedAt: esewaResp.creditedAt,
      solanaSig,
    }
  })

  const port = Number(process.env.MTO_PORT ?? 3002)
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`[mto] Listening on port ${port}`)
}

async function notifyBackend(
  transferId: string,
  status: 'DISBURSED' | 'FAILED',
  mtoReference: string,
  solanaSignature: string
): Promise<void> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  try {
    await fetch(`${apiUrl}/api/webhooks/mto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transferId, status, mtoReference, solanaSignature }),
    })
  } catch (err) {
    console.error('[mto] Failed to notify backend', err)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
