export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#EEF2FF",
          100: "#DBEAFE",
          400: "#3B6DB5",
          600: "#1B3A6B",
          800: "#0F2347",
          900: "#091629",
        },
        accent: {
          300: "#FFE566",
          400: "#FFD700",
          500: "#E6C200",
        },
        verde: {
          50:  "#E1F5EE",
          400: "#1D9E75",
          600: "#0F6E56",
        },
      },
    },
  },
  plugins: [],
}