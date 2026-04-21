import { usePrivy } from '@privy-io/expo';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { logout } = usePrivy();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0D10', padding: 24, justifyContent: 'center' }}>
      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: '#5865F2', padding: 16, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
