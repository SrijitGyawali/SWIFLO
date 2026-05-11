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
  console.log(`[mto-client] notifying MTO at ${MTO_URL}/api/mto/disburse for transfer ${params.transferId}`)

  const res = await fetch(`${MTO_URL}/api/mto/disburse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MTO notification failed: ${res.status} ${text}`)
  }

  console.log(`[mto-client] MTO accepted disbursement for transfer ${params.transferId}`)
}
