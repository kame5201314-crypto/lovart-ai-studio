/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'canvas-bg': '#1a1a2e',
        'panel-bg': '#16213e',
        'accent': '#e94560',
        'accent-hover': '#ff6b6b',
      }
    },
  },
  plugins: [],
}
