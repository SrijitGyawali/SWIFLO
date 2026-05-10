import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { WorldMapPaymentFlowSection } from '@/components/WorldMapPaymentFlowSection'
import { FooterSection } from '@/components/FooterSection'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <WorldMapPaymentFlowSection />
      <FooterSection />
    </>
  )
}
