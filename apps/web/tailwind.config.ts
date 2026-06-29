import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf9',
          100: '#dcfdf2',
          500: '#1D9E75',
          600: '#178a64',
          700: '#116e50',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
