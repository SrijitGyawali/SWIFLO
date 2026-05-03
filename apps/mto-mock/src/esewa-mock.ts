export interface EsewaResponse {
  txRef: string
  status: 'SUCCESS' | 'FAILED'
  creditedAt: string
  phone: string
  amountNpr: string
}

export async function mockEsewaCredit(params: {
  phone: string
  amountNpr: string
  reference: string
}): Promise<EsewaResponse> {
  // Simulate eSewa API latency
  await new Promise(r => setTimeout(r, 800 + Math.random() * 400))

  const displayNpr = (Number(params.amountNpr) / 1_000_000).toFixed(3)
  console.log(`[esewa-mock] Crediting ${displayNpr} NPR → ${params.phone}`)

  return {
    txRef: `ESEWA-MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    status: 'SUCCESS',
    creditedAt: new Date().toISOString(),
    phone: params.phone,
    amountNpr: params.amountNpr,
  }
}
