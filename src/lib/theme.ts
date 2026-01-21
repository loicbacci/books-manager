import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Playfair Display', Georgia, serif" },
        body: { value: "'Source Sans 3', 'Segoe UI', sans-serif" },
        mono: { value: "'JetBrains Mono', 'Fira Code', monospace" },
      },
      colors: {
        // Primary - Deep Burgundy (literary, sophisticated)
        brand: {
          50: { value: "#fdf2f4" },
          100: { value: "#fce4e8" },
          200: { value: "#facdd5" },
          300: { value: "#f5a3b3" },
          400: { value: "#ed6b86" },
          500: { value: "#e13d5e" },
          600: { value: "#c41e47" },
          700: { value: "#8b1538" },
          800: { value: "#761534" },
          900: { value: "#651631" },
          950: { value: "#390718" },
        },
        // Accent - Warm Gold (classic, elegant)
        gold: {
          50: { value: "#fffbeb" },
          100: { value: "#fef3c7" },
          200: { value: "#fde68a" },
          300: { value: "#fcd34d" },
          400: { value: "#fbbf24" },
          500: { value: "#d4a00a" },
          600: { value: "#b8860b" },
          700: { value: "#92661e" },
          800: { value: "#78501f" },
          900: { value: "#65421d" },
          950: { value: "#3b230d" },
        },
        // Warm Neutral - Cream/Parchment
        cream: {
          50: { value: "#fefdfb" },
          100: { value: "#fdfbf7" },
          200: { value: "#f9f5ec" },
          300: { value: "#f3ebe0" },
          400: { value: "#e8dcc8" },
          500: { value: "#d4c4a8" },
          600: { value: "#b5a080" },
          700: { value: "#968166" },
          800: { value: "#7a6a55" },
          900: { value: "#655848" },
          950: { value: "#362e23" },
        },
        // Deep Ink - For text and dark elements
        ink: {
          50: { value: "#f6f6f7" },
          100: { value: "#e2e3e5" },
          200: { value: "#c5c6ca" },
          300: { value: "#a0a2a8" },
          400: { value: "#7c7e86" },
          500: { value: "#61636b" },
          600: { value: "#4d4e55" },
          700: { value: "#3f4046" },
          800: { value: "#36373b" },
          900: { value: "#2a2b2e" },
          950: { value: "#1a1b1d" },
        },
        // Semantic - Success (Forest Green)
        success: {
          50: { value: "#f0fdf4" },
          100: { value: "#dcfce7" },
          200: { value: "#bbf7d0" },
          300: { value: "#86efac" },
          400: { value: "#4ade80" },
          500: { value: "#22c55e" },
          600: { value: "#16a34a" },
          700: { value: "#15803d" },
          800: { value: "#166534" },
          900: { value: "#14532d" },
        },
        // Semantic - Warning (Amber)
        warning: {
          50: { value: "#fffbeb" },
          100: { value: "#fef3c7" },
          200: { value: "#fde68a" },
          300: { value: "#fcd34d" },
          400: { value: "#fbbf24" },
          500: { value: "#f59e0b" },
          600: { value: "#d97706" },
          700: { value: "#b45309" },
          800: { value: "#92400e" },
          900: { value: "#78350f" },
        },
        // Semantic - Error (Deep Red)
        error: {
          50: { value: "#fef2f2" },
          100: { value: "#fee2e2" },
          200: { value: "#fecaca" },
          300: { value: "#fca5a5" },
          400: { value: "#f87171" },
          500: { value: "#ef4444" },
          600: { value: "#dc2626" },
          700: { value: "#b91c1c" },
          800: { value: "#991b1b" },
          900: { value: "#7f1d1d" },
        },
      },
      radii: {
        sm: { value: "0.25rem" },
        md: { value: "0.5rem" },
        lg: { value: "0.75rem" },
        xl: { value: "1rem" },
        "2xl": { value: "1.5rem" },
      },
      shadows: {
        subtle: { value: "0 1px 2px 0 rgba(26, 27, 29, 0.05)" },
        card: {
          value:
            "0 4px 6px -1px rgba(26, 27, 29, 0.08), 0 2px 4px -2px rgba(26, 27, 29, 0.04)",
        },
        elevated: {
          value:
            "0 10px 15px -3px rgba(26, 27, 29, 0.1), 0 4px 6px -4px rgba(26, 27, 29, 0.05)",
        },
        dramatic: {
          value:
            "0 20px 25px -5px rgba(26, 27, 29, 0.15), 0 8px 10px -6px rgba(26, 27, 29, 0.1)",
        },
        inner: { value: "inset 0 2px 4px 0 rgba(26, 27, 29, 0.06)" },
        glow: { value: "0 0 20px rgba(139, 21, 56, 0.3)" },
        goldGlow: { value: "0 0 20px rgba(184, 134, 11, 0.3)" },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.700}" },
          contrast: { value: "white" },
          fg: { value: "{colors.brand.800}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.50}" },
          emphasized: { value: "{colors.brand.600}" },
          focusRing: { value: "{colors.brand.500}" },
        },
        accent: {
          solid: { value: "{colors.gold.600}" },
          contrast: { value: "white" },
          fg: { value: "{colors.gold.700}" },
          muted: { value: "{colors.gold.100}" },
          subtle: { value: "{colors.gold.50}" },
          emphasized: { value: "{colors.gold.500}" },
        },
        surface: {
          base: { value: "{colors.cream.50}" },
          raised: { value: "white" },
          overlay: { value: "{colors.cream.100}" },
        },
        text: {
          primary: { value: "{colors.ink.900}" },
          secondary: { value: "{colors.ink.600}" },
          muted: { value: "{colors.ink.400}" },
          inverse: { value: "{colors.cream.50}" },
        },
        border: {
          default: { value: "{colors.cream.400}" },
          muted: { value: "{colors.cream.300}" },
          emphasis: { value: "{colors.brand.200}" },
        },
      },
    },
    keyframes: {
      fadeIn: {
        from: { opacity: "0" },
        to: { opacity: "1" },
      },
      fadeInUp: {
        from: { opacity: "0", transform: "translateY(10px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      fadeInDown: {
        from: { opacity: "0", transform: "translateY(-10px)" },
        to: { opacity: "1", transform: "translateY(0)" },
      },
      slideInLeft: {
        from: { opacity: "0", transform: "translateX(-20px)" },
        to: { opacity: "1", transform: "translateX(0)" },
      },
      slideInRight: {
        from: { opacity: "0", transform: "translateX(20px)" },
        to: { opacity: "1", transform: "translateX(0)" },
      },
      scaleIn: {
        from: { opacity: "0", transform: "scale(0.95)" },
        to: { opacity: "1", transform: "scale(1)" },
      },
      shimmer: {
        from: { backgroundPosition: "-200% 0" },
        to: { backgroundPosition: "200% 0" },
      },
      pulse: {
        "0%, 100%": { opacity: "1" },
        "50%": { opacity: "0.5" },
      },
      float: {
        "0%, 100%": { transform: "translateY(0)" },
        "50%": { transform: "translateY(-5px)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
