/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#0F1923',
        'sidebar-hover': '#1a2840',
        'ms-blue': '#0078D4',
        'ms-blue-dark': '#005a9e',
        'ms-blue-light': '#2899f5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
