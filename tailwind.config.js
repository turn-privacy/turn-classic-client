/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dm': ['DM Sans', 'serif'],
        'raleway': ['Raleway', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'main': "url('/bg-main.png')",
      },
    },
  },
  plugins: [
    require('daisyui')
  ],
} 