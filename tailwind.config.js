/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'talkart-bg': '#1a1a2e',
        'talkart-surface': '#16213e',
        'talkart-canvas': '#ffffff',
        'talkart-primary': '#7c5cfc',
        'talkart-success': '#4ade80',
        'talkart-warning': '#fbbf24',
        'talkart-error': '#f87171',
      },
    },
  },
  plugins: [],
};
