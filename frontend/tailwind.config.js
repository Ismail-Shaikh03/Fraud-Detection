/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'approved': '#10b981',
        'monitor': '#f59e0b',
        'flagged': '#ef4444',
      },
    },
  },
  plugins: [],
}
