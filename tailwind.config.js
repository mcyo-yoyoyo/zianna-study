/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        macaron: {
          mint: "#A8E6CF",
          cream: "#FFF9E6",
          peach: "#FFDAC1",
          lavender: "#C7CEEA",
          sky: "#B4E7FF",
          rose: "#FFB7C5",
        },
      },
      fontFamily: {
        display: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
