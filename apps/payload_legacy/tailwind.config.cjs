/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/blocks/**/*.{js,ts,jsx,tsx}',
    // Include the packages/ui components
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Extend with Payload theme variables for better integration
        // These will map to Payload's CSS variables
        error: 'var(--theme-error-500)',
        success: 'var(--theme-success-500)',
        warning: 'var(--theme-warning-500)',
        background: 'var(--theme-elevation-0)',
        foreground: 'var(--theme-text)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
