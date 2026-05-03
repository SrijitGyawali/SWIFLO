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
  const res = await fetch(`${MTO_URL}/api/mto/disburse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MTO notification failed: ${res.status} ${text}`)
  }
}
