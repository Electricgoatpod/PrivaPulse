/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        apple: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        berry: {
          950: '#200052',
          900: '#2d0066',
          800: '#3d0080',
          700: '#6b0099',
          600: '#A0055D',
          500: '#c4086e',
        },
      },
      animation: {
        'breathe': 'breathe 6s ease-in-out infinite',
        'pulse-stress': 'pulse-stress 1.5s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(0.85)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
        },
        'pulse-stress': {
          '0%, 100%': { opacity: '0.4', boxShadow: '0 0 60px 20px rgba(220, 38, 38, 0.3)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 80px 30px rgba(220, 38, 38, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
