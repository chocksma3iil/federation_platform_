/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,scss}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        accent: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
          400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
          800: '#9a3412', 900: '#7c2d12',
        },
        success:  { DEFAULT: '#22c55e', light: '#bbf7d0', dark: '#15803d' },
        warning:  { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#b45309' },
        danger:   { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#b91c1c' },
        info:     { DEFAULT: '#06b6d4', light: '#cffafe', dark: '#0e7490' },
        surface: {
          50:  'rgb(var(--surface-50) / <alpha-value>)',
          100: 'rgb(var(--surface-100) / <alpha-value>)',
          200: 'rgb(var(--surface-200) / <alpha-value>)',
          300: 'rgb(var(--surface-300) / <alpha-value>)',
          400: 'rgb(var(--surface-400) / <alpha-value>)',
          500: 'rgb(var(--surface-500) / <alpha-value>)',
          600: 'rgb(var(--surface-600) / <alpha-value>)',
          700: 'rgb(var(--surface-700) / <alpha-value>)',
          800: 'rgb(var(--surface-800) / <alpha-value>)',
          900: 'rgb(var(--surface-900) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem', '68': '17rem', '72': '18rem',
        '84': '21rem',  '88': '22rem', '128': '32rem',
      },
      width: {
        sidebar: '260px',
        'sidebar-collapsed': '64px',
      },
      boxShadow: {
        card:     '0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1)',
        'card-md':'0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1)',
        navbar:   '0 1px 0 0 rgb(0 0 0 / .08)',
      },
      keyframes: {
        'slide-in-left': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        'fade-in':       { '0%': { opacity: '0' },   '100%': { opacity: '1' } },
        'spin-slow':     { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        'slide-in-left': 'slide-in-left 250ms ease-out',
        'fade-in':       'fade-in 200ms ease-in',
        'spin-slow':     'spin-slow 2s linear infinite',
      },
      screens: { 'xs': '480px' },
    },
  },
  plugins: [],
  safelist: [
    { pattern: /bg-(primary|accent|success|warning|danger|info)-(100|200)/ },
    { pattern: /text-(primary|accent|success|warning|danger|info)-(700|800)/ },
  ],
};
