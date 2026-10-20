import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-purple": "#a855f7",
        "neon-cyan": "#06b6d4",
        "neon-pink": "#ec4899",
        "bg-primary": "#0a0a0f",
        "bg-secondary": "#10101a",
        "bg-card": "#14141f",
        border: "#1f1f2e",
        "text-primary": "#f0f0ff",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
