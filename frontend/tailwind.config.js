/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "Satoshi", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          900: "#0B0B0C",
          800: "#111113",
          700: "#1A1A1D",
        },
        shell: {
          50: "#F9FAFB",
        },
      },
      boxShadow: {
        float: "0 24px 80px rgba(15, 23, 42, 0.12)",
        subtle: "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};
