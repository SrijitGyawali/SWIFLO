# Swiflo

> **0.4% fee remittance from the Gulf to Nepal — powered by Solana**

Swiflo is a blockchain-powered remittance platform built for the Gulf-to-Nepal corridor. We are a small team building infrastructure that lets migrant workers send money home faster, cheaper, and more transparently than any traditional service.

---

## Who We Are

Swiflo is a fintech protocol on Solana that connects Gulf-based migrant workers directly to their families in Nepal — cutting out the middlemen that eat into every transfer. We replace the opaque fee structures of legacy remittance providers with a simple, auditable, on-chain system.

## The Problem

~500,000 Nepali workers live and work in the Gulf (UAE, Qatar, Saudi Arabia, Kuwait). They send billions of rupees home every year to support their families. But every transfer is taxed by intermediaries — Western Union offers a rate of **148.2560 NPR/USD** when the real mid-market rate is **150.99 NPR/USD**, silently taking 1.8% off the top. Hawala networks charge 3–5% with zero transparency. Transfers take 1–3 days, and recipients have no way to track their money.

**On every $500 sent, families lose Rs 1,065 to Western Union alone.**

## Our Solution

Swiflo uses USDC on Solana as the transfer rail. A Gulf worker deposits USDC, signs a transaction with their Privy-powered embedded wallet, and the funds flow through our on-chain remittance pool to an eSewa payout in Nepal — all within 30 seconds, at 0.4% fee, with every step verifiable on-chain.

## What Our Product Does

A sender opens the Swiflo web or mobile app, logs in with their email or Google account (no crypto experience needed — Privy creates a Solana wallet for them in the background), enters the amount in USDC and the recipient's eSewa phone number, and clicks send. The app fetches a live NPR rate from Pyth oracle, shows the recipient how much NPR they will receive versus what Western Union would give, and lets them confirm and sign the transaction. Within seconds, the recipient's eSewa wallet is credited with NPR. The entire flow — from rate fetch to on-chain settlement to eSewa payout — is automated and logged on Solana's public ledger.

---

## Revenue Model

Swiflo earns on every transfer through a simple fee structure:

**0.4% protocol fee on every USDC transfer**

| Revenue stream | How it works |
|---|---|
| Protocol fee (0.3%) | Swiflo's cut — taken from every transfer before payout |
| LP yield share (0.1%) | Paid to liquidity providers who keep the pool funded |

**Why senders still win:**  Western Union's hidden exchange rate markup costs ~1.8%. Swiflo's total 0.4% fee is less than a quarter of that — senders save real money while Swiflo earns on volume.

**Revenue at scale:**
| Monthly volume | Swiflo revenue (0.3%) |
|---|---|
| $1M | $3,000 |
| $10M | $30,000 |
| $100M | $300,000 |

At $100M/month — a fraction of the $8B+ Gulf-to-Nepal annual remittance market — Swiflo generates $3.6M/year in protocol revenue with near-zero marginal cost per transaction (Solana fees are <$0.001 per tx).

**Secondary revenue streams (roadmap):**
- FX spread on currency conversion (USDC → NPR leg, once regulated)
- Premium B2B API for businesses sending bulk payroll to Nepal
- White-label protocol licensing to other corridors (Gulf → Bangladesh, Gulf → India)

---

## The Numbers

**On a $500 transfer** (mid-market rate: 1 USD = Rs 150.99):
| Service | How they charge | Recipient gets |
|---|---|---|
| Western Union | Rate markup (FX: 148.2560 NPR/USD, $0 fee) | Rs 74,128 |
| Hawala | 3–5% opaque markup | ~Rs 72,000–73,000 |
| **Swiflo** | **0.4% on send amount, live Pyth rate** | **Rs 75,193** |

**Family gets Rs 1,065 more with Swiflo vs Western Union on every $500 sent.**

---

## Solution Architecture

```
Gulf Worker (sender)                          Nepal (recipient)
┌─────────────────────┐                      ┌──────────────────────┐
│  Swiflo Web / Mobile│                      │  eSewa Wallet        │
│  (Privy Login)      │                      │  +977 98XXXXXXXX     │
└────────┬────────────┘                      └──────────┬───────────┘
         │ 1. Login with email/Google                   │
         │ 2. Deposit USDC (SWI token)                  │
         ▼                                              │
┌─────────────────────┐   on-chain tx         ┌────────┴──────────┐
│  Solana Programs    │◄──────────────────────►│  MTO (eSewa)      │
│  remittance_pool    │                        │  Webhook → payout │
│  liquidity_vault    │                        └───────────────────┘
│  rate_oracle        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Swiflo Backend API │
│  (Fastify + Prisma) │
│  - Rate service     │
│  - Settler (cron)   │
│  - Helius webhooks  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Supabase (Postgres)│
│  transfers table    │
│  rateSnapshot table │
│  lpPosition table   │
└─────────────────────┘
```

