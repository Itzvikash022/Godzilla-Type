/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1a1a2e',
          secondary: '#16213e',
          card: '#1e2746',
          hover: '#253255',
        },
        text: {
          primary: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#475569',
          correct: '#646669',
        },
        accent: {
          primary: '#e2b714',
          secondary: '#d99e0b',
          glow: 'rgba(226, 183, 20, 0.15)',
        },
        error: '#ca4754',
        success: '#4ade80',
        team: {
          red: '#ef4444',
          'red-light': '#fecaca',
          blue: '#3b82f6',
          'blue-light': '#bfdbfe',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'cursor-blink': 'blink 1s step-end infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'progress-fill': 'progressFill 0.3s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(226, 183, 20, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(226, 183, 20, 0.4)' },
        },
        progressFill: {
          from: { width: '0%' },
          to: { width: 'var(--progress)' },
        },
      },
    },
  },
  plugins: [],
};
