/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        portal: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          navy: '#0F172A',
          blue: '#1E3A8A',
          primary: '#2563EB',
          accent: '#0284C7',
          danger: '#DC2626',
          warning: '#D97706',
          success: '#059669',
          muted: '#64748B'
        }
      }
    },
  },
  plugins: [],
}
