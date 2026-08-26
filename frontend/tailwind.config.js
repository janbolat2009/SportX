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
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Athletic Emerald
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        surface: {
          bg: '#09090b',       // Deep neutral zinc black
          card: '#141416',     // Card surface
          cardHover: '#1c1c1f',// Card hover
          subtle: '#202024',   // Elevated elements
          border: '#27272a',   // Subtle clean border
          borderLight: '#3f3f46'
        },
        status: {
          good: '#22c55e',     // Optimal form
          attention: '#f59e0b',// Form needs adjustment
          deviation: '#ef4444',// Significant technique deviation
          info: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      screens: {
        'xs': '375px',
      }
    },
  },
  plugins: [],
}
