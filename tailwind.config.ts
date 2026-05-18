import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        turf: {
          950: '#040d06',
          900: '#0a1a0e',
          800: '#0f2314',
          700: '#153019',
          600: '#1a3d1f',
        },
        flag: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          light: '#4ade80',
          glow: '#86efac',
        },
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-green': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
