import {
  calculateProgress,
  formatDate,
  getStatusLabel,
  isValidEmail,
  isValidPassword,
  truncateText,
  getInitials,
  calculatePagesReadThisYear,
  countBooksByStatus,
  groupBy,
  slugify,
} from "@/lib/utils";

describe("calculateProgress", () => {
  it("returns 0 when totalPages is null", () => {
    expect(calculateProgress(50, null)).toBe(0);
  });

  it("returns 0 when totalPages is 0", () => {
    expect(calculateProgress(50, 0)).toBe(0);
  });

  it("returns 0 when totalPages is negative", () => {
    expect(calculateProgress(50, -100)).toBe(0);
  });

  it("returns 0 when currentPage is negative", () => {
    expect(calculateProgress(-10, 100)).toBe(0);
  });

  it("returns 100 when currentPage equals totalPages", () => {
    expect(calculateProgress(100, 100)).toBe(100);
  });

  it("returns 100 when currentPage exceeds totalPages", () => {
    expect(calculateProgress(150, 100)).toBe(100);
  });

  it("calculates correct percentage", () => {
    expect(calculateProgress(50, 100)).toBe(50);
    expect(calculateProgress(25, 100)).toBe(25);
    expect(calculateProgress(75, 300)).toBe(25);
  });

  it("rounds to nearest integer", () => {
    expect(calculateProgress(33, 100)).toBe(33);
    expect(calculateProgress(1, 3)).toBe(33);
    expect(calculateProgress(2, 3)).toBe(67);
  });
});

describe("formatDate", () => {
  it("returns empty string for null date", () => {
    expect(formatDate(null)).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(formatDate("invalid-date")).toBe("");
  });

  it("formats Date object correctly in English", () => {
    const date = new Date("2024-06-15");
    const result = formatDate(date, "en");
    expect(result).toContain("2024");
    expect(result).toContain("June");
    expect(result).toContain("15");
  });

  it("formats Date object correctly in French", () => {
    const date = new Date("2024-06-15");
    const result = formatDate(date, "fr");
    expect(result).toContain("2024");
    expect(result.toLowerCase()).toContain("juin");
    expect(result).toContain("15");
  });

  it("formats date string correctly", () => {
    const result = formatDate("2024-01-01", "en");
    expect(result).toContain("2024");
    expect(result).toContain("January");
  });

  it("defaults to English locale", () => {
    const date = new Date("2024-06-15");
    const result = formatDate(date);
    expect(result).toContain("June");
  });
});

describe("getStatusLabel", () => {
  it("returns correct English labels", () => {
    expect(getStatusLabel("TO_READ", "en")).toBe("To Read");
    expect(getStatusLabel("READING", "en")).toBe("Reading");
    expect(getStatusLabel("READ", "en")).toBe("Read");
    expect(getStatusLabel("DROPPED", "en")).toBe("Dropped");
  });

  it("returns correct French labels", () => {
    expect(getStatusLabel("TO_READ", "fr")).toBe("À lire");
    expect(getStatusLabel("READING", "fr")).toBe("En cours");
    expect(getStatusLabel("READ", "fr")).toBe("Lu");
    expect(getStatusLabel("DROPPED", "fr")).toBe("Abandonné");
  });

  it("defaults to English for unknown locale", () => {
    expect(getStatusLabel("TO_READ", "de")).toBe("To Read");
  });

  it("defaults to English when no locale provided", () => {
    expect(getStatusLabel("READING")).toBe("Reading");
  });
});

describe("isValidEmail", () => {
  it("returns true for valid emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.org")).toBe(true);
    expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
  });

  it("returns false for invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("invalid@")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user @domain.com")).toBe(false);
    expect(isValidEmail("user@domain")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("returns true for passwords with 8+ characters", () => {
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("password123")).toBe(true);
    expect(isValidPassword("a very long password")).toBe(true);
  });

  it("returns false for passwords with less than 8 characters", () => {
    expect(isValidPassword("")).toBe(false);
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("short")).toBe(false);
  });
});

describe("truncateText", () => {
  it("returns empty string for empty input", () => {
    expect(truncateText("", 10)).toBe("");
  });

  it("returns original text if shorter than maxLength", () => {
    expect(truncateText("short", 10)).toBe("short");
  });

  it("returns original text if exactly maxLength", () => {
    expect(truncateText("exact", 5)).toBe("exact");
  });

  it("truncates and adds ellipsis for long text", () => {
    expect(truncateText("this is a long text", 10)).toBe("this is...");
  });

  it("uses custom ellipsis", () => {
    expect(truncateText("this is a long text", 10, "…")).toBe("this is a…");
  });
});

