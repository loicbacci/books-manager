import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Disable preflight to avoid conflicts with Chakra UI's CSS reset
  corePlugins: {
    preflight: false,
  },
  // Use 'tw-' prefix to avoid class name conflicts with Chakra UI
  prefix: "tw-",
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
