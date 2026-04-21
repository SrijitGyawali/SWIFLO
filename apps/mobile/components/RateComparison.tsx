import { View, Text, StyleSheet } from 'react-native'

type Props = {
  amountUsdc: number
  lockedRate: number
}

export function RateComparison({ amountUsdc, lockedRate }: Props) {
  const nprGross = amountUsdc * lockedRate
  const swifloFee = nprGross * 0.004
  const wuFee = nprGross * 0.06
  const swifloReceived = Math.round(nprGross - swifloFee)
  const wuReceived = Math.round(nprGross - wuFee)
  const savings = swifloReceived - wuReceived

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.provider}>
          <Text style={styles.providerName}>Western Union</Text>
          <Text style={styles.fee}>6% fee</Text>
        </View>
        <View style={styles.amountWrap}>
          <Text style={styles.amountNegative}>Rs {wuReceived.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={[styles.row, styles.rowHighlight]}>
        <View style={styles.provider}>
          <Text style={styles.providerNameHighlight}>Swiflo</Text>
          <Text style={styles.feeHighlight}>0.4% fee</Text>
        </View>
        <View style={styles.amountWrap}>
          <Text style={styles.amountPositive}>Rs {swifloReceived.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.savingsBanner}>
        <Text style={styles.savingsText}>
          Family gets Rs {savings.toLocaleString('en-IN')} more with Swiflo
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#14171C',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowHighlight: { backgroundColor: '#1C2028', borderWidth: 1, borderColor: '#5865F2' },
  provider: {},
  providerName: { color: '#8B92A0', fontSize: 15, fontWeight: '600' },
  providerNameHighlight: { color: '#F0F2F5', fontSize: 15, fontWeight: '700' },
  fee: { color: '#FF4757', fontSize: 12, marginTop: 2 },
  feeHighlight: { color: '#00D084', fontSize: 12, marginTop: 2 },
  amountWrap: {},
  amountNegative: { color: '#8B92A0', fontSize: 18, fontWeight: '600' },
  amountPositive: { color: '#F0F2F5', fontSize: 20, fontWeight: '700' },
  savingsBanner: {
    backgroundColor: 'rgba(0, 208, 132, 0.12)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  savingsText: { color: '#00D084', fontSize: 14, fontWeight: '600' },
})
