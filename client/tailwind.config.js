/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'quant-green': '#00ff88',
        'quant-blue': '#0088ff',
        'quant-purple': '#aa00ff',
        'quant-dark': '#0a0a0a',
        'quant-gray': '#1a1a1a',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}