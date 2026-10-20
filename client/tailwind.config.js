/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atelier: {
          blush: '#FFE8E5',
          'blush-soft': '#FFF2F0',
          'blush-subtle': '#FFF7F6',
          'blush-deep': '#F6D2CE',
          lavender: '#B9A2E8',
          'lavender-light': '#D6C8F2',
          'lavender-dark': '#8E6FD6',
          chartreuse: '#D7FF43',
          'chartreuse-hover': '#C5F028',
          tomato: '#F34F40',
          'tomato-hover': '#DC392A',
          cream: '#FAF8F3',
          ink: '#24211F',
          surface: '#FFFFFF',
          muted: '#736B63',
          border: '#E6E1D8'
        }
      },
      fontFamily: {
        display: ['Syne', 'Space Grotesk', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'organic': '2rem 1rem 2.5rem 1rem',
        'organic-alt': '1.5rem 2.5rem 1rem 2rem',
        'blob': '60% 40% 70% 30% / 40% 50% 60% 50%',
      },
      boxShadow: {
        'brutal': '4px 4px 0px #24211F',
        'brutal-lg': '8px 8px 0px #24211F',
        'brutal-xl': '12px 12px 0px #24211F',
        'glow-chartreuse': '0 0 25px rgba(215, 255, 67, 0.45)',
        'glow-tomato': '0 0 25px rgba(243, 79, 64, 0.35)',
        'glow-lavender': '0 0 30px rgba(185, 162, 232, 0.4)',
      }
    },
  },
  plugins: [],
}
