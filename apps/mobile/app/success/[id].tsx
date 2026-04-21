import { router, useLocalSearchParams } from 'expo-router'
import { SuccessReceipt } from '../../components/SuccessReceipt'

export default function SuccessScreen() {
  const { amountUsdc, amountNpr, recipientPhone, solanaTxSignature, savingsNpr } =
    useLocalSearchParams<{
      id: string
      amountUsdc: string
      amountNpr: string
      recipientPhone: string
      solanaTxSignature: string
      savingsNpr: string
    }>()

  return (
    <SuccessReceipt
      amountUsdc={amountUsdc ?? '0'}
      amountNpr={amountNpr ?? '0'}
      recipientPhone={recipientPhone ?? ''}
      solanaTxSignature={solanaTxSignature ?? ''}
      savingsNpr={parseInt(savingsNpr ?? '0')}
      onDone={() => router.replace('/(tabs)/home')}
    />
  )
}
