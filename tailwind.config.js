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
      maxWidth: {
        '5xl': '64rem', // Ensure this matches Figma's max-width
      },
      colors: {
        white: {
          DEFAULT: '#FFFFFF',
          15: 'rgba(255, 255, 255, 0.15)',
          3: 'rgba(255, 255, 255, 0.03)',
        },
        slate: {
          50: '#F8FAFC',
          300: '#CBD5E1',
        },
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [
    require('daisyui')
  ],
  daisyui: {
    themes: ["light"], // This ensures DaisyUI doesn't override our custom styles
    base: false, // This prevents DaisyUI from injecting its base styles
    styled: true,
    utils: true,
  },
} 