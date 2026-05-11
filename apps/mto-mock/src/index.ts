import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { mockEsewaCredit } from './esewa-mock'
import { loadMtoKeypair, confirmDisbursementOnChain } from './solana'
import { logBox } from './structuredLog'

const app = Fastify({ logger: true })
const mtoKeypair = loadMtoKeypair()

logBox('SWIFLO MTO', 'SERVICE BOOT', {
  mtoAuthority: mtoKeypair.publicKey.toBase58(),
})

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
    logBox('SWIFLO MTO', 'DISBURSEMENT REQUEST RECEIVED', {
      transferId,
      onChainTransferId,
      recipientPhone,
      amountNpr: displayNpr,
      amountUsdcBaseUnits: amountUsdc,
      lockedRate,
      reference,
    })

    const esewaResp = await mockEsewaCredit({
      phone: recipientPhone,
      amountNpr,
      reference,
    })

    if (esewaResp.status !== 'SUCCESS') {
      logBox('SWIFLO MTO', 'ESEWA CREDIT FAILED', {
        transferId,
        recipientPhone,
        amountNpr: displayNpr,
      })
      await notifyBackend(transferId, 'FAILED', '', '')
      return reply.status(500).send({ error: 'eSewa credit failed' })
    }

    logBox('SWIFLO MTO', 'ESEWA CREDITED', {
      transferId,
      recipientPhone,
      amountNpr: displayNpr,
      esewaReference: esewaResp.txRef,
      creditedAt: esewaResp.creditedAt,
    })

    const solanaSig = await confirmDisbursementOnChain(onChainTransferId, esewaResp.txRef, mtoKeypair)

    await notifyBackend(transferId, 'DISBURSED', esewaResp.txRef, solanaSig)
    logBox('SWIFLO MTO', 'DISBURSEMENT COMPLETE', {
      transferId,
      onChainTransferId,
      esewaReference: esewaResp.txRef,
      solanaSignature: solanaSig,
    })

    return {
      success: true,
      reference: esewaResp.txRef,
      creditedAt: esewaResp.creditedAt,
      solanaSig,
    }
  })

  const port = Number(process.env.PORT ?? process.env.MTO_PORT ?? 3002)
  await app.listen({ port, host: '0.0.0.0' })
  logBox('SWIFLO MTO', 'SERVICE LISTENING', {
    port,
  })
}

async function notifyBackend(
  transferId: string,
  status: 'DISBURSED' | 'FAILED',
  mtoReference: string,
  solanaSignature: string
): Promise<void> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const endpoint = `${apiUrl}/api/webhooks/mto`

  try {
    logBox('SWIFLO MTO', 'BACKEND CALLBACK STARTED', {
      transferId,
      endpoint,
      status,
      mtoReference,
      solanaSignature,
    })

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transferId, status, mtoReference, solanaSignature }),
    })

    logBox('SWIFLO MTO', 'BACKEND CALLBACK FINISHED', {
      transferId,
      endpoint,
      httpStatus: res.status,
    })
  } catch (err) {
    logBox('SWIFLO MTO', 'BACKEND CALLBACK FAILED', {
      transferId,
      endpoint,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
