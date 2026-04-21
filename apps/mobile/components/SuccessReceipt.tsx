import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { truncateAddress, maskPhone } from '../lib/format'

type Props = {
  amountUsdc: string
  amountNpr: string
  recipientPhone: string
  solanaTxSignature: string
  savingsNpr: number
  onDone: () => void
}

export function SuccessReceipt({ amountUsdc, amountNpr, recipientPhone, solanaTxSignature, savingsNpr, onDone }: Props) {
  const usdcAmt = (Number(amountUsdc) / 1_000_000).toFixed(2)
  const nprAmt = Number(amountNpr).toLocaleString('en-IN')

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>Money sent!</Text>
      <Text style={styles.sub}>Rs {nprAmt} delivered to {maskPhone(recipientPhone)}</Text>

      <View style={styles.card}>
        <Row label="You sent" value={`${usdcAmt} USDC`} />
        <Row label="They received" value={`Rs ${nprAmt}`} />
        <Row label="Fee" value="0.4%" />
        <Row label="Saved vs WU" value={`Rs ${savingsNpr.toLocaleString('en-IN')}`} highlight />
      </View>

      <TouchableOpacity
        style={styles.explorerBtn}
        onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${solanaTxSignature}?cluster=devnet`)}
      >
        <Text style={styles.explorerText}>View on Solana Explorer ↗</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D10', padding: 24, justifyContent: 'center' },
  icon: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: { color: '#F0F2F5', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  sub: { color: '#8B92A0', fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  card: { backgroundColor: '#14171C', borderRadius: 16, padding: 20, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1C2028' },
  rowLabel: { color: '#8B92A0', fontSize: 15 },
  rowValue: { color: '#F0F2F5', fontSize: 15, fontWeight: '600' },
  rowValueHighlight: { color: '#00D084' },
  explorerBtn: { alignItems: 'center', marginBottom: 16 },
  explorerText: { color: '#5865F2', fontSize: 14 },
  doneBtn: { backgroundColor: '#5865F2', padding: 18, borderRadius: 14, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
