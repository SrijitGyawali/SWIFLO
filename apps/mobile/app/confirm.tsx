import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { RateComparison } from '../components/RateComparison'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { initiateTransferWithPrivy } from '../lib/transfer'
import { apiRequest } from '../lib/api'

export default function ConfirmScreen() {
  const { amountUsdc, phone, lockedRate, recipientGetsNpr, savingsNpr } = useLocalSearchParams<{
    amountUsdc: string
    phone: string
    lockedRate: string
    recipientGetsNpr: string
    savingsNpr: string
  }>()

  const wallet = useEmbeddedSolanaWallet()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!amountUsdc || !phone || !lockedRate) return
    setLoading(true)
    try {
      const { signature } = await initiateTransferWithPrivy({
        wallet,
        amountUsdc: parseFloat(amountUsdc),
        recipientPhone: phone,
        lockedRate: parseFloat(lockedRate),
      })

      // Notify backend of the on-chain tx + recipient phone
      const result = await apiRequest<{ transferId: string }>('/api/webhooks/transfer-initiated', {
        method: 'POST',
        body: JSON.stringify({
          transferId: '0',          // updated by backend from Solana event
          recipientPhone: phone,
          amountUsdc: String(Math.round(parseFloat(amountUsdc) * 1_000_000)),
          lockedRate,
          solanaTxSignature: signature,
          senderPubkey: wallet.wallets?.[0]?.address ?? '',
        }),
      })

      router.replace({
        pathname: '/processing/[id]',
        params: { id: signature, savingsNpr },
      })
    } catch (err: any) {
      Alert.alert('Transaction failed', err.message ?? 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Edit</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Confirm transfer</Text>
      <Text style={styles.sub}>
        Sending {amountUsdc} USDC → {phone}
      </Text>

      <RateComparison amountUsdc={parseFloat(amountUsdc)} lockedRate={parseFloat(lockedRate)} />

      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Locked rate</Text>
        <Text style={styles.rateValue}>1 USDC = Rs {parseFloat(lockedRate).toFixed(2)}</Text>
      </View>
      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Fee</Text>
        <Text style={styles.rateValue}>0.4% (Rs {Math.round(parseFloat(amountUsdc) * parseFloat(lockedRate) * 0.004).toLocaleString('en-IN')})</Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleConfirm}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Confirm & send</Text>
        }
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Rate locked for 5 minutes · Powered by Solana
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0D10', padding: 24, paddingTop: 60 },
  back: { marginBottom: 24 },
  backText: { color: '#8B92A0', fontSize: 15 },
  title: { color: '#F0F2F5', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  sub: { color: '#8B92A0', fontSize: 15, marginBottom: 24 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rateLabel: { color: '#8B92A0', fontSize: 14 },
  rateValue: { color: '#F0F2F5', fontSize: 14, fontWeight: '600' },
  btn: { backgroundColor: '#5865F2', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: { color: '#5A6270', fontSize: 12, textAlign: 'center', marginTop: 14 },
})
