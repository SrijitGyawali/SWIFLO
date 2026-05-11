import { logBox } from '../lib/structuredLog'

const MTO_URL = process.env.MTO_MOCK_URL ?? 'http://localhost:3002'

export async function notifyMTO(params: {
  transferId: string
  onChainTransferId: string
  recipientPhone: string
  amountNpr: string
  amountUsdc: string
  lockedRate: string
  reference: string
}): Promise<void> {
  const endpoint = `${MTO_URL}/api/mto/disburse`
  logBox('SWIFLO API', 'MTO DISBURSE REQUEST', {
    transferId: params.transferId,
    onChainTransferId: params.onChainTransferId,
    endpoint,
    recipientPhone: params.recipientPhone,
    amountUsdcBaseUnits: params.amountUsdc,
    amountNprBaseUnits: params.amountNpr,
    reference: params.reference,
  })

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const text = await res.text()
    logBox('SWIFLO API', 'MTO DISBURSE FAILED', {
      transferId: params.transferId,
      endpoint,
      status: res.status,
      response: text,
    })
    throw new Error(`MTO notification failed: ${res.status} ${text}`)
  }

  logBox('SWIFLO API', 'MTO DISBURSE ACCEPTED', {
    transferId: params.transferId,
    endpoint,
    status: res.status,
  })
}
