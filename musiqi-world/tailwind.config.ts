import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg)",
        elev: "var(--elev)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        gold: "var(--gold)",
        moss: "var(--moss)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
        arabic: ["var(--font-arabic)", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        lift: "0 18px 50px rgba(0,0,0,.18)",
      },
    },
  },
  plugins: [],
};

export default config;
