module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'scendro-blue': '#3b82f6',
        'scendro-purple': '#9c5ef4',
        'scendro-pink': '#ff6c88',
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease-in-out infinite',
        'pulse-gradient': 'pulse-gradient 5s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        },
        'pulse-gradient': {
          '0%': {
            transform: 'scale(1)',
            opacity: 0.7,
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: 1,
          },
          '100%': {
            transform: 'scale(1)',
            opacity: 0.7,
          },
        },
      },
      boxShadow: {
        'neon': '0 0 15px rgba(255, 255, 255, 0.5)',
      },
      spacing: {
        '72': '18rem',
      },
    },
  },
  plugins: [],
}
