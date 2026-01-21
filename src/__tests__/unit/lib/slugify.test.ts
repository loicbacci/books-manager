import { generateUniqueSlug, slugify } from "@/lib/slugify";

describe("slugify", () => {
  it("normalizes strings into URL-friendly slugs", () => {
    const slug = slugify("  L'étranger & Co.  ");

    expect(slug).toBe("letranger-co");
  });
});

describe("generateUniqueSlug", () => {
  it("returns base slug when no conflicts", async () => {
    const result = await generateUniqueSlug(
      "My Book",
      "user-1",
      async () => false
    );

    expect(result).toBe("my-book");
  });

  it("increments suffix until slug is unique", async () => {
    const existingSlugCheck = jest
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const result = await generateUniqueSlug(
      "My Book",
      "user-1",
      existingSlugCheck
    );

    expect(result).toBe("my-book-2");
    expect(existingSlugCheck).toHaveBeenCalledTimes(3);
  });
});
