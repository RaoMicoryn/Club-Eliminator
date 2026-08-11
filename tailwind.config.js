/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
      },
      keyframes: {
        confetti: {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(340px) rotate(540deg)', opacity: '0' },
        },
        rain: {
          '0%': { transform: 'translateY(-10px)', opacity: '0.9' },
          '100%': { transform: 'translateY(340px)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        modalPop: {
          '0%': { transform: 'scale(0.92) translateY(8px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
      },
      animation: {
        confetti: 'confetti 2s ease-in forwards',
        rain: 'rain 2.2s linear forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(.34,1.56,.64,1)',
        'modal-pop': 'modalPop 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
