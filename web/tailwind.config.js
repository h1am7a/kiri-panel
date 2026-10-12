/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          950: '#060911',
          900: '#0B0F19',
          850: '#0F1626',
          800: '#151E34',
          700: '#1E2C4A',
          600: '#2A3C63',
        },
        cyber: {
          cyan: '#00F0FF',
          pink: '#FF2A85',
          purple: '#C084FC',
          neonYellow: '#FACC15',
          neonGreen: '#10B981',
          dimCyan: 'rgba(0, 240, 255, 0.15)',
          dimPink: 'rgba(255, 42, 133, 0.15)',
          dimPurple: 'rgba(192, 132, 252, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Nunito', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.4), 0 0 30px rgba(0, 240, 255, 0.15)',
        'neon-pink': '0 0 15px rgba(255, 42, 133, 0.4), 0 0 30px rgba(255, 42, 133, 0.15)',
        'neon-purple': '0 0 15px rgba(192, 132, 252, 0.4), 0 0 30px rgba(192, 132, 252, 0.15)',
        'hud': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          'from': { opacity: '0.6' },
          'to': { opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
}
