/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        body: ["Sora", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        // Ekoro surface palette
        "ek-void": "#080808",
        "ek-ink": "#0f0f0f",
        "ek-surface": "#161616",
        "ek-raised": "#1e1e1e",
        "ek-lifted": "#262626",

        // Brand
        "ek-gold": "#c9a84c",
        "ek-green": "#4caf7d",
        "ek-red": "#e05555",
        "ek-blue": "#5b8dee",

        // Text
        "ek-primary": "#f0ede8",
        "ek-secondary": "rgba(240, 237, 232, 0.55)",
        "ek-tertiary": "rgba(240, 237, 232, 0.3)",
        "ek-muted": "rgba(240, 237, 232, 0.18)",

        // Legacy — keep so old Tailwind classes still resolve
        ekoro: {
          green: {
            DEFAULT: "#4caf7d",
            dark: "#065F46",
            light: "#A7F3D0",
          },
          gold: {
            DEFAULT: "#c9a84c",
            dark: "#78350F",
            light: "#FDE68A",
          },
          blue: {
            DEFAULT: "#5b8dee",
            dark: "#1E3A8A",
            light: "#93C5FD",
          },
          dark: {
            DEFAULT: "#080808",
            paper: "#161616",
            muted: "rgba(240, 237, 232, 0.3)",
          },
        },
      },
      animation: {
        "spin-slow": "spin 4s linear infinite",
        "pulse-dot": "pulseDot 2s ease infinite",
        "fade-up": "fadeUp 0.5s var(--ease-out-expo) both",
        "shimmer": "shimmer 1.5s infinite",
        "float": "float 6s ease infinite",
        "wave-bar": "waveBar 1s ease-in-out infinite alternate",
        "ticker": "tickerMove 20s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.8)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        waveBar: {
          "0%": { transform: "scaleY(0.3)" },
          "100%": { transform: "scaleY(1)" },
        },
        tickerMove: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out": "cubic-bezier(0.45, 0, 0.55, 1)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};
