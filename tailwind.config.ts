import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2bee79",
        "primary-dark": "#1fa855",
        "background-light": "#f6f8f7",
        "background-dark": "#102217",
        "surface-dark": "#162e21",
        "surface-highlight": "#1a3526",
        "card-dark": "#1c3024",
        "card-highlight": "#234832",
        "border-green": "#234832",
        "border-green-light": "#326747",
        "text-dim": "#92c9a8",
      },
      fontFamily: {
        display: ["Spline Sans", "Noto Sans KR", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;

