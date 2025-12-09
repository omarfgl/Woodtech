const withOpacityValue = (variable) => {
  return ({ opacityValue } = {}) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variable}) / ${opacityValue})`;
    }
    return `rgb(var(${variable}))`;
  };
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        brand: {
          50: withOpacityValue("--color-brand-50"),
          100: withOpacityValue("--color-brand-100"),
          200: withOpacityValue("--color-brand-200"),
          300: withOpacityValue("--color-brand-300"),
          400: withOpacityValue("--color-brand-400"),
          500: withOpacityValue("--color-brand-500"),
          600: withOpacityValue("--color-brand-600"),
          700: withOpacityValue("--color-brand-700"),
          800: withOpacityValue("--color-brand-800"),
          900: withOpacityValue("--color-brand-900"),
          950: withOpacityValue("--color-brand-950")
        }
      }
    }
  },
  plugins: []
};
