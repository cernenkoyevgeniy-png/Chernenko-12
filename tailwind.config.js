/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Unbounded"', '"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0a0710',
          900: '#120c1c',
          800: '#1c1428',
          700: '#2a1d3c',
        },
        spark: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb9a3c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        ember: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          '0%,100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sparkPulse: {
          '0%,100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.6))' },
          '50%': { transform: 'scale(1.06)', filter: 'drop-shadow(0 0 28px rgba(249,115,22,0.9))' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 4s ease-in-out infinite',
        shimmer: 'shimmer 8s linear infinite',
        rise: 'rise 0.8s cubic-bezier(0.22,1,0.36,1) both',
        sparkPulse: 'sparkPulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
