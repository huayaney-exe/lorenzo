import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'rojo': '#960800',
        'rojo-dark': '#7A0600',
        'bone': '#F2EDE8',
        'bone-dark': '#E5DED7',
        'asphalt': '#1A1A1A',
        'cement': '#3A3A3A',
        'mid-gray': '#8A8A8A',
        'blue-tape': '#2557D6',
      },
      fontFamily: {
        grotesk: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      borderRadius: {
        'brutal': '2px',
      },
      letterSpacing: {
        'display': '0.08em',
        'wide-display': '0.12em',
      },
    },
  },
  plugins: [],
}

export default config
