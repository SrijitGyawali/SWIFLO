import Link from 'next/link'
import { LiveStats } from '@/components/LiveStats'
import { SavingsCalculator } from '@/components/SavingsCalculator'

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-6">

      {/* Hero */}
      <section className="py-24 text-center">
        <div className="inline-block bg-success/10 text-success text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-success/20">
          Live on Solana Devnet
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-txt leading-tight mb-6">
          Send Rs 20,000 home<br />
          <span className="text-accent">for Rs 80.</span>
        </h1>
        <p className="text-muted text-xl max-w-2xl mx-auto mb-10">
          Western Union charges Rs 1,200 for the same transfer. Swiflo settles on Solana in under 60 seconds for 0.4%.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/send" className="bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
            Send money now →
          </Link>
          <Link href="/explorer" className="bg-surface2 hover:bg-border text-txt font-semibold px-8 py-4 rounded-xl text-lg transition-colors border border-border">
            View explorer
          </Link>
        </div>
      </section>

      {/* Live stats */}
      <LiveStats />

      {/* Problem section */}
      <section className="py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold text-txt mb-4">Ram earns. Western Union keeps 6%.</h2>
          <p className="text-muted text-lg leading-relaxed mb-4">
            Ram Bahadur sends Rs 20,000 home from Qatar every month. Western Union takes Rs 1,200 — every single time. Over a year that&apos;s Rs 14,400. Thirty-six days of his salary. Gone.
          </p>
          <p className="text-muted text-lg leading-relaxed">
            Nepal&apos;s 5 million migrant workers lose <span className="text-danger font-semibold">Rs 78 billion</span> to fees every year. Swiflo gives it back.
          </p>
        </div>
        <div className="bg-surface rounded-2xl p-6 border border-border space-y-4">
          {[
            { label: 'Western Union', fee: 'Rs 1,200', received: 'Rs 18,800', color: 'text-danger' },
            { label: 'Swiflo', fee: 'Rs 80', received: 'Rs 19,920', color: 'text-success', highlight: true },
          ].map(r => (
            <div key={r.label} className={`p-4 rounded-xl ${r.highlight ? 'bg-accent/10 border border-accent' : 'bg-surface2'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-semibold ${r.highlight ? 'text-txt' : 'text-muted'}`}>{r.label}</span>
                <span className={`text-sm ${r.color}`}>Fee: {r.fee}</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${r.highlight ? 'text-txt' : 'text-muted'}`}>{r.received}</p>
              <p className="text-dim text-xs">family receives</p>
            </div>
          ))}
          <div className="bg-success/10 rounded-xl p-3 text-center border border-success/20">
            <span className="text-success font-semibold">Family gets Rs 1,120 more with Swiflo</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-txt mb-12 text-center">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Connect & send', desc: 'Connect your wallet or sign in with email. Enter the amount and recipient eSewa number in Nepal.' },
            { step: '02', title: 'Solana settles', desc: 'Your USDC is locked on-chain in under 4 seconds. A licensed MTO partner is notified instantly.' },
            { step: '03', title: 'Family receives NPR', desc: 'The recipient gets NPR directly in their eSewa wallet. No crypto, no exchange, no hassle.' },
          ].map(s => (
            <div key={s.step} className="bg-surface rounded-2xl p-6 border border-border">
              <span className="text-accent font-mono text-sm">{s.step}</span>
              <h3 className="text-txt font-bold text-xl mt-2 mb-3">{s.title}</h3>
              <p className="text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calculator */}
      <SavingsCalculator />

    </div>
  )
}
