/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: false,
  },
  important: "#root",
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        vsdark: "#1E1E1E",
        vsdarker: "#181818",
        vserror: "#eb5c39",
        vswarning: "#FFB61D",
      },
    },
  },
  plugins: [],
};