---

## Complete Transfer Flow

```
Sender                   API                    Solana              MTO (eSewa)
  │                       │                       │                      │
  │── POST /estimate ─────►│                       │                      │
  │   { amountUsdc: 100 } │                       │                      │
  │                       │── Pyth Oracle ────────►│                      │
  │                       │   USDC/USD feed        │                      │
  │                       │   + ExchangeRate-API   │                      │
  │                       │   USD/NPR rate         │                      │
  │◄── lockedRate: 150.99 ─│                       │                      │
  │    recipientGets: 15,039 NPR                   │                      │
  │    savingsNpr: 213 NPR vs WU                   │                      │
  │                       │                       │                      │
  │── USDC transfer ──────────────────────────────►│                      │
  │   (Privy signs tx)     │   remittance_pool     │                      │
  │                       │   program receives     │                      │
  │                       │                       │                      │
  │   (Helius webhook) ───►│                       │                      │
  │                       │── Create DB record ───►│                      │
  │                       │   status: pending      │                      │
  │                       │                       │                      │
  │                       │── Settler cron (10s) ──►│                     │
  │                       │   verify on-chain      │                      │
  │                       │── POST /payout ────────────────────────────►  │
  │                       │   { phone, amountNpr } │                      │
  │                       │                       │                 eSewa payout
  │                       │◄── { success: true } ──────────────────────── │
  │                       │── Update DB ───────────►│                      │
  │                       │   status: settled      │                      │
  │◄── Transfer complete ──│                       │                      │
```

---

## Rate Architecture

Swiflo uses a 4-layer fallback to always show live NPR rates:

```
┌─────────────────────────────────────────────────────────┐
│                   Rate Service                          │
│                                                         │
│  Layer 1 (primary):                                     │
│  Pyth Hermes (USDC/USD) × ExchangeRate-API (USD/NPR)   │
│  ─────────────────────────────────────────────────────  │
│  USDC/USD feed: 0xeaa020c61cc479712813461ce153894a96a  │
│  USD/NPR from: api.exchangerate-api.com/v4/latest/USD  │
│                                                         │
│  Layer 2 (if ExchangeRate-API fails):                   │
│  ExchangeRate-API direct → USD/NPR only                 │
│                                                         │
│  Layer 3 (if Pyth + ExchangeRate both fail):            │
│  CoinGecko → tether USD/NPR                             │
│                                                         │
│  Layer 4 (last resort):                                 │
│  Last valid cached value, or 150.99 hardcoded           │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
              { nprPerUsd, source, cachedAt }
              30-second in-memory cache
```

**What the rate endpoint returns:**
```json
GET /api/rates?amount=100
{
  "nprPerUsd": 150.99,
  "source": "pyth+exchangerate-api",
  "cachedAt": "2026-04-28T10:32:00.000Z",
  "swifloNpr": 15039,
  "wuNpr": 14826,
  "savingsNpr": 213,
  "lockedRate": 150.99
}
```

---

## Liquidity Provider (LP) Flow

LPs deposit USDC into the `liquidity_vault` program to earn yield from transfer fees.

```
LP depositor
     │
     │── Deposit USDC to liquidity_vault
     │
     ▼
┌─────────────────────────────────────┐
│  liquidity_vault (Solana program)   │
│                                     │
│  Total vault: 50,000 USDC           │
│  LP share: 5,000 USDC (10%)         │
│  Fee pool (from transfers): 200 USDC│
│                                     │
│  APR = (annualFees / totalVault)    │
│      × (lpShare / totalVault)       │
│                                     │
│  Rewards claimable at any time      │
└─────────────────────────────────────┘
```

---

## On-Chain Programs (Solana Devnet)

| Program | Address | Purpose |
|---|---|---|
| remittance_pool | `6M9yzRSkn5c94dAvE8v9YJMGyoqHQKEurDTrM8AerQ56` | Receives USDC from senders, escrows funds |
| liquidity_vault | `EqjvuWUyH9A1iz3voRpN58MErsB2e7D4fa5S1LWpsgKa` | LP deposits, fee distribution, rewards |
| rate_oracle | `3Zy46BADoCvhCad3xp1wHwiXMytbEAwy73E5G5mfvSUV` | Publishes NPR/USDC rate on-chain |

