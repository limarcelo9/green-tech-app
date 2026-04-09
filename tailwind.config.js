/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        outfit:  ['Outfit', 'sans-serif'],
      },
      colors: {
        geo: {
          950: '#04050b',
          900: '#07090f',
          850: '#0c0f1a',
          800: '#111420',
          750: '#161b2a',
          700: '#1c2232',
          650: '#222a3e',
          600: '#2a3450',
        },
        brand: {
          DEFAULT: '#10b981',
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        thermal: {
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        hydric: {
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        social: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      boxShadow: {
        'glass':      '0 8px 32px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-md':   '0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card':       '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
        'card-dark':  '0 1px 2px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.25)',
        'brand':      '0 0 0 1px rgba(16,185,129,0.25), 0 4px 24px rgba(16,185,129,0.12)',
        'brand-glow': '0 0 32px rgba(16,185,129,0.20)',
        'thermal':    '0 0 0 1px rgba(239,68,68,0.2), 0 4px 20px rgba(239,68,68,0.10)',
        'hydric':     '0 0 0 1px rgba(59,130,246,0.2), 0 4px 20px rgba(59,130,246,0.10)',
      },
      backdropBlur: {
        'xs':  '4px',
        '3xl': '64px',
        '4xl': '96px',
      },
      animation: {
        'fade-in':    'gtFadeIn 0.5s ease-out both',
        'slide-up':   'gtSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-brand':'gtPulseBrand 3s ease-in-out infinite',
      },
      keyframes: {
        gtFadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        gtSlideUp:   { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        gtPulseBrand:{ '0%, 100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0)' }, '50%': { boxShadow: '0 0 0 8px rgba(16,185,129,0.10)' } },
      },
    },
  },
  plugins: [],
}
