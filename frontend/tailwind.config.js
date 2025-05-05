/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#E9ECEF',
          100: '#D4D9DF',
          200: '#A9B4BF',
          300: '#7E8E9F',
          400: '#53697F',
          500: '#2C3E50', // Primary Navy
          600: '#233240',
          700: '#1A2530',
          800: '#111920',
          900: '#080C10',
        },
        secondary: {
          50: '#E8F7F0',
          100: '#D1EEE2',
          200: '#A3DEC5',
          300: '#75CDA7',
          400: '#4BBD8A',
          500: '#27AE60', // Environmental Green
          600: '#1F8B4D',
          700: '#17683A',
          800: '#0F4526',
          900: '#072213',
        },
        accent: {
          50: '#FEF9E7',
          100: '#FCF2CE',
          200: '#F9E59D',
          300: '#F5D96C',
          400: '#F2CC3B',
          500: '#F1C40F', // Alert Yellow
          600: '#C19D0C',
          700: '#917609',
          800: '#604E06',
          900: '#302703',
        },
        neutral: {
          50: '#FAFBFC',
          100: '#F4F7F8',
          200: '#ECF0F1', // Light Cloud
          300: '#DEE4E6',
          400: '#C5CED1',
          500: '#A8B5BA',
          600: '#8A9AA1',
          700: '#6D8088',
          800: '#546570',
          900: '#3C4A52',
        },
        dark: '#2C3E50',
        success: '#2ECC71',
        warning: '#F39C12',
        error: '#E74C3C',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.1)',
        elevated: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};