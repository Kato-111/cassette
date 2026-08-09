/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#070709",
        surface: "#111114",
        elevated: "#18181c",
        muted: "#92929d",
        accent: "#ff375f",
      },
      borderRadius: { card: "24px" },
    },
  },
  plugins: [],
};
