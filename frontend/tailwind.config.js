/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0a0f',
          2: '#111118',
          3: '#16161f',
        },
        card: {
          DEFAULT: '#1c1c27',
          2: '#22222f',
        },
        border: {
          DEFAULT: '#2a2a3a',
          2: '#3a3a50',
        },
        accent: {
          DEFAULT: '#7c6ff7',
          2: '#a89cf5',
          3: '#c4b8ff',
        },
        gold: '#f5c542',
        success: '#3de89e',
        danger: '#f55a5a',
        info: '#5ab4f5',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
