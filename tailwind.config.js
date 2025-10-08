import fs from "fs";

/** @type {import('tailwindcss').Config} */

let theme = {};
try {
  const themePath = "./theme.json";

  if (fs.existsSync(themePath)) {
    theme = JSON.parse(fs.readFileSync(themePath, "utf-8"));
  }
} catch (err) {
  console.error('failed to parse custom styles', err)
}
const defaultTheme = {
  container: {
    center: true,
    padding: "2rem",
  },
  extend: {
    screens: {
      coarse: { raw: "(pointer: coarse)" },
      fine: { raw: "(pointer: fine)" },
      pwa: { raw: "(display-mode: standalone)" },
    },
    colors: {
      // Elegant Burgundy + Gold + Soft Blush Palette
      'burgundy': {
        50: '#fdf2f4',   // Very light blush
        100: '#fce7ea',  // Light blush
        200: '#f9d0d8',  // Soft blush
        300: '#f4aac0',  // Medium blush
        400: '#e8759c',  // Warm blush
        500: '#722f37',  // Deep Wine Burgundy (Primary)
        600: '#5f262c',  // Darker burgundy
        700: '#4f1f23',  // Deep burgundy
        800: '#3f191b',  // Very deep burgundy
        900: '#331416',  // Darkest burgundy
        950: '#1f0c0d'   // Almost black burgundy
      },
      'gold': {
        50: '#fffdf0',   // Cream white
        100: '#fefae6',  // Light cream
        200: '#fef3cc',  // Soft gold
        300: '#fde68a',  // Light gold
        400: '#fcd34d',  // Medium gold
        500: '#d4af37',  // Rich Gold (Secondary)
        600: '#b8941f',  // Darker gold
        700: '#9c7b1a',  // Deep gold
        800: '#806315',  // Very deep gold
        900: '#654c11',  // Darkest gold
        950: '#4a360c'   // Almost black gold
      },
      'blush': {
        50: '#fefefe',   // Pure white
        100: '#fdf9f9',  // Barely there blush
        200: '#faf2f2',  // Very light blush
        300: '#f5e6e6',  // Light blush
        400: '#edc5c5',  // Soft Blush (Accent)
        500: '#d4a4a4',  // Medium blush
        600: '#b88888',  // Deeper blush
        700: '#9c6f6f',  // Deep blush
        800: '#7d5959',  // Very deep blush
        900: '#5f4646',  // Darkest blush
        950: '#3d2f2f'   // Almost black blush
      },
      // Existing color system (preserved)
      neutral: {
        1: "var(--color-neutral-1)",
        2: "var(--color-neutral-2)",
        3: "var(--color-neutral-3)",
        4: "var(--color-neutral-4)",
        5: "var(--color-neutral-5)",
        6: "var(--color-neutral-6)",
        7: "var(--color-neutral-7)",
        8: "var(--color-neutral-8)",
        9: "var(--color-neutral-9)",
        10: "var(--color-neutral-10)",
        11: "var(--color-neutral-11)",
        12: "var(--color-neutral-12)",
        a1: "var(--color-neutral-a1)",
        a2: "var(--color-neutral-a2)",
        a3: "var(--color-neutral-a3)",
        a4: "var(--color-neutral-a4)",
        a5: "var(--color-neutral-a5)",
        a6: "var(--color-neutral-a6)",
        a7: "var(--color-neutral-a7)",
        a8: "var(--color-neutral-a8)",
        a9: "var(--color-neutral-a9)",
        a10: "var(--color-neutral-a10)",
        a11: "var(--color-neutral-a11)",
        a12: "var(--color-neutral-a12)",
        contrast: "var(--color-neutral-contrast)",
      },
      accent: {
        1: "var(--color-accent-1)",
        2: "var(--color-accent-2)",
        3: "var(--color-accent-3)",
        4: "var(--color-accent-4)",
        5: "var(--color-accent-5)",
        6: "var(--color-accent-6)",
        7: "var(--color-accent-7)",
        8: "var(--color-accent-8)",
        9: "var(--color-accent-9)",
        10: "var(--color-accent-10)",
        11: "var(--color-accent-11)",
        12: "var(--color-accent-12)",
        contrast: "var(--color-accent-contrast)",
      },
      "accent-secondary": {
        1: "var(--color-accent-secondary-1)",
        2: "var(--color-accent-secondary-2)",
        3: "var(--color-accent-secondary-3)",
        4: "var(--color-accent-secondary-4)",
        5: "var(--color-accent-secondary-5)",
        6: "var(--color-accent-secondary-6)",
        7: "var(--color-accent-secondary-7)",
        8: "var(--color-accent-secondary-8)",
        9: "var(--color-accent-secondary-9)",
        10: "var(--color-accent-secondary-10)",
        11: "var(--color-accent-secondary-11)",
        12: "var(--color-accent-secondary-12)",
        contrast: "var(--color-accent-secondary-contrast)",
      },
      fg: {
        DEFAULT: "var(--color-fg)",
        secondary: "var(--color-fg-secondary)",
      },
      bg: {
        DEFAULT: "var(--color-bg)",
        inset: "var(--color-bg-inset)",
        overlay: "var(--color-bg-overlay)",
      },
      "focus-ring": "var(--color-focus-ring)",
      // OSUS specific utility colors - Updated for luxury theme
      'osus-success': '#228b22',
      'osus-warning': '#c9a810', 
      'osus-error': '#b22234',
      'osus-info': '#9a355d',
      'osus-gold': '#d4af37',
      'osus-burgundy': '#7d1538',
    },
    borderRadius: {
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      xl: "var(--radius-xl)",
      "2xl": "var(--radius-2xl)",
      full: "var(--radius-full)",
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    animation: {
      'fade-in': 'fadeIn 0.3s ease-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'bounce-soft': 'bounceSoft 1s ease-in-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0', transform: 'translateY(10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      slideUp: {
        '0%': { transform: 'translateY(20px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      pulseSoft: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.8' },
      },
      bounceSoft: {
        '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
        '40%, 43%': { transform: 'translate3d(0,-15px,0)' },
        '70%': { transform: 'translate3d(0,-7px,0)' },
        '90%': { transform: 'translate3d(0,-2px,0)' },
      },
    },
  },
  spacing: {
    px: "var(--size-px)",
    0: "var(--size-0)",
    0.5: "var(--size-0-5)",
    1: "var(--size-1)",
    1.5: "var(--size-1-5)",
    2: "var(--size-2)",
    2.5: "var(--size-2-5)",
    3: "var(--size-3)",
    3.5: "var(--size-3-5)",
    4: "var(--size-4)",
    5: "var(--size-5)",
    6: "var(--size-6)",
    7: "var(--size-7)",
    8: "var(--size-8)",
    9: "var(--size-9)",
    10: "var(--size-10)",
    11: "var(--size-11)",
    12: "var(--size-12)",
    14: "var(--size-14)",
    16: "var(--size-16)",
    20: "var(--size-20)",
    24: "var(--size-24)",
    28: "var(--size-28)",
    32: "var(--size-32)",
    36: "var(--size-36)",
    40: "var(--size-40)",
    44: "var(--size-44)",
    48: "var(--size-48)",
    52: "var(--size-52)",
    56: "var(--size-56)",
    60: "var(--size-60)",
    64: "var(--size-64)",
    72: "var(--size-72)",
    80: "var(--size-80)",
    96: "var(--size-96)",
  },
  darkMode: ["selector", '[data-appearance="dark"]'],
}

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { ...defaultTheme, ...theme },
};