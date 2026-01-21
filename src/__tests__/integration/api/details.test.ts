/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET as getAuthor } from "@/app/api/authors/[id]/route";
import { GET as getSeries } from "@/app/api/series/[id]/route";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    author: { findFirst: jest.fn() },
    book: { findMany: jest.fn() },
    series: { findFirst: jest.fn() },
  },
}));

const getDb = () =>
  (jest.requireMock("@/lib/db") as {
    db: {
      author: { findFirst: jest.Mock };
      book: { findMany: jest.Mock };
      series: { findFirst: jest.Mock };
    };
  }).db;

const params = { params: Promise.resolve({ id: "item-1" }) };

describe("detail routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    expect(
      (await getAuthor(new NextRequest("http://localhost"), params)).status
    ).toBe(401);
    expect(
      (await getSeries(new NextRequest("http://localhost"), params)).status
    ).toBe(401);
  });

  it("returns 404 for missing author", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.findFirst.mockResolvedValue(null);

    const response = await getAuthor(
      new NextRequest("http://localhost"),
      params
    );

    expect(response.status).toBe(404);
  });

  it("returns author with books", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.author.findFirst.mockResolvedValue({ id: "author-1" });
    db.book.findMany.mockResolvedValue([{ id: "book-1" }]);

    const response = await getAuthor(
      new NextRequest("http://localhost"),
      params
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.books).toHaveLength(1);
  });

  it("returns 404 for missing series", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().series.findFirst.mockResolvedValue(null);

    const response = await getSeries(
      new NextRequest("http://localhost"),
      params
    );

    expect(response.status).toBe(404);
  });

  it("returns series with books", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().series.findFirst.mockResolvedValue({ id: "series-1", books: [] });

    const response = await getSeries(
      new NextRequest("http://localhost"),
      params
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("series-1");
  });
});
