/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Deep Forest Green
        primary: {
          50:  '#f0faf0',
          100: '#dcf5dc',
          200: '#b9eab9',
          300: '#85d685',
          400: '#4fbc4f',
          500: '#2a9d2a',  // main green
          600: '#1e7c1e',
          700: '#186018',
          800: '#144d14',
          900: '#0f3d0f',
          DEFAULT: '#1e7c1e',
          foreground: '#ffffff',
        },
        // Accent: Warm Saffron/Gold
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // main amber
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#f59e0b',
          foreground: '#1a1a1a',
        },
        // Background: Soft Cream
        background: '#faf8f3',
        surface:    '#ffffff',
        // Text
        foreground: '#1a1a1a',
        muted:      '#6b7280',
        'muted-foreground': '#9ca3af',
        // Border
        border:     '#e5e0d5',
        // Status
        success:  '#16a34a',
        warning:  '#d97706',
        error:    '#dc2626',
        info:     '#2563eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Senior-friendly scale — base is 18px
        'xs':   ['14px', { lineHeight: '1.5' }],
        'sm':   ['16px', { lineHeight: '1.5' }],
        'base': ['18px', { lineHeight: '1.6' }],
        'lg':   ['20px', { lineHeight: '1.6' }],
        'xl':   ['24px', { lineHeight: '1.4' }],
        '2xl':  ['28px', { lineHeight: '1.3' }],
        '3xl':  ['34px', { lineHeight: '1.2' }],
        '4xl':  ['42px', { lineHeight: '1.1' }],
        '5xl':  ['52px', { lineHeight: '1.05' }],
      },
      spacing: {
        // Touch-friendly
        'touch': '44px',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card':  '0 2px 12px rgba(0,0,0,0.08)',
        'float': '0 4px 24px rgba(0,0,0,0.12)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
