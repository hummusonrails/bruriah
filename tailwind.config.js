/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#5736CD',
        'secondary': '#1E1E1E', 
        'accent': '#FFE900', 
      },
      fontFamily: {
        sans: ['Burbank Big Condensed', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}