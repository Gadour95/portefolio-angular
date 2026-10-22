const PrimeUI = require('tailwindcss-primeui');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],

  darkMode: ['selector', '[class~="app-dark"]'],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', 'sans-serif']
      },

      boxShadow: {
        premium: '0 12px 40px -16px rgb(15 23 42 / 0.18)'
      }
    }
  },

  plugins: [PrimeUI]
};