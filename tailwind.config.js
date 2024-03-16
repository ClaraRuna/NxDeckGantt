const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require("tailwindcss/plugin");
const colors = require("tailwindcss/colors");

function getFontSettings(theme, fontSize, fontWeight = 400) {
  return {
    fontSize: theme(`fontSize.${fontSize}`)[0],
    lineHeight: theme(`fontSize.${fontSize}`)[1].lineHeight,
    letterSpacing: theme(`fontSize.${fontSize}`)[1].letterSpacing,
    fontWeight,
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["Views/*.html"],
  theme: {
    extend: {
      width: {
        a4: "1444px",
      },
      height: {
        a4: "2041px",
      },
      letterSpacing: {
        widest: "0.3em",
      },
    },
  },
  prettier: {
    plugins: ["prettier-plugin-tailwindcss"],
  },
};
