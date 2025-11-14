/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      colors: {
        slate: {
          950: "#0c0f17",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59, 130, 246, 0.2)",
        panel:
          "0 10px 40px rgba(15, 23, 42, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.03)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
        pulseSoft: "pulseSoft 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
