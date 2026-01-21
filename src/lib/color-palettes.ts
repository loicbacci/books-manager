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
