/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
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
        // Goal journey tokens
        gold: '#D4B26A',
        emerald: '#48C79A',
        // Light mode
        bgLight: '#F6F1E7',
        cardLight: '#FFFFFF',
        surfaceLight: '#FBF7EE',
        textLight: '#211C13',
        subLight: '#726A57',
        // Dark mode
        bgDark: '#0C0E14',
        cardDark: '#161923',
        surfaceDark: '#1B2032',
        textDark: '#EDEAE1',
        subDark: '#9A98A6',
      },
    },
  },
  plugins: [],
}
