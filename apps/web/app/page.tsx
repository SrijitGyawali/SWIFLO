import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="relative overflow-hidden bg-[#0B0D10]">

      {/* Atmospheric blobs */}
      <div className="pointer-events-none fixed top-[10%] left-[-10%] w-[600px] h-[600px] atmospheric-radial -z-10" />
      <div className="pointer-events-none fixed bottom-[20%] right-[-10%] w-[800px] h-[800px] atmospheric-radial -z-10" />

      {/* ── HERO ── */}
      <section className="pt-28 md:pt-40 pb-16 md:pb-24 px-5 md:px-8 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="space-y-6 md:space-y-8">
          <h1 className="font-manrope text-[2.6rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-[72px] font-bold tracking-[-0.04em] text-white">
            Send Rs 20,000 home for{' '}
            <span className="text-primary text-glow">Rs 80</span>.
            {' '}Not Rs 1,200.
          </h1>
          <p className="font-inter text-base md:text-lg leading-relaxed text-on-surface-variant max-w-lg">
            Instant, cheap, real money. No crypto knowledge needed. Powered by ultra-fast Solana rails for the everyday Gulf worker.
          </p>
          <div>
            <Link
              href="/send"
              className="inline-block bg-[#1E2875] hover:bg-[#4A5CB5] text-white px-7 py-3.5 md:px-8 md:py-4 rounded-lg font-manrope text-base md:text-lg font-semibold transition-all border-t border-white/10 shadow-lg"
            >
              Try the demo →
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 md:pt-12 border-t border-white/5">
            {[
              { label: 'Delivery time',    value: '30 sec' },
              { label: 'Your fee',         value: 'Rs 80' },
              { label: 'vs Western Union', value: '20x cheaper' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-space-grotesk text-[10px] md:text-xs tracking-[0.08em] md:tracking-[0.1em] uppercase text-primary mb-1 leading-tight">{label}</p>
                <p className="font-manrope text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phone mockup — hidden on mobile to keep page tight */}
        <div className="hidden lg:flex relative justify-center">
          <div className="w-[280px] h-[560px] md:w-[320px] md:h-[640px] glass-card rounded-[40px] p-4 indigo-glow overflow-hidden relative">
            <div className="w-full h-full rounded-[32px] bg-gradient-to-br from-indigo-900/60 to-purple-900/40 flex flex-col items-center justify-center gap-6 p-6">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">send</span>
              </div>
              <div className="text-center">
                <p className="font-space-grotesk text-xs uppercase tracking-widest text-gray-400 mb-2">You send</p>
                <p className="font-manrope text-4xl font-bold text-white">100 SWI</p>
              </div>
              <div className="w-px h-12 bg-gradient-to-b from-indigo-500 to-transparent" />
              <div className="text-center">
                <p className="font-space-grotesk text-xs uppercase tracking-widest text-gray-400 mb-2">Family receives</p>
                <p className="font-manrope text-4xl font-bold text-primary">Rs 15,039</p>
              </div>
              <div className="w-full glass-card rounded-xl px-4 py-3 text-center">
                <p className="font-space-grotesk text-xs text-green-400 uppercase tracking-widest">✓ Settled in 30 seconds</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-transparent to-transparent pointer-events-none rounded-[40px]" />
          </div>
        </div>
      </section>

      {/* ── BENTO CARDS ── */}
      <section className="py-16 md:py-24 px-5 md:px-8 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[
            {
              icon: 'account_balance_wallet',
              title: 'GET SWI',
              desc: 'Top up your wallet instantly with test SWI tokens. No bank, no spread.',
              href: '/fund',
              highlight: false,
            },
            {
              icon: 'send',
              title: 'SEND',
              desc: 'Cross-border transfers that settle in seconds, not business days.',
              href: '/send',
              highlight: true,
            },
            {
              icon: 'explore',
              title: 'EXPLORER',
              desc: 'Track every single rupee on the transparent public Solana ledger.',
              href: '/explorer',
              highlight: false,
            },
          ].map(({ icon, title, desc, href, highlight }) => (
            <Link
              key={title}
              href={href}
              className={`glass-card p-7 md:p-10 rounded-xl group hover:border-primary/50 transition-all cursor-pointer ${highlight ? 'bg-primary/5' : ''}`}
            >
              <span className="material-symbols-outlined text-3xl md:text-4xl text-primary mb-4 md:mb-6 block">{icon}</span>
              <h3 className="font-manrope text-2xl md:text-3xl font-semibold text-white mb-2 md:mb-4">{title}</h3>
              <p className="text-on-surface-variant text-sm md:text-base">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-16 md:py-24 border-y border-white/5 bg-[#0d0e13]/50">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <div>
            <h2 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6 md:mb-8 leading-tight">
              Every month, migrant workers lose billions to fees.
            </h2>
            <div className="space-y-4">
              <div className="p-4 border-l-2 border-red-500">
                <p className="text-on-surface-variant text-base md:text-lg">
                  Western Union exchange rate markup: <span className="text-red-400 font-bold">~1.8% hidden fee</span>
                </p>
              </div>
              <div className="p-4 border-l-2 border-primary">
                <p className="text-on-surface-variant text-base md:text-lg">
                  SWIFLO total fee: <span className="text-primary font-bold">0.4% flat</span>
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-7 md:p-10 rounded-2xl relative">
            <div className="absolute -top-4 -right-4 bg-primary text-on-primary font-manrope font-bold text-xs px-4 py-2 rounded-lg uppercase tracking-widest">
              CASE STUDY
            </div>
            <p className="text-base md:text-lg text-white mb-6 leading-relaxed">
              &ldquo;By switching to Swiflo, Ram saves{' '}
              <span className="text-primary font-black">Rs 13,440/year</span>. That&apos;s two months of rent for his family back in Kathmandu.&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div>
                <p className="font-bold text-white">Ram Bahadur</p>
                <p className="font-space-grotesk text-xs text-on-surface-variant uppercase tracking-widest">Construction worker · Doha, Qatar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 md:py-32 px-5 md:px-8 max-w-[1280px] mx-auto text-center">
        <h2 className="font-manrope text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-12 md:mb-20">The 3-Step Flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            { n: '1', title: 'Deposit SWI',      desc: 'SWI flows from your Gulf wallet. Login with just your email — no seed phrases.' },
            { n: '2', title: 'Locked on Solana',  desc: 'Immutable verification of funds at 65,000 TPS. Your transfer is on-chain in seconds.' },
            { n: '3', title: 'Instant NPR',       desc: 'Recipient gets NPR directly in their eSewa wallet. No crypto, no exchange, no wait.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="space-y-4 md:space-y-6">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto">
                <span className="text-white font-manrope font-bold text-lg md:text-xl">{n}</span>
              </div>
              <h4 className="font-manrope text-lg md:text-xl font-semibold text-white">{title}</h4>
              <p className="text-on-surface-variant text-sm md:text-base">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RATE COMPARISON ── */}
      <section className="py-16 md:py-24 px-5 md:px-8 max-w-[1000px] mx-auto">
        <h2 className="font-manrope text-2xl md:text-3xl font-semibold text-white mb-6 text-center">Rate Comparison</h2>
        <div className="glass-card rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-white/10">
                {['PROVIDER', 'EFFECTIVE FEE', 'EXCHANGE RATE', 'DELIVERY'].map(h => (
                  <th key={h} className="p-4 md:p-6 font-space-grotesk text-xs tracking-[0.1em] uppercase text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-white font-space-grotesk text-sm">
              <tr className="border-b border-white/5 opacity-50">
                <td className="p-4 md:p-6">Western Union</td>
                <td className="p-4 md:p-6">~1.8% markup</td>
                <td className="p-4 md:p-6">148.26 NPR/USD</td>
                <td className="p-4 md:p-6 whitespace-nowrap">2–3 Days</td>
              </tr>
              <tr className="bg-indigo-500/10 border-l-4 border-indigo-500">
                <td className="p-4 md:p-6 font-bold">SWIFLO</td>
                <td className="p-4 md:p-6 font-bold text-primary">0.4% flat</td>
                <td className="p-4 md:p-6 font-bold whitespace-nowrap">150.99 NPR/USD (live)</td>
                <td className="p-4 md:p-6 font-bold whitespace-nowrap">30 Seconds</td>
              </tr>
              <tr className="opacity-50">
                <td className="p-4 md:p-6">Wise</td>
                <td className="p-4 md:p-6">~0.5% fee</td>
                <td className="p-4 md:p-6">Mid-market</td>
                <td className="p-4 md:p-6 whitespace-nowrap">1–2 Days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-16 md:py-24 text-center">
        <p className="font-space-grotesk text-xs text-on-surface-variant mb-8 md:mb-12 tracking-[0.3em] uppercase">Secured by industry titans</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 px-5 md:px-8 opacity-50 grayscale">
          {[
            { icon: 'security',          label: 'Solana' },
            { icon: 'currency_exchange', label: 'USDC' },
            { icon: 'lock',              label: 'Privy' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl md:text-3xl">{icon}</span>
              <span className="font-manrope text-lg md:text-xl font-bold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-32 px-5 md:px-8 max-w-[1280px] mx-auto">
        <div className="glass-card px-8 py-14 md:p-20 rounded-[32px] md:rounded-[40px] text-center indigo-glow relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 pointer-events-none" />
          <h2 className="font-manrope text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 md:mb-8 tracking-tight">
            Stop losing money to fees.
          </h2>
          <Link
            href="/send"
            className="inline-block bg-white text-black px-8 md:px-12 py-4 md:py-5 rounded-full font-manrope text-lg md:text-xl font-bold hover:scale-105 transition-transform"
          >
            Send home now →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10 py-10 md:py-12 mt-auto">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center px-5 md:px-8 gap-5 md:gap-6">
          <p className="font-manrope text-xs tracking-widest text-gray-600 uppercase">
            © 2025 SWIFLO. All rights reserved.
          </p>
          <div className="flex gap-6 md:gap-8">
            {['Docs', 'GitHub', 'Twitter', 'Contact'].map(link => (
              <a key={link} href="#" className="font-manrope text-xs tracking-widest text-gray-600 hover:text-indigo-400 transition-colors uppercase">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
