/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          DEFAULT: "#75A743",
          50: "#D1E5BD",
          100: "#C7DFAE",
          200: "#B2D391",
          300: "#9EC774",
          400: "#89BC57",
          500: "#75A743",
          600: "#597F33",
          700: "#3D5723",
          800: "#212F13",
          900: "#050703",
          950: "#000000",
        },
      },
    },
  },
  plugins: [],
};
