/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'grotesk': ['FK Grotesk', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'rique': ['Righteous', 'cursive'],
        'lexend': ['Lexend Deca', 'sans-serif'],
      },
      colors: {
        'cream': {
          50: '#fdfbf7',
          100: '#f8f3e9',
          200: '#f3ecd8',
          300: '#ede4c7',
          400: '#e7dcb6',
        },
        'brown': {
          300: '#a07856',
          400: '#8b6240',
          500: '#6b4423',
          600: '#5a3a1f',
          700: '#4a2f19',
          800: '#3a2414',
        },
      },
    },
  },
  plugins: [],
}
