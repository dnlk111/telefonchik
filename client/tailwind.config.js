/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          start: "#1F1633",
          end: "#2A1F44",
        },
        neon: {
          purple: "#C026D3",
          pink: "#FF00AA",
          green: "#00FFAA",
        },
      },
      fontFamily: {
        game: ['"Burbank Big Condensed"', "Impact", "Haettenschweiler", "sans-serif"],
      },
      borderRadius: {
        btn: "12px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(192, 38, 211, 0.5)",
        glowPink: "0 0 20px rgba(255, 0, 170, 0.5)",
        glowGreen: "0 0 20px rgba(0, 255, 170, 0.5)",
      },
    },
  },
  plugins: [],
};
