import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'

type Props = {
  valueUsdc: string
  onChangeUsdc: (v: string) => void
  lockedRate: number
}

export function AmountInput({ valueUsdc, onChangeUsdc, lockedRate }: Props) {
  const [showNpr, setShowNpr] = useState(false)

  const usdc = parseFloat(valueUsdc) || 0
  const nprEquiv = Math.round(usdc * lockedRate)

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          value={valueUsdc}
          onChangeText={onChangeUsdc}
          placeholder="0.00"
          placeholderTextColor="#5A6270"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setShowNpr(v => !v)} style={styles.badge}>
          <Text style={styles.badgeText}>{showNpr ? 'NPR' : 'USDC'}</Text>
        </TouchableOpacity>
      </View>
      {usdc > 0 && (
        <Text style={styles.equiv}>
          ≈ Rs {nprEquiv.toLocaleString('en-IN')} NPR
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#14171C', borderRadius: 12, paddingHorizontal: 16 },
  input: { flex: 1, color: '#F0F2F5', fontSize: 32, fontWeight: '600', paddingVertical: 18 },
  badge: { backgroundColor: '#1C2028', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#8B92A0', fontSize: 13, fontWeight: '600' },
  equiv: { color: '#8B92A0', fontSize: 14, marginTop: 6, marginLeft: 4 },
})
