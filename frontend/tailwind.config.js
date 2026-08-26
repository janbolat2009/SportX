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
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        cyber: {
          cyan: '#06b6d4',
          neon: '#10b981',
          electric: '#3b82f6',
          amber: '#f59e0b',
          rose: '#f43f5e'
        },
        dark: {
          bg: '#0b0f19',
          card: '#111827',
          cardHover: '#1f2937',
          border: '#374151'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