**SWI Token (test USDC):** `2Mfg6KX5hthtYnX8vAyqXreJtrYbxot5pbEzcyMpZGZx`

---

## Monorepo Structure

```
swiflo/
├── apps/
│   ├── api/                        # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── rate.ts         # GET /api/rates, GET /api/rate/current
│   │   │   │   ├── transfers.ts    # POST /api/transfers/estimate, /initiate
│   │   │   │   ├── faucet.ts       # POST /api/faucet (devnet SWI tokens)
│   │   │   │   ├── webhook.ts      # POST /api/webhook (Helius events)
│   │   │   │   └── lp.ts           # LP deposit/withdraw/status
│   │   │   ├── services/
│   │   │   │   ├── rateService.ts  # Pyth + ExchangeRate-API + fallbacks
│   │   │   │   └── settler.ts      # Cron: settle pending transfers every 10s
│   │   │   ├── lib/
│   │   │   │   └── prisma.ts       # Prisma client singleton
│   │   │   └── index.ts            # Fastify app entry
│   │   ├── prisma/
│   │   │   └── schema.prisma       # DB schema
│   │   ├── Dockerfile
│   │   └── .env
│   │
│   ├── web/                        # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── page.tsx            # Landing page with savings calculator
│   │   │   ├── send/page.tsx       # Send flow (amount + recipient)
│   │   │   └── confirm/page.tsx    # Confirm + sign transaction
│   │   ├── components/
│   │   │   ├── SavingsCalculator.tsx
│   │   │   └── PrivyProvider.tsx
│   │   └── Dockerfile
│   │
│   └── mobile/                     # Expo React Native (in progress)
│       └── app/
│           └── index.tsx
│
├── packages/
│   └── shared/                     # Shared TypeScript types
│       └── src/index.ts
│
├── programs/                       # Anchor (Rust) Solana programs
│   ├── remittance_pool/
│   ├── liquidity_vault/
│   └── rate_oracle/
│
├── docker-compose.yml              # One-command startup
├── .env                            # Root env (shared by Docker)
├── .dockerignore
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Database Schema

```
transfers
  id            UUID  PK
  txSignature   String  UNIQUE  (Solana transaction signature)
  senderWallet  String
  recipientPhone String
  amountUsdc    Float
  lockedRate    Float   (rate at time of transfer)
  recipientNpr  Float
  status        Enum: pending | settled | failed
  createdAt     DateTime
  settledAt     DateTime?

rateSnapshot
  id            UUID  PK
  nprPerUsd     Float
  source        String  (pyth+exchangerate-api | exchangerate-api | coingecko | cached)
  createdAt     DateTime

lpPosition
  id            UUID  PK
  walletAddress String  UNIQUE
  depositedUsdc Float
  depositedAt   DateTime
  shares        Float
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Solana (Devnet → Mainnet) |
| Smart contracts | Anchor framework (Rust) |
| Wallets | Privy (embedded email/social → Solana keypair) |
| Token | SPL Token (SWI, 6 decimals) |
| Oracle | Pyth Network (USDC/USD) + ExchangeRate-API (USD/NPR) |
| Backend | Fastify + TypeScript |
| ORM | Prisma |
| Database | Supabase (PostgreSQL) |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Mobile | Expo (React Native) |
| Monorepo | pnpm workspaces + Turborepo |
| Infra | Docker Compose |
| Events | Helius webhooks (on-chain indexing) |
| MTO payout | eSewa API (mock in dev) |

---

## Running Locally

### Option A: Docker (recommended — one command)

```bash
# Clone the repo
git clone https://github.com/swrifgjayali/swiflo.git
cd swiflo

# Copy and fill in your env vars
cp .env.example .env
# Edit .env with your keys

# Start everything
docker compose up --build

# API:  http://localhost:3001
# Web:  http://localhost:3000
```

### Option B: Manual

**Prerequisites:** Node 20+, pnpm 9+, PostgreSQL (or Supabase)

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @swiflo/api db:generate

# Push schema to DB
pnpm --filter @swiflo/api db:push

# Start API (terminal 1)
pnpm --filter @swiflo/api dev

