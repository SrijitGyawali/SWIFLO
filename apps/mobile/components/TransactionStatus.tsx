import { View, Text, StyleSheet } from 'react-native'

type Step = 'sent' | 'confirmed' | 'advanced' | 'delivered'

const STEPS: { key: Step; label: string }[] = [
  { key: 'sent', label: 'Sent to Solana' },
  { key: 'confirmed', label: 'Blockchain confirmed' },
  { key: 'advanced', label: 'Funds advanced to Nepal' },
  { key: 'delivered', label: 'Delivered to eSewa' },
]

const ORDER: Step[] = ['sent', 'confirmed', 'advanced', 'delivered']

type Props = { currentStep: Step }

export function TransactionStatus({ currentStep }: Props) {
  const currentIdx = ORDER.indexOf(currentStep)

  return (
    <View style={styles.container}>
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        return (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.iconCol}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done && <Text style={styles.check}>✓</Text>}
                {active && <View style={styles.pulse} />}
              </View>
              {idx < STEPS.length - 1 && (
                <View style={[styles.line, done && styles.lineDone]} />
              )}
            </View>
            <Text style={[styles.label, done && styles.labelDone, active && styles.labelActive]}>
              {step.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  iconCol: { alignItems: 'center', width: 32 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1C2028',
    borderWidth: 2,
    borderColor: '#2A2F38',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: '#00D084', borderColor: '#00D084' },
  dotActive: { borderColor: '#5865F2' },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5865F2' },
  check: { color: '#fff', fontSize: 12, fontWeight: '700' },
  line: { width: 2, height: 32, backgroundColor: '#2A2F38', marginVertical: 2 },
  lineDone: { backgroundColor: '#00D084' },
  label: { color: '#5A6270', fontSize: 15, paddingLeft: 12, paddingTop: 4, paddingBottom: 32 },
  labelDone: { color: '#00D084' },
  labelActive: { color: '#F0F2F5', fontWeight: '600' },
})
