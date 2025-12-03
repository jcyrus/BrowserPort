/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'widget-bg': 'rgba(17, 24, 39, 0.95)',
        'widget-border': 'rgba(75, 85, 99, 0.3)',
      },
      backdropBlur: {
        'widget': '20px',
      },
      boxShadow: {
        'widget': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
