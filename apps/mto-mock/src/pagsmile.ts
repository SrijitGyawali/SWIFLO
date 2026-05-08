import crypto from 'crypto'

const PAGSMILE_BASE_URL =
  process.env.PAGSMILE_SANDBOX !== 'false'
    ? 'https://sandbox.transfersmile.com'
    : 'https://api.transfersmile.com'

// Sort params alphabetically (skip empty), concatenate with app_key, SHA256 → lowercase hex
function generateSignature(params: Record<string, string>): string {
  const appKey = process.env.PAGSMILE_APP_KEY ?? ''
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== '' && v != null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return crypto.createHash('sha256').update(sorted + appKey).digest('hex').toLowerCase()
}

export interface PagsmilePayoutParams {
  name: string        // beneficiary name, 5–100 chars
  account: string     // IME wallet account (phone number without country code)
  region: string      // city in Nepal, e.g. "Kathmandu"
  amountUsd: string   // USD amount, 2 decimal places e.g. "10.50"
  customCode: string  // our transferId — Pagsmile echoes this in webhook
  notifyUrl: string   // our webhook endpoint
}

export interface PagsmilePayoutResult {
  pagsmileId: string
  customCode: string
  arrivalAmount: string   // NPR amount recipient will receive
  arrivalCurrency: string // "NPR"
  sourceAmount: string    // USD amount charged
  sourceCurrency: string  // "USD"
  status: string          // "IN_PROCESSING"
}

export async function submitPagsmilePayout(
  params: PagsmilePayoutParams
): Promise<PagsmilePayoutResult> {
  const appId = process.env.PAGSMILE_APP_ID ?? ''

  const body: Record<string, string> = {
    name: params.name,
    region: params.region,
    bank_code: '904257',              // IME Digital Wallet bank code
    account: params.account,
    source_currency: 'USD',
    arrival_currency: 'NPR',
    fee_bear: 'merchant',
    method: 'WALLET',
    channel: 'IME',
    amount: params.amountUsd,
    notify_url: params.notifyUrl,
    custom_code: params.customCode,
    additional_remark: 'SWIFLO remittance',
    country: 'NPL',
  }

  const signature = generateSignature(body)

  const res = await fetch(`${PAGSMILE_BASE_URL}/api/payout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      AppId: appId,
      Authorization: signature,
    },
    body: JSON.stringify(body),
  })

  const json = (await res.json()) as {
    code: number
    msg: string
    data?: {
      id: string
      custom_code: string
      arrival_amount: string
      arrival_currency: string
      source_amount: string
      source_currency: string
      status: string
    }
  }

  if (json.code !== 200 || !json.data) {
    throw new Error(`Pagsmile payout failed [${json.code}]: ${json.msg}`)
  }

  return {
    pagsmileId: json.data.id,
    customCode: json.data.custom_code,
    arrivalAmount: json.data.arrival_amount,
    arrivalCurrency: json.data.arrival_currency,
    sourceAmount: json.data.source_amount,
    sourceCurrency: json.data.source_currency,
    status: json.data.status,
  }
}

// Verify Pagsmile webhook — re-generate signature from body and compare with Authorization header
export function verifyWebhookSignature(
  body: Record<string, string>,
  authHeader: string
): boolean {
  const expected = generateSignature(body)
  return expected === authHeader.toLowerCase()
}
