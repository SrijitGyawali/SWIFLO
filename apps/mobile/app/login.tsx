import { useLoginWithSMS, usePrivy } from '@privy-io/expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const { user, isReady } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithSMS();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  if (isReady && user) {
    router.replace('/(tabs)/home');
    return null;
  }

  const handleSendCode = async () => {
    try {
      await sendCode({ phone });
      setStep('code');
    } catch {
      Alert.alert('Error', 'Could not send SMS code. Check the phone number.');
    }
  };

  const handleVerifyCode = async () => {
    try {
      await loginWithCode({ code, phone });
      router.replace('/(tabs)/home');
    } catch {
      Alert.alert('Error', 'Invalid code. Try again.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: '#0B0D10', justifyContent: 'center' }}>
      <Text style={{ fontSize: 32, color: '#F0F2F5', fontWeight: '700', marginBottom: 8 }}>
        Swiflo
      </Text>
      <Text style={{ fontSize: 16, color: '#8B92A0', marginBottom: 40 }}>
        Send money home in seconds
      </Text>

      {step === 'phone' ? (
        <>
          <Text style={{ color: '#B4B9C4', marginBottom: 8 }}>Your phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+974 3000 0000"
            placeholderTextColor="#5A6270"
            keyboardType="phone-pad"
            style={{
              backgroundColor: '#14171C',
              color: '#F0F2F5',
              padding: 16,
              borderRadius: 12,
              fontSize: 18,
              marginBottom: 16
            }}
          />
          <TouchableOpacity
            onPress={handleSendCode}
            style={{
              backgroundColor: '#5865F2',
              padding: 18,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Send code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={{ color: '#B4B9C4', marginBottom: 8 }}>Enter the 6-digit code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            placeholderTextColor="#5A6270"
            keyboardType="number-pad"
            maxLength={6}
            style={{
              backgroundColor: '#14171C',
              color: '#F0F2F5',
              padding: 16,
              borderRadius: 12,
              fontSize: 24,
              letterSpacing: 4,
              textAlign: 'center',
              marginBottom: 16
            }}
          />
          <TouchableOpacity
            onPress={handleVerifyCode}
            style={{
              backgroundColor: '#5865F2',
              padding: 18,
              borderRadius: 12,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              Verify and continue
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