# Start web (terminal 2)
pnpm --filter @swiflo/web dev
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `SOLANA_RPC_URL` | API | RPC endpoint (devnet: `https://api.devnet.solana.com`) |
| `HELIUS_API_KEY` | API | Helius API key for webhooks |
| `DATABASE_URL` | API | PostgreSQL connection string |
| `REMITTANCE_POOL_PROGRAM_ID` | API | Deployed remittance_pool program address |
| `LIQUIDITY_VAULT_PROGRAM_ID` | API | Deployed liquidity_vault program address |
| `RATE_ORACLE_PROGRAM_ID` | API | Deployed rate_oracle program address |
| `TEST_USDC_MINT` | API | SWI token mint address (devnet) |
| `FAUCET_SECRET_KEY` | API | JSON byte array of faucet wallet keypair |
| `MTO_MOCK_URL` | API | URL for MTO mock service (dev) |
| `WEBHOOK_SECRET` | API | HMAC secret for Helius webhook verification |
| `PRIVY_APP_ID` | API + Web | Privy application ID |
| `PRIVY_APP_SECRET` | API | Privy app secret (server-side only) |
| `NEXT_PUBLIC_API_URL` | Web | Backend API URL |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Web | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Web | Privy app ID (public) |
| `NEXT_PUBLIC_USDC_MINT` | Web | SWI token mint (shown in UI) |
| `NEXT_PUBLIC_POOL_USDC` | Web | Pool USDC account address |

---

## Demo: Send $100 to Nepal

1. Open `http://localhost:3000`
2. Click **Send money home**
3. Enter `100` USDC
4. Live rate appears: `1 USDC = Rs 150.99 · via pyth+exchangerate-api`
5. Enter recipient eSewa number: `9800000001`
6. Comparison shows: **Family gets Rs 213 more with Swiflo vs Western Union**
7. Click **See full comparison →**
8. Confirm screen shows breakdown — click **Sign & Send**
9. Privy signs the Solana transaction
10. Settler cron picks it up within 10 seconds, calls MTO payout
11. eSewa wallet credited with Rs 15,039

---

## Getting Devnet SWI Tokens (Faucet)

```bash
# Anyone can request test tokens
curl -X POST http://localhost:3001/api/faucet \
  -H 'Content-Type: application/json' \
  -d '{"wallet": "YourSolanaWalletAddressHere", "amount": 100}'

# Response: { "signature": "5xK3...", "amount": 100 }
```

The faucet transfers SWI tokens (test USDC) from the faucet wallet. Default is 100 SWI per request.

---

## Helius Webhook Setup

Helius webhooks notify the API whenever a transaction hits the remittance_pool program:

```bash
# Register webhook (run once)
curl -X POST "https://api.helius.xyz/v0/webhooks?api-key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "webhookURL": "https://your-api.com/api/webhook",
    "transactionTypes": ["TRANSFER"],
    "accountAddresses": ["6M9yzRSkn5c94dAvE8v9YJMGyoqHQKEurDTrM8AerQ56"],
    "webhookType": "enhanced",
    "authHeader": "your-webhook-secret"
  }'
```

---

## On-Chain Program Deployment (for contributors)

The Anchor programs are pre-deployed to devnet. To redeploy:

```bash
# Requires: Rust, Solana CLI, Anchor CLI, funded devnet wallet

cd programs
anchor build
anchor deploy --provider.cluster devnet

# Update program IDs in .env after redeployment
```

---

## Feature Comparison

| Feature | Western Union | Hawala | Swiflo |
|---|---|---|---|
| Fee | ~1.8% exchange rate markup ($0 transfer fee) | 3–5% opaque | **0.4% flat, live rate** |
| Speed | 1–3 days | Same day | **~30 seconds** |
| Tracking | Email only | None | **On-chain (Solana)** |
| Minimum | $1 | Varies | **$1** |
| Payout method | Bank/cash | Cash | **eSewa (mobile)** |
| Exchange rate | 148.2560 NPR/USD (vs 150.99 mid-market) | Opaque | **Pyth oracle (live mid-market)** |
| Transparency | None | None | **Full on-chain audit trail** |

---

## What We're Building Toward

- [ ] Mainnet deployment
- [ ] Real eSewa API integration (live MTO)
- [ ] Mobile app (Expo) — in progress
- [ ] Multi-corridor: Gulf → Bangladesh, Gulf → India
- [ ] LP dashboard with real-time APR
- [ ] Privy SMS login for recipients without smartphones

---

*Swiflo — keeping more money in the hands of Nepali families.*
