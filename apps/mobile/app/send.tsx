import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { AmountInput } from '../components/AmountInput'
import { RecipientInput } from '../components/RecipientInput'
import { apiRequest } from '../lib/api'

const DEFAULT_RATE = 133.5

export default function SendScreen() {
  const [amountUsdc, setAmountUsdc] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [rate, setRate] = useState(DEFAULT_RATE)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!phone.match(/^9[678]\d{8}$/)) {
      setPhoneError('Enter a valid 10-digit Nepali mobile number')
      return false
    }
    setPhoneError('')
    if (!parseFloat(amountUsdc) || parseFloat(amountUsdc) <= 0) {
      Alert.alert('Enter an amount')
      return false
    }
    return true
  }

  const handleContinue = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const estimate = await apiRequest<any>('/api/transfers/estimate', {
        method: 'POST',
        body: JSON.stringify({ amountUsdc: parseFloat(amountUsdc) }),
      })
      router.push({
        pathname: '/confirm',
        params: {
          amountUsdc,
          phone: `+977${phone}`,
          lockedRate: estimate.lockedRate,
          recipientGetsNpr: estimate.recipientGetsNpr,
          savingsNpr: estimate.savingsNpr,
        },
      })
    } catch {
      Alert.alert('Could not fetch rate', 'Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Send money home</Text>
      <Text style={styles.sub}>Instant transfer to eSewa in Nepal</Text>

      <Text style={styles.label}>Amount (USDC)</Text>
      <AmountInput valueUsdc={amountUsdc} onChangeUsdc={setAmountUsdc} lockedRate={rate} />

      <Text style={styles.label}>Recipient</Text>
      <RecipientInput value={phone} onChange={setPhone} error={phoneError} />

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleContinue}
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? 'Getting rate...' : 'See comparison →'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0D10' },
  content: { padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { color: '#8B92A0', fontSize: 15 },
  title: { color: '#F0F2F5', fontSize: 28, fontWeight: '800', marginBottom: 6 },
  sub: { color: '#8B92A0', fontSize: 15, marginBottom: 32 },
  label: { color: '#8B92A0', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  btn: { backgroundColor: '#5865F2', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
