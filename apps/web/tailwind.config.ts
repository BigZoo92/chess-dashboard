import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(36 12% 24%)',
        input: 'hsl(36 12% 24%)',
        ring: 'hsl(158 64% 52%)',
        background: 'hsl(143 18% 8%)',
        foreground: 'hsl(40 21% 91%)',
        primary: {
          DEFAULT: 'hsl(158 64% 52%)',
          foreground: 'hsl(143 22% 10%)'
        },
        secondary: {
          DEFAULT: 'hsl(143 14% 14%)',
          foreground: 'hsl(40 16% 88%)'
        },
        muted: {
          DEFAULT: 'hsl(143 12% 16%)',
          foreground: 'hsl(36 11% 65%)'
        },
        card: {
          DEFAULT: 'hsl(143 15% 11%)',
          foreground: 'hsl(40 21% 91%)'
        }
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem'
      }
    }
  },
  plugins: []
};

export default config;
