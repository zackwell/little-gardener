/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./index.tsx", "./main.tsx", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"PingFang TC"',
          '"PingFang HK"',
          '"Microsoft YaHei"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
