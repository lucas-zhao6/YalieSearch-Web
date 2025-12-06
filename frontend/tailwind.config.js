/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Yale Blue inspired palette
        arc: {
          teal: '#00356b',
          'teal-dark': '#002a55',
          'teal-light': '#286dc0',
          mint: '#a8c5e8',
          'mint-light': '#c8ddf4',
          coral: '#e8a598',
          'coral-light': '#f0c4ba',
          slate: '#1a2a3a',
          'slate-light': '#4a5a6a',
          'slate-muted': '#7a8a9a',
        },
        // Background colors
        bg: {
          light: '#e8f0f8',
          main: '#dce8f4',
          accent: '#cddff0',
        },
        // Glass colors
        glass: {
          white: 'rgba(255, 255, 255, 0.7)',
          'white-light': 'rgba(255, 255, 255, 0.5)',
          border: 'rgba(255, 255, 255, 0.8)',
        },
        // Yale colors
        yale: {
          blue: '#00356b',
          'blue-light': '#286dc0',
          'blue-dark': '#002a55',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'glass-hover': '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'button': '0 4px 14px rgba(0, 53, 107, 0.3), 0 2px 6px rgba(0, 53, 107, 0.2)',
        'button-hover': '0 6px 20px rgba(0, 53, 107, 0.35), 0 3px 8px rgba(0, 53, 107, 0.25)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-sm': '10px',
        'glass-lg': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
