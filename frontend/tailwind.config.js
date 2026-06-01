/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Shield branding colors
        shield: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        threat: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#D97706',
          low: '#65A30D',
          safe: '#16A34A',
        },
        surface: {
          900: '#0a0e1a',
          800: '#111827',
          700: '#1a2035',
          600: '#242d45',
          500: '#2e3a56',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-up': 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'threat-flash': 'threatFlash 0.6s ease-out',
        'counter-up': 'counterUp 0.3s ease-out',
        'shield-pulse': 'shieldPulse 2s infinite',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.6)' },
        },
        threatFlash: {
          '0%': { backgroundColor: 'rgba(220, 38, 38, 0.3)' },
          '50%': { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
          '100%': { backgroundColor: 'transparent' },
        },
        counterUp: {
          '0%': { transform: 'scale(1.3)', color: '#38bdf8' },
          '100%': { transform: 'scale(1)' },
        },
        shieldPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 3px rgba(22, 163, 74, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 12px rgba(22, 163, 74, 0.8))' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
