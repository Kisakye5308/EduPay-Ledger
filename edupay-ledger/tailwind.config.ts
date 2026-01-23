import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1b2b4b',
        'emerald-soft': '#2D9C6F',
        'background-light': '#f6f7f8',
        'background-dark': '#14171e',
        'border-light': '#d5d9e2',
        'status-green': '#10b981',
        'status-yellow': '#f59e0b',
        'status-red': '#ef4444',
        'accent-success': '#07883b',
        'accent-error': '#e73908',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        'severity-high': '#ef4444',
        'severity-medium': '#f97316',
        'severity-low': '#eab308',
      },
      fontFamily: {
        display: ['Lexend', 'sans-serif'],
        sans: ['Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
