/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm Neutral Palette (Sophisticated, not blue/red)
        surface: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // Muted Accent (Soft Violet - premium feel)
        accent: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#A78BFA',
          500: '#8B7EC8',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Muted Success (Sage Green)
        success: {
          light: '#9DB8A3',
          DEFAULT: '#7C9A82',
          dark: '#5E7A64',
        },
        // Muted Warning (Warm Amber)
        warning: {
          light: '#DBC07A',
          DEFAULT: '#C9A962',
          dark: '#A8894A',
        },
        // Muted Error (Dusty Rose - not aggressive red)
        error: {
          light: '#CFA0A0',
          DEFAULT: '#B87A7A',
          dark: '#965C5C',
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 2.5s ease-in-out infinite',
        'recording-ring': 'recording-ring 1.5s ease-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.4' },
          '50%': { transform: 'scale(1.08)', opacity: '0.7' },
        },
        'recording-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
      boxShadow: {
        'soft-sm': '0 1px 2px rgba(28, 25, 23, 0.04)',
        'soft-md': '0 4px 6px -1px rgba(28, 25, 23, 0.06), 0 2px 4px -1px rgba(28, 25, 23, 0.04)',
        'soft-lg': '0 10px 15px -3px rgba(28, 25, 23, 0.06), 0 4px 6px -2px rgba(28, 25, 23, 0.03)',
      },
    },
  },
  plugins: [],
};
