import type { Config } from 'tailwindcss';

// Design tokens per SRS §8: primary indigo, violet, green, amber, red;
// Plus Jakarta Sans body font; card-based, rounded, clean SaaS aesthetic.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: { DEFAULT: '#5B4FE8', 50: '#F1F0FD', 100: '#E3E1FB' },
        violet: { DEFAULT: '#7C3AED' },
        success: { DEFAULT: '#10B981' },
        amber: { DEFAULT: '#F59E0B' },
        danger: { DEFAULT: '#EF4444' },
        ink: '#14121F',
        canvas: '#FAFAFC',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,18,31,0.04), 0 8px 24px -12px rgba(20,18,31,0.12)',
      },
    },
  },
  plugins: [],
};
export default config;
