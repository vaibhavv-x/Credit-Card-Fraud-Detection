/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#090D1A',
        darkCard: 'rgba(15, 22, 42, 0.7)',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        brandPurple: '#8B5CF6',
        brandBlue: '#3B82F6',
        brandPink: '#EC4899',
        neonGreen: '#10B981',
        neonRed: '#EF4444',
        neonYellow: '#F59E0B',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        glowPurple: '0 0 15px rgba(139, 92, 246, 0.4)',
        glowBlue: '0 0 15px rgba(59, 130, 246, 0.4)',
        glowRed: '0 0 15px rgba(239, 68, 68, 0.4)',
      },
      backdropBlur: {
        glass: '12px',
      }
    },
  },
  plugins: [],
}
