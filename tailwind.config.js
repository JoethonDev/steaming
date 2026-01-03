/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // RTL-specific spacing utilities
      spacing: {
        'rtl-safe-4': '1rem',
        'rtl-safe-6': '1.5rem',
        'rtl-safe-8': '2rem',
      },
      // Arabic typography
      fontFamily: {
        'arabic': ['Segoe UI', 'Tahoma', 'Arial', 'Noto Sans Arabic', 'sans-serif'],
        'english': ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
};