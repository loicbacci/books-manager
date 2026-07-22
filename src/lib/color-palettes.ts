export const colorPalettes = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "cyan",
  "purple",
  "pink",
] as const;

export type ColorPalette = (typeof colorPalettes)[number];

export const paletteForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % colorPalettes.length;
  }
  return colorPalettes[Math.abs(hash) % colorPalettes.length];
};

export const resolvePalette = (name: string, color?: string | null) => {
  if (color && colorPalettes.includes(color as ColorPalette)) {
    return color as ColorPalette;
  }
  return paletteForName(name.toLowerCase());
};

/**
 * Tailwind background/text classes for each palette, used for genre badges.
 * Kept in sync with `colorPalettes` above.
 */
export const paletteBadgeClassNames: Record<ColorPalette, string> = {
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
  green: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
};

export const paletteBadgeClassName = (name: string, color?: string | null) =>
  paletteBadgeClassNames[resolvePalette(name, color)];
