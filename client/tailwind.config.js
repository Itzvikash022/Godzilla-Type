/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#323437',
          secondary: '#2c2e31',
        },
        main: {
          DEFAULT: '#e2b714',
          sub: '#646669',
        },
        text: {
          primary: '#d1d0c5',
          secondary: '#646669',
        },
        error: '#ca4754',
        success: '#e2b714', // Monkeytype often uses current color for correct
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
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
