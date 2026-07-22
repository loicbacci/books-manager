import {
  clampRating,
  fullStarToStored,
  halfStarToStored,
  importRatingToStored,
  migrateLegacyWholeStar,
  starFill,
} from "@/lib/rating";

describe("rating helpers", () => {
  it("clamps to 1–10", () => {
    expect(clampRating(0)).toBe(1);
    expect(clampRating(11)).toBe(10);
    expect(clampRating(7.4)).toBe(7);
  });

  it("maps star fills for half-star scale", () => {
    expect(starFill(4, 0)).toBe("full");
    expect(starFill(4, 1)).toBe("full");
    expect(starFill(4, 2)).toBe("empty");
    expect(starFill(3, 0)).toBe("full");
    expect(starFill(3, 1)).toBe("half");
    expect(starFill(3, 2)).toBe("empty");
  });

  it("converts star clicks to stored values", () => {
    expect(fullStarToStored(2)).toBe(4);
    expect(halfStarToStored(2)).toBe(3);
  });

  it("imports 1–5 values by doubling", () => {
    expect(importRatingToStored(2)).toBe(4);
    expect(importRatingToStored(5)).toBe(10);
    expect(importRatingToStored(8, { assumeFiveStarScale: false })).toBe(8);
  });

  it("migrates legacy 1–5 whole stars", () => {
    expect(migrateLegacyWholeStar(2)).toBe(4);
    expect(migrateLegacyWholeStar(8)).toBe(8);
  });
});
