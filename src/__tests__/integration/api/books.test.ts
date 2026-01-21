/**
 * @jest-environment node
 */

import { GET, POST } from "@/app/api/books/route";
import { NextRequest } from "next/server";

// Mock auth
const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock db
const mockFindMany = jest.fn();
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();

jest.mock("@/lib/db", () => ({
  db: {
    book: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

describe("GET /api/books", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
  });

  const createRequest = (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    return new NextRequest(
      `http://localhost:3000/api/books?${searchParams.toString()}`
    );
  };

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns books for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const mockBooks = [
      {
        id: "book-1",
        title: "Test Book 1",
        status: "READING",
        authors: [],
        genres: [],
      },
      {
        id: "book-2",
        title: "Test Book 2",
        status: "TO_READ",
        authors: [],
        genres: [],
      },
    ];
    mockFindMany.mockResolvedValue(mockBooks);

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockBooks);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-123" },
      })
    );
  });

  it("filters books by status", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockFindMany.mockResolvedValue([]);

    await GET(createRequest({ status: "READING" }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-123",
          status: "READING",
        }),
      })
    );
  });

  it("filters books by wishlist", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockFindMany.mockResolvedValue([]);

    await GET(createRequest({ wishlist: "true" }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-123",
          isWishlist: true,
        }),
      })
    );
  });

  it("filters books by search term", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockFindMany.mockResolvedValue([]);

    await GET(createRequest({ search: "lord" }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-123",
          title: { contains: "lord", mode: "insensitive" },
        }),
      })
    );
  });

  it("ignores invalid status values", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockFindMany.mockResolvedValue([]);

    await GET(createRequest({ status: "INVALID_STATUS" }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-123" },
      })
    );
  });

  it("includes related data in response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockFindMany.mockResolvedValue([]);

    await GET(createRequest());

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          authors: expect.any(Object),
          genres: expect.any(Object),
          format: true,
          series: true,
        }),
      })
    );
  });
});

describe("POST /api/books", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: object) => {
    return new NextRequest("http://localhost:3000/api/books", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      createRequest({
        title: "New Book",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("creates a new book with minimal data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const mockBook = {
      id: "new-book-id",
      title: "New Book",
      status: "TO_READ",
      userId: "user-123",
    };
    mockCreate.mockResolvedValue(mockBook);

    const response = await POST(
      createRequest({
        title: "New Book",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockBook);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "New Book",
          userId: "user-123",
        }),
      })
    );
  });

  it("creates a book with all optional fields", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const mockBook = {
      id: "new-book-id",
      title: "Complete Book",
    };
    mockCreate.mockResolvedValue(mockBook);

    const response = await POST(
      createRequest({
        title: "Complete Book",
        coverUrl: "https://example.com/cover.jpg",
        status: "READING",
        totalPages: 300,
        currentPage: 50,
        rating: 8,
        summary: "A great book",
        favoriteQuote: "To be or not to be",
        favoriteMoment: "The ending",
        isWishlist: false,
      })
    );

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Complete Book",
          coverUrl: "https://example.com/cover.jpg",
          status: "READING",
          totalPages: 300,
          currentPage: 50,
          rating: 8,
          summary: "A great book",
          favoriteQuote: "To be or not to be",
          favoriteMoment: "The ending",
          isWishlist: false,
          userId: "user-123",
        }),
      })
    );
  });

  it("returns 400 for missing title", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 for empty title", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(createRequest({ title: "" }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 for invalid status", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(
      createRequest({
        title: "Book",
        status: "INVALID",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 for invalid rating (too high)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(
      createRequest({
        title: "Book",
        rating: 11,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 for invalid rating (too low)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(
      createRequest({
        title: "Book",
        rating: 0,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 for negative currentPage", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(
      createRequest({
        title: "Book",
        currentPage: -5,
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 for invalid cover URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });

    const response = await POST(
      createRequest({
        title: "Book",
        coverUrl: "not-a-url",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("creates book with author and genre relations", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    mockCreate.mockResolvedValue({ id: "book-id", title: "Book" });

    await POST(
      createRequest({
        title: "Book",
        authorIds: ["author-1", "author-2"],
        genreIds: ["genre-1"],
      })
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          authors: {
            create: [{ authorId: "author-1" }, { authorId: "author-2" }],
          },
          genres: {
            create: [{ genreId: "genre-1" }],
          },
        }),
      })
    );
  });
});
