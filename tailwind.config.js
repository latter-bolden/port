const theme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const backup = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

module.exports = {
  purge: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter var"', backup, 'sans-serif']
      },
      colors: {
        gray: colors.gray
      },
      minWidth: {
        ...theme.spacing,
        ...theme.maxWidth,
        '22': '5.5rem'
      },
      height: {
        '8.5': '2.125rem'
      }
    },
  },
  variants: {
    extend: {
      textColor: ['group-focus', 'disabled'],
      borderColor: ['disabled'],
      cursor: ['disabled']
    },
  },
  plugins: [],
}
