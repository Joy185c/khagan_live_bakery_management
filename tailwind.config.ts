import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          primary: "#176B45",
          dark: "#104C34",
          light: "#EAF5EE",
          bg: "#F7F9F8",
          text: "#172B22",
          danger: "#D94B4B",
          border: "#D1E2D7",
          muted: "#5C7567",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto-bengali)", "system-ui", "sans-serif"],
        bengali: ["var(--font-noto-bengali)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
