import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/*
 * Brand theme derived from the project logo:
 *   cross   — sky #22A7DB → navy #173D63   (primary)
 *   leaves  — green #2E9440, lime #7DCB45  (secondary / accent)
 * Text-on-colour pairs meet WCAG AA (≥ 4.5:1) against white.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          sky: '#22A7DB',
          blue: '#1B74AC',
          navy: '#173D63',
          green: '#2E9440',
          'green-dark': '#23803A',
          lime: '#7DCB45',
        },
        background: '#F5F9FB',
        'on-background': '#0F2233',
        surface: '#F5F9FB',
        'surface-dim': '#D3E1EA',
        'surface-bright': '#F5F9FB',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#EEF5F9',
        'surface-container': '#E3EEF5',
        'surface-container-high': '#D8E8F1',
        'surface-container-highest': '#CBDFEB',
        'surface-variant': '#CBDFEB',
        'surface-tint': '#1B74AC',
        'on-surface': '#0F2233',
        'on-surface-variant': '#43525F',
        'inverse-surface': '#1E3344',
        'inverse-on-surface': '#E8F2F8',
        'inverse-primary': '#8FCBEB',
        outline: '#6F7D89',
        'outline-variant': '#C3CDD6',

        primary: '#16466E',
        'on-primary': '#FFFFFF',
        'primary-container': '#1B74AC',
        'on-primary-container': '#CFE9F7',
        'primary-fixed': '#DCEEF8',
        'primary-fixed-dim': '#9DD0EC',
        'on-primary-fixed': '#06263D',
        'on-primary-fixed-variant': '#134E78',

        secondary: '#23803A',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#C8EBC4',
        'on-secondary-container': '#145C25',
        'secondary-fixed': '#D6F2C9',
        'secondary-fixed-dim': '#7DCB45',
        'on-secondary-fixed': '#0B3A16',
        'on-secondary-fixed-variant': '#1B6B30',

        tertiary: '#5AA51E',
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#E4F5D6',
        'on-tertiary-container': '#2F5E0C',

        error: '#BA1A1A',
        'on-error': '#FFFFFF',
        'error-container': '#FFDAD6',
        'on-error-container': '#93000A',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #173D63 0%, #1B74AC 55%, #22A7DB 100%)',
        'leaf-gradient': 'linear-gradient(135deg, #23803A 0%, #2E9440 50%, #7DCB45 100%)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'space-2xs': '0.125rem',
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '0.75rem',
        'space-lg': '1rem',
        'space-xl': '1.5rem',
        'space-2xl': '2rem',
        gutter: '1rem',
        'gutter-compact': '0.5rem',
        margin: '1.5rem',
        'margin-compact': '1rem',
      },
      fontFamily: {
        'display-lg': ['Inter'],
        'headline-xl': ['Inter'],
        'headline-lg': ['Inter'],
        'headline-md': ['Inter'],
        'headline-sm': ['Inter'],
        'body-lg': ['Inter'],
        'body-md': ['Inter'],
        'body-sm': ['Inter'],
        'label-lg': ['Inter'],
        'label-md': ['Inter'],
        'label-sm': ['Inter'],
        'data-mono': ['JetBrains Mono'],
        'data-mono-sm': ['JetBrains Mono'],
      },
      fontSize: {
        'display-lg': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'headline-xl': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'headline-lg': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'headline-sm': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        'body-lg': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-md': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'label-lg': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'label-md': ['11px', { lineHeight: '14px', fontWeight: '600' }],
        'label-sm': ['10px', { lineHeight: '12px', fontWeight: '600' }],
        'data-mono': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'data-mono-sm': ['11px', { lineHeight: '14px', fontWeight: '400' }],
      },
    },
  },
  plugins: [forms, containerQueries],
};
