const theme = require('tailwindcss/defaultTheme')
const backup = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

module.exports = {
  purge: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ['"Inter var"', backup, 'sans-serif']
    },
    extend: {
      minWidth: theme.spacing
    },
  },
  variants: {
    extend: {
      textColor: ['group-focus', 'disabled']
    },
  },
  plugins: [],
}
