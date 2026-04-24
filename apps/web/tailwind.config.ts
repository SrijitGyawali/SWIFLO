import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['GeistMono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
