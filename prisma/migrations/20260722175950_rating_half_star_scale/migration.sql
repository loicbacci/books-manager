-- Migrate legacy whole-star 1-5 ratings to half-star 1-10 (multiply by 2).
-- Values already > 5 are left unchanged.
UPDATE "books"
SET "rating" = "rating" * 2
WHERE "rating" IS NOT NULL AND "rating" >= 1 AND "rating" <= 5;
