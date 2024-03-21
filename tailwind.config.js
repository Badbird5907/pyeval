/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  important: "#root",
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
}

