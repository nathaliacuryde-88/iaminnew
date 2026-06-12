/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        raise: "rgb(var(--c-raise) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        dim: "rgb(var(--c-dim) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        accent: "#8A6CFF",
        accent2: "#B98AFF",
        mint: "#3EE6A0",
        coral: "#FF6A5C",
        gold: "#FFC65C",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.375rem",
        xl3: "1.75rem",
      },
    },
  },
  plugins: [],
};
