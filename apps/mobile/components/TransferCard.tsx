import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { formatTimeAgo, maskPhone } from '../lib/format'

type Transfer = {
  id: string
  amountUsdc: string
  amountNpr: string
  recipientPhone: string
  status: 'INITIATED' | 'DISBURSED' | 'SETTLED' | 'FAILED'
  createdAt: string
  solanaTxSignature?: string
}

const STATUS_CONFIG = {
  INITIATED: { color: '#FFB020', label: 'Sending...' },
  DISBURSED: { color: '#00D084', label: 'Delivered' },
  SETTLED:   { color: '#5865F2', label: 'Settled' },
  FAILED:    { color: '#FF4757', label: 'Failed' },
}

export function TransferCard({ transfer }: { transfer: Transfer }) {
  const router = useRouter()
  const cfg = STATUS_CONFIG[transfer.status]
  const usdcAmt = (Number(transfer.amountUsdc) / 1_000_000).toFixed(2)
  const nprAmt = Number(transfer.amountNpr).toLocaleString('en-IN')

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/processing/${transfer.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={styles.amount}>{usdcAmt} USDC</Text>
        <Text style={styles.sub}>→ Rs {nprAmt} · {maskPhone(transfer.recipientPhone)}</Text>
        <Text style={styles.time}>{formatTimeAgo(transfer.createdAt)}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: cfg.color + '22' }]}>
        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#14171C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  left: {},
  amount: { color: '#F0F2F5', fontSize: 16, fontWeight: '700' },
  sub: { color: '#8B92A0', fontSize: 13, marginTop: 2 },
  time: { color: '#5A6270', fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
})
