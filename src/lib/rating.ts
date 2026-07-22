/** Half-star rating helpers. Stored values are 1–10; UI shows 5 stars. */

export const RATING_MIN = 1;
export const RATING_MAX = 10;
export const STAR_COUNT = 5;

export type StarFill = "empty" | "half" | "full";

export function clampRating(value: number): number {
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value)));
}

/** Fill state for star index `i` (0-based) given stored rating `r` (1–10). */
export function starFill(r: number, i: number): StarFill {
  if (r >= 2 * (i + 1)) return "full";
  if (r === 2 * i + 1) return "half";
  return "empty";
}

/** Full-star click on star `n` (1–5) → stored value `2n`. */
export function fullStarToStored(starIndex1Based: number): number {
  return clampRating(starIndex1Based * 2);
}

/** Left half of star `n` (1–5) → odd stored value `2n - 1`. */
export function halfStarToStored(starIndex1Based: number): number {
  return clampRating(starIndex1Based * 2 - 1);
}

/**
 * Convert a raw import value to 1–10.
 * If the column looks like a 1–5 scale (value ≤ 5), multiply by 2 once.
 * Values already on 1–10 (or > 5) are clamped as-is.
 */
export function importRatingToStored(
  value: number,
  options?: { assumeFiveStarScale?: boolean }
): number {
  const rounded = Math.round(value);
  const assumeFive =
    options?.assumeFiveStarScale ?? (rounded >= 1 && rounded <= 5);
  if (assumeFive) {
    return clampRating(rounded * 2);
  }
  return clampRating(rounded);
}

/** Migrate legacy whole-star 1–5 rows to half-star 1–10 (×2). Leave >5 as-is. */
export function migrateLegacyWholeStar(value: number): number {
  if (value >= 1 && value <= 5) {
    return value * 2;
  }
  return clampRating(value);
}
