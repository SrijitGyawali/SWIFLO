import { useSwifloWallet } from '@/lib/privyWallet';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  const { user, address, isReady } = useSwifloWallet();

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0D10', padding: 24, justifyContent: 'center' }}>
      <Text style={{ color: '#F0F2F5', fontSize: 28, fontWeight: '700', marginBottom: 12 }}>
        Swiflo Home
      </Text>
      <Text style={{ color: '#B4B9C4', fontSize: 16, marginBottom: 8 }}>
        Status: {isReady ? 'Wallet ready' : 'Preparing wallet...'}
      </Text>
      <Text style={{ color: '#B4B9C4', fontSize: 16, marginBottom: 8 }}>
        User: {user?.id ?? 'Not logged in'}
      </Text>
      <Text style={{ color: '#B4B9C4', fontSize: 16 }}>
        Wallet: {address ?? 'Unavailable'}
      </Text>
    </View>
  );
}
