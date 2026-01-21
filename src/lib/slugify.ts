/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Remove accents/diacritics
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Remove all non-word chars except hyphens
      .replace(/[^\w\-]+/g, "")
      // Replace multiple hyphens with single hyphen
      .replace(/\-\-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+/, "")
      .replace(/-+$/, "")
  );
}

/**
 * Generate a unique slug by checking for conflicts and appending a number if needed
 * @param title - The book title to slugify
 * @param userId - The user ID to check for conflicts
 * @param existingSlugCheck - Function to check if a slug already exists
 * @param excludeId - Optional book ID to exclude from conflict check (for updates)
 */
export async function generateUniqueSlug(
  title: string,
  userId: string,
  existingSlugCheck: (slug: string, userId: string) => Promise<boolean>,
  _excludeId?: string
): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  // Keep trying until we find a unique slug
  while (await existingSlugCheck(slug, userId)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
