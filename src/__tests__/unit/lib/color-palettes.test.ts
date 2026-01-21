import { colorPalettes, paletteForName, resolvePalette } from "@/lib/color-palettes";

describe("color-palettes", () => {
  it("returns consistent palettes for the same name", () => {
    const first = paletteForName("Parasite Kiseju");
    const second = paletteForName("Parasite Kiseju");

    expect(colorPalettes).toContain(first);
    expect(first).toBe(second);
  });

  it("returns provided palette when valid", () => {
    const palette = resolvePalette("Anything", "blue");

    expect(palette).toBe("blue");
  });

  it("falls back to name-derived palette when color is invalid", () => {
    const palette = resolvePalette("Example", "not-a-color");

    expect(colorPalettes).toContain(palette);
  });

  it("uses a lowercase name for fallback palette", () => {
    const mixed = resolvePalette("MixedCase");
    const lower = resolvePalette("mixedcase");

    expect(mixed).toBe(lower);
  });
});
