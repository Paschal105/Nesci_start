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
        // Change the app's look here — every component uses these names
        brand: "#D9532C", // terracotta — buttons, headings, dates
        accent: "#0E8A7E", // teal — links, hovers, "free" tags
        alert: "#BE123C", // error messages
        cream: "#FFF8F0", // page background
        surface: "#FFFFFF", // cards and panels
        sand: "#FBEFE3", // inputs, selected and hovered items
        line: "#EADFD3", // borders and dividers
        ink: "#2B2118", // main text
        muted: "#7A6B5D", // secondary text
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
