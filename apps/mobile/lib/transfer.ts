import { BN } from '@coral-xyz/anchor';
import { isConnected, type EmbeddedSolanaWalletState } from '@privy-io/expo';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

type InitiateTransferParams = {
  wallet: EmbeddedSolanaWalletState;
  amountUsdc: number;
  recipientPhone: string;
  lockedRate: number;
};

type BuildInitiateTransferParams = {
  connection: Connection;
  sender: PublicKey;
  amount: BN;
  recipientPhone: string;
  lockedRate: number;
};

export async function initiateTransferWithPrivy({
  wallet,
  amountUsdc,
  recipientPhone,
  lockedRate
}: InitiateTransferParams) {
  if (!isConnected(wallet)) {
    throw new Error('Wallet not connected');
  }

  const address = wallet.wallets[0]?.address ?? wallet.publicKey;
  if (!address) {
    throw new Error('Connected wallet has no address');
  }

  const connection = new Connection(process.env.EXPO_PUBLIC_SOLANA_RPC_URL as string, 'confirmed');
  const senderPubkey = new PublicKey(address);

  const transaction = await buildInitiateTransferTx({
    connection,
    sender: senderPubkey,
    amount: new BN(Math.round(amountUsdc * 1_000_000)),
    recipientPhone,
    lockedRate
  });

  const provider = await wallet.wallets[0].getProvider();
  const serializedMessage = transaction.serializeMessage();

  const response = (await provider.request({
    method: 'signMessage',
    params: {
      message: Buffer.from(serializedMessage).toString('base64')
    }
  })) as { signature: string };

  transaction.addSignature(senderPubkey, Buffer.from(response.signature, 'base64'));

  const txSignature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(txSignature, 'confirmed');

  return { signature: txSignature };
}

async function buildInitiateTransferTx(_params: BuildInitiateTransferParams): Promise<Transaction> {
  throw new Error('Implement buildInitiateTransferTx with your existing instruction builder from Phase 1/3');
}
