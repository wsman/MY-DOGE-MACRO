/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System Colors from Frontend-Layout.html
        app: {
          primary: '#0f1419',
          secondary: '#1a1f26',
          tertiary: '#242b33',
          border: '#38444d',
          success: '#00c853',
          warning: '#ff9800',
          danger: '#f44336',
        },
        text: {
          primary: '#e7e9ea',
          secondary: '#8b98a5',
        },
        accent: {
          DEFAULT: '#00d4aa',
          hover: 'rgba(0, 212, 170, 0.1)',
        },
        // Legacy colors (keeping for compatibility during migration)
        'quant-green': '#00ff88',
        'quant-blue': '#0088ff',
        'quant-purple': '#aa00ff',
        'quant-dark': '#0a0a0a',
        'quant-gray': '#1a1a1a',
      },
      fontFamily: {
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      gridTemplateRows: {
        'layout': '48px 1fr 32px',
      },
      gridTemplateColumns: {
        'layout': '220px 1fr 320px',
      }
    },
  },
  plugins: [],
}
