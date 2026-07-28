/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        oneills: {
          50: '#eafbf1',
          100: '#c9f2d9',
          200: '#93e4b3',
          300: '#5ccf8d',
          400: '#2fb86c',
          500: '#149c53',
          600: '#0d7d43',
          700: '#0b5d34',
          800: '#0a4a2a',
          900: '#073820',
        },
        gold: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe58a',
          300: '#ffd452',
          400: '#ffc22e',
          500: '#f5b700',
          600: '#d69e00',
          700: '#a87b00',
        },
      },
    },
  },
  plugins: [],
};
