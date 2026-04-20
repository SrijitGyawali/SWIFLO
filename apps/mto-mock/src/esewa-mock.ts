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

  console.log(`[esewa-mock] Crediting ${params.amountNpr} NPR → ${params.phone}`)

  return {
    txRef: `ESEWA-MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    status: 'SUCCESS',
    creditedAt: new Date().toISOString(),
    phone: params.phone,
    amountNpr: params.amountNpr,
  }
}
