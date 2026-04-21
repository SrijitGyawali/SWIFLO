import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
import { PrivyProvider } from '@privy-io/expo';
import { Stack } from 'expo-router';

global.Buffer = Buffer;

export default function RootLayout() {
  return (
    <PrivyProvider
      appId={process.env.EXPO_PUBLIC_PRIVY_APP_ID as string}
      clientId={process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID as string}
      config={{
        embedded: {
          solana: {
            createOnLogin: 'all-users'
          }
        }
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </PrivyProvider>
  );
}
