import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './popup.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        deployhq: {
          50: '#f3f1ff',
          100: '#e4dfff',
          200: '#a8b2fa',
          300: '#9ea8f8',
          400: '#7b6edb',
          500: '#5740cf',
          600: '#5740cf',
          700: '#4f3fa2',
          800: '#3d3080',
          900: '#150547',
          950: '#0f0826',
        },
        shamrock: {
          50: '#DEF7EF',
          100: '#BEEFDE',
          200: '#81DFC0',
          300: '#40cf9f',
          400: '#2FBB8D',
          500: '#279B74',
          600: '#1F7A5C',
        },
        success: '#33AD60',
        danger: '#EE4949',
        warning: '#F3AE3F',
      },
    },
  },
  plugins: [],
};

export default config;
