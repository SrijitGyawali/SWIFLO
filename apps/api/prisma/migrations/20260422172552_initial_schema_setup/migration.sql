-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('INITIATED', 'DISBURSED', 'SETTLED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LPTxType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'YIELD_CLAIM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "solanaPubkey" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "transferId" BIGINT NOT NULL,
    "senderPubkey" TEXT NOT NULL,
    "senderCountry" TEXT,
    "amountUsdc" BIGINT NOT NULL,
    "amountNpr" BIGINT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientHash" TEXT NOT NULL,
    "lockedRate" BIGINT NOT NULL,
    "feeBps" INTEGER NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'INITIATED',
    "solanaTxSignature" TEXT,
    "mtoReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiatedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "senderUserId" TEXT,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityProvider" (
    "id" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "totalDeposited" BIGINT NOT NULL DEFAULT 0,
    "totalWithdrawn" BIGINT NOT NULL DEFAULT 0,
    "lpTokens" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "LiquidityProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LPTransaction" (
    "id" TEXT NOT NULL,
    "lpPubkey" TEXT NOT NULL,
    "type" "LPTxType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "txSignature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LPTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaultState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "totalLiquidity" BIGINT NOT NULL DEFAULT 0,
    "activeAdvances" BIGINT NOT NULL DEFAULT 0,
    "utilizationBps" INTEGER NOT NULL DEFAULT 0,
    "currentAprBps" INTEGER NOT NULL DEFAULT 1200,
    "totalYieldPaid" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateSnapshot" (
    "id" TEXT NOT NULL,
    "usdcToNprRate" BIGINT NOT NULL,
    "pythPrice" BIGINT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_privyUserId_key" ON "User"("privyUserId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_solanaPubkey_idx" ON "User"("solanaPubkey");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_transferId_key" ON "Transfer"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_solanaTxSignature_key" ON "Transfer"("solanaTxSignature");

-- CreateIndex
CREATE INDEX "Transfer_senderPubkey_idx" ON "Transfer"("senderPubkey");

-- CreateIndex
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");

-- CreateIndex
CREATE INDEX "Transfer_createdAt_idx" ON "Transfer"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityProvider_pubkey_key" ON "LiquidityProvider"("pubkey");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityProvider_userId_key" ON "LiquidityProvider"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LPTransaction_txSignature_key" ON "LPTransaction"("txSignature");

-- CreateIndex
CREATE INDEX "LPTransaction_lpPubkey_idx" ON "LPTransaction"("lpPubkey");

-- CreateIndex
CREATE INDEX "RateSnapshot_recordedAt_idx" ON "RateSnapshot"("recordedAt");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityProvider" ADD CONSTRAINT "LiquidityProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