describe("getInitials", () => {
  it("returns ? for null name", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("returns single initial for single name", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("returns two initials for full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("handles multiple names by using first and last", () => {
    expect(getInitials("John William Doe")).toBe("JD");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  John   Doe  ")).toBe("JD");
  });
});

describe("calculatePagesReadThisYear", () => {
  const currentYear = new Date().getFullYear();

  it("returns 0 for empty array", () => {
    expect(calculatePagesReadThisYear([])).toBe(0);
  });

  it("counts pages from books completed this year", () => {
    const books = [
      {
        status: "READ",
        totalPages: 300,
        currentPage: 300,
        endDate: new Date(`${currentYear}-06-15`),
      },
    ];
    expect(calculatePagesReadThisYear(books)).toBe(300);
  });

  it("does not count books completed in previous years", () => {
    const books = [
      {
        status: "READ",
        totalPages: 300,
        currentPage: 300,
        endDate: new Date(`${currentYear - 1}-06-15`),
      },
    ];
    expect(calculatePagesReadThisYear(books)).toBe(0);
  });

  it("counts current pages for books being read", () => {
    const books = [
      {
        status: "READING",
        totalPages: 300,
        currentPage: 150,
        endDate: null,
      },
    ];
    expect(calculatePagesReadThisYear(books)).toBe(150);
  });

  it("does not count to-read or dropped books", () => {
    const books = [
      {
        status: "TO_READ",
        totalPages: 300,
        currentPage: 0,
        endDate: null,
      },
      {
        status: "DROPPED",
        totalPages: 200,
        currentPage: 50,
        endDate: null,
      },
    ];
    expect(calculatePagesReadThisYear(books)).toBe(0);
  });

  it("combines multiple books correctly", () => {
    const books = [
      {
        status: "READ",
        totalPages: 300,
        currentPage: 300,
        endDate: new Date(`${currentYear}-01-15`),
      },
      {
        status: "READ",
        totalPages: 200,
        currentPage: 200,
        endDate: new Date(`${currentYear}-03-20`),
      },
      {
        status: "READING",
        totalPages: 400,
        currentPage: 100,
        endDate: null,
      },
    ];
    expect(calculatePagesReadThisYear(books)).toBe(600); // 300 + 200 + 100
  });
});

describe("countBooksByStatus", () => {
  it("returns empty object for empty array", () => {
    expect(countBooksByStatus([])).toEqual({});
  });

  it("counts single status correctly", () => {
    const books = [
      { status: "TO_READ" },
      { status: "TO_READ" },
      { status: "TO_READ" },
    ];
    expect(countBooksByStatus(books)).toEqual({ TO_READ: 3 });
  });

  it("counts multiple statuses correctly", () => {
    const books = [
      { status: "TO_READ" },
      { status: "READING" },
      { status: "READ" },
      { status: "READ" },
      { status: "DROPPED" },
    ];
    expect(countBooksByStatus(books)).toEqual({
      TO_READ: 1,
      READING: 1,
      READ: 2,
      DROPPED: 1,
    });
  });
});

describe("groupBy", () => {
  it("returns empty object for empty array", () => {
    expect(groupBy([], (item: { key: string }) => item.key)).toEqual({});
  });

  it("groups items by key function", () => {
    const items = [
      { name: "Alice", team: "A" },
      { name: "Bob", team: "B" },
      { name: "Charlie", team: "A" },
    ];
    const result = groupBy(items, (item) => item.team);
    expect(result).toEqual({
      A: [
        { name: "Alice", team: "A" },
        { name: "Charlie", team: "A" },
      ],
      B: [{ name: "Bob", team: "B" }],
    });
  });

  it("handles single group", () => {
    const items = [
      { value: 1, type: "number" },
      { value: 2, type: "number" },
    ];
    const result = groupBy(items, (item) => item.type);
    expect(result).toEqual({
      number: [
        { value: 1, type: "number" },
        { value: 2, type: "number" },
      ],
    });
  });
});

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("HELLO")).toBe("hello");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("hello! world?")).toBe("hello-world");
  });

  it("trims whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("handles complex strings", () => {
    expect(slugify("The Lord of the Rings: The Fellowship")).toBe(
      "the-lord-of-the-rings-the-fellowship"
    );
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("-hello-world-")).toBe("hello-world");
  });
});
