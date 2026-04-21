import { isConnected, useEmbeddedSolanaWallet, usePrivy } from '@privy-io/expo';
import { PublicKey } from '@solana/web3.js';

export function useSwifloWallet() {
  const { user } = usePrivy();
  const wallet = useEmbeddedSolanaWallet();
  const connected = isConnected(wallet);
  const address = connected ? wallet.wallets[0]?.address ?? wallet.publicKey : null;

  const isReady = Boolean(user && connected && address);
  const publicKey = isReady ? new PublicKey(address as string) : null;

  return {
    isReady,
    publicKey,
    address,
    user,
    wallet
  };
}
