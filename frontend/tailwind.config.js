/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#0F0F13',
        surface: '#1A1A24',
        primary: '#6366F1',
        secondary: '#10B981',
        danger: '#F43F5E',
        text: '#F3F4F6',
        textMuted: '#9CA3AF',
      },
    },
  },
  plugins: [],
}
