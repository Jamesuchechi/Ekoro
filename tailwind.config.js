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
        ekoro: {
          green: {
            DEFAULT: "#10B981", // Vibrant Emerald Green
            dark: "#065F46",
            light: "#A7F3D0",
          },
          gold: {
            DEFAULT: "#F59E0B", // Radiant Amber Gold
            dark: "#78350F",
            light: "#FDE68A",
          },
          blue: {
            DEFAULT: "#1D4ED8", // Sleek Royal Blue
            dark: "#1E3A8A",
            light: "#93C5FD",
          },
          dark: {
            DEFAULT: "#0F172A", // Deep Slate Blue/Dark Gray background
            paper: "#1E293B",
            muted: "#64748B",
          }
        }
      },
    },
  },
  plugins: [],
};
