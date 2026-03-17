/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens will be added here
        // Using CSS custom properties for dynamic values
      },
      spacing: {
        // Design tokens will be added here
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Will be populated from design tokens
      },
      borderRadius: {
        // Will be populated from design tokens
      },
    },
  },
  plugins: [],
}
