/**
 * Calculate reading progress as a percentage
 */
export function calculateProgress(
  currentPage: number,
  totalPages: number | null
): number {
  if (!totalPages || totalPages <= 0) return 0;
  if (currentPage < 0) return 0;
  if (currentPage >= totalPages) return 100;
  return Math.round((currentPage / totalPages) * 100);
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string | null,
  locale: string = "en"
): string {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "";

  return dateObj.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get the reading status label
 */
export function getStatusLabel(
  status: "TO_READ" | "READING" | "READ" | "DROPPED",
  locale: string = "en"
): string {
  const labels = {
    en: {
      TO_READ: "To Read",
      READING: "Reading",
      READ: "Read",
      DROPPED: "Dropped",
    },
    fr: {
      TO_READ: "À lire",
      READING: "En cours",
      READ: "Lu",
      DROPPED: "Abandonné",
    },
  };

  const localeLabels = labels[locale as keyof typeof labels] || labels.en;
  return localeLabels[status];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: at least 8 characters
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(
  text: string,
  maxLength: number,
  ellipsis: string = "..."
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Calculate pages read this year from a list of books
 */
export function calculatePagesReadThisYear(
  books: Array<{
    status: string;
    totalPages: number | null;
    currentPage: number;
    endDate: Date | null;
  }>
): number {
  const currentYear = new Date().getFullYear();

  return books.reduce((total, book) => {
    // For completed books, check if completed this year
    if (book.status === "READ" && book.endDate) {
      const endYear = new Date(book.endDate).getFullYear();
      if (endYear === currentYear) {
        return total + (book.totalPages || 0);
      }
    }
    // For currently reading books, add current pages
    if (book.status === "READING") {
      return total + book.currentPage;
    }
    return total;
  }, 0);
}

/**
 * Count books by status
 */
export function countBooksByStatus(
  books: Array<{ status: string }>
): Record<string, number> {
  return books.reduce(
    (acc, book) => {
      acc[book.status] = (acc[book.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Group items by a key
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Slugify a string for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
