/**
 * @jest-environment node
 */

import { GET } from "@/app/api/books/search/route";

const mockAuth = jest.fn();
const mockSearchBooks = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/book-metadata", () => ({
  searchBooks: (...args: unknown[]) => mockSearchBooks(...args),
}));

describe("GET /api/books/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns 400 when query is missing", async () => {
    const response = await GET(new Request("http://localhost/api/books/search"));

    expect(response.status).toBe(400);
  });

  it("returns results for a valid query", async () => {
    mockSearchBooks.mockResolvedValue([{ id: "book-1" }]);

    const response = await GET(
      new Request("http://localhost/api/books/search?q=test")
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([{ id: "book-1" }]);
  });

  it("returns 500 when search fails", async () => {
    mockSearchBooks.mockRejectedValue(new Error("boom"));

    const response = await GET(
      new Request("http://localhost/api/books/search?q=test")
    );

    expect(response.status).toBe(500);
  });
});
