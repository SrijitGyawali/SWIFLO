import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // existing tokens (used by send/fund/confirm/explorer pages)
        ink:       '#0B0D10',
        surface:   '#14171C',
        surface2:  '#1C2028',
        border:    '#2A2F38',
        txt:       '#F0F2F5',
        muted:     '#8B92A0',
        dim:       '#5A6270',
        accent:    '#5865F2',
        success:   '#00D084',
        warning:   '#FFB020',
        danger:    '#FF4757',
        highlight: '#FFD84D',
        // new design tokens (landing page)
        primary:                  '#b9c3ff',
        'on-primary':             '#0e2580',
        'on-surface-variant':     '#c5c5d4',
        'surface-container-low':  '#1b1b21',
        'surface-container':      '#1f1f25',
        'surface-container-high': '#292930',
        'surface-container-lowest': '#0d0e13',
        'outline-variant':        '#454652',
      },
      fontFamily: {
        sans:           ['Inter', 'system-ui', 'sans-serif'],
        mono:           ['GeistMono', 'monospace'],
        manrope:        ['Manrope', 'sans-serif'],
        'space-grotesk':['Space Grotesk', 'sans-serif'],
      },
      fontSize: {
        'h1': ['72px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '700' }],
        'h2': ['48px', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '600' }],
        'h3': ['32px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '600' }],
        'label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '600' }],
        'data-mono':  ['14px', { lineHeight: '1', letterSpacing: '0.02em', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
}

export default config
