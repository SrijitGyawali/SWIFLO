import { View, Text, TextInput, StyleSheet } from 'react-native'

type Props = {
  value: string
  onChange: (v: string) => void
  error?: string
}

export function RecipientInput({ value, onChange, error }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Recipient eSewa number</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <Text style={styles.flag}>🇳🇵 +977</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="98XXXXXXXX"
          placeholderTextColor="#5A6270"
          keyboardType="phone-pad"
          maxLength={10}
          style={styles.input}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { color: '#8B92A0', fontSize: 14, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14171C',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A2F38',
  },
  inputError: { borderColor: '#FF4757' },
  flag: { fontSize: 16, marginRight: 8, color: '#F0F2F5' },
  input: { flex: 1, color: '#F0F2F5', fontSize: 18, paddingVertical: 16 },
  error: { color: '#FF4757', fontSize: 12, marginTop: 4 },
})
