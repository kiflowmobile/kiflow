/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary colors from Colors.ts
        primary: {
          DEFAULT: '#5774CD', // blue
          light: '#CCD7F1', // buttonBlue
        },
        accent: '#FEA419', // orange
        success: '#5EA500', // green
        error: '#C10007', // red
        pink: '#FF9BB3',

        // Neutral colors
        background: '#F4F4F4', // bg
        surface: '#FFFFFF', // white
        black: '#0A0A0A',
        gray: {
          DEFAULT: '#404040', // darkGray
          400: '#404040',
          100: '#F4F4F4',
        },
      },
      fontFamily: {
        primary: ['RobotoCondensed'],
        secondary: ['Inter'],
      },
      fontSize: {
        xxs: ['12px', { lineHeight: '16px' }],
        xs: ['14px', { lineHeight: '20px' }],
        sm: ['16px', { lineHeight: '24px' }],
        md: ['18px', { lineHeight: '28px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['32px', { lineHeight: '40px' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      spacing: {
        18: '72px',
        22: '88px',
      },
    },
  },
  plugins: [],
};
