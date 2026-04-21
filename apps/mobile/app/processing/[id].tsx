import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { TransactionStatus } from '../../components/TransactionStatus'
import { apiRequest } from '../../lib/api'

type Step = 'sent' | 'confirmed' | 'advanced' | 'delivered'

function statusToStep(status: string): Step {
  if (status === 'SETTLED') return 'delivered'
  if (status === 'DISBURSED') return 'advanced'
  return 'confirmed'
}

export default function ProcessingScreen() {
  const { id, savingsNpr } = useLocalSearchParams<{ id: string; savingsNpr: string }>()
  const [step, setStep] = useState<Step>('sent')
  const [transfer, setTransfer] = useState<any>(null)

  useEffect(() => {
    // Advance to 'confirmed' quickly — tx is already on-chain when we get here
    const t1 = setTimeout(() => setStep('confirmed'), 1500)

    // Poll for MTO disbursement
    const poll = setInterval(async () => {
      try {
        const t = await apiRequest<any>(`/api/transfers/${id}/status`)
        setTransfer(t)
        setStep(statusToStep(t.status))
        if (t.status === 'SETTLED' || t.status === 'DISBURSED') {
          clearInterval(poll)
          setTimeout(() => {
            router.replace({
              pathname: '/success/[id]',
              params: {
                id: t.id,
                amountUsdc: t.amountUsdc,
                amountNpr: t.amountNpr,
                recipientPhone: t.recipientPhone,
                solanaTxSignature: t.solanaTxSignature ?? id,
                savingsNpr,
              },
            })
          }, 1000)
        }
      } catch {}
    }, 3000)

    return () => {
      clearTimeout(t1)
      clearInterval(poll)
    }
  }, [id])

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Sending…</Text>
      <Text style={styles.sub}>Your family will receive funds shortly</Text>

      <TransactionStatus currentStep={step} />

      <View style={styles.ticker}>
        <Text style={styles.tickerLabel}>Solana tx</Text>
        <Text style={styles.tickerValue} numberOfLines={1}>{id?.slice(0, 20)}…</Text>
      </View>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.cancelText}>Go to home (transfer continues)</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0D10', padding: 24, paddingTop: 80 },
  title: { color: '#F0F2F5', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  sub: { color: '#8B92A0', fontSize: 15, marginBottom: 40 },
  ticker: {
    backgroundColor: '#14171C',
    borderRadius: 10,
    padding: 14,
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tickerLabel: { color: '#5A6270', fontSize: 12 },
  tickerValue: { color: '#8B92A0', fontSize: 12, flex: 1, marginLeft: 8, textAlign: 'right' },
  cancelBtn: { marginTop: 'auto', alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: '#5A6270', fontSize: 14 },
})
