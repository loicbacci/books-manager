/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import {
  GET,
  PATCH,
  DELETE,
} from "@/app/api/books/[id]/route";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    book: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bookAuthor: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    bookGenre: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/slugify", () => ({
  generateUniqueSlug: jest.fn(),
}));

const getDb = () =>
  (jest.requireMock("@/lib/db") as {
    db: {
      book: {
        findFirst: jest.Mock;
        findUnique: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
      };
      bookAuthor: { deleteMany: jest.Mock; createMany: jest.Mock };
      bookGenre: { deleteMany: jest.Mock; createMany: jest.Mock };
    };
  }).db;

const getSlugifyMock = () =>
  (jest.requireMock("@/lib/slugify") as {
    generateUniqueSlug: jest.Mock;
  }).generateUniqueSlug;

const params = { params: Promise.resolve({ id: "book-1" }) };

const patchRequest = (body: object) =>
  new NextRequest("http://localhost/api/books/book-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("books/[id] routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for GET when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for GET when book is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().book.findFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(404);
  });

  it("returns the book for GET when found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().book.findFirst.mockResolvedValue({ id: "book-1" });

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(200);
  });

  it("returns 401 for PATCH when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await PATCH(patchRequest({ title: "Book" }), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for PATCH when book is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().book.findFirst.mockResolvedValue(null);

    const response = await PATCH(patchRequest({ title: "Book" }), params);

    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid PATCH payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().book.findFirst.mockResolvedValue({ id: "book-1" });

    const response = await PATCH(patchRequest({ rating: 0 }), params);

    expect(response.status).toBe(400);
  });

  it("updates book details and relations", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.book.findFirst.mockResolvedValue({ id: "book-1" });
    db.book.update.mockResolvedValue({ id: "book-1" });
    getSlugifyMock().mockResolvedValue("new-slug");

    const response = await PATCH(
      patchRequest({
        title: "New Title",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-02-01T00:00:00.000Z",
        authorIds: ["a1", "a2"],
        genreIds: ["g1"],
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(getSlugifyMock()).toHaveBeenCalledWith(
      "New Title",
      "user-1",
      expect.any(Function)
    );
    expect(getDb().bookAuthor.deleteMany).toHaveBeenCalledWith({
      where: { bookId: "book-1" },
    });
    expect(getDb().bookAuthor.createMany).toHaveBeenCalled();
    expect(getDb().bookGenre.deleteMany).toHaveBeenCalledWith({
      where: { bookId: "book-1" },
    });
    expect(getDb().bookGenre.createMany).toHaveBeenCalled();
    expect(getDb().book.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "book-1" },
        data: expect.objectContaining({
          slug: "new-slug",
          startDate: new Date("2024-01-01T00:00:00.000Z"),
          endDate: new Date("2024-02-01T00:00:00.000Z"),
        }),
      })
    );
  });

  it("returns 401 for DELETE when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for DELETE when book is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().book.findFirst.mockResolvedValue(null);

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(404);
  });

  it("deletes the book when found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().book.findFirst.mockResolvedValue({ id: "book-1" });

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(200);
    expect(getDb().book.delete).toHaveBeenCalledWith({ where: { id: "book-1" } });
  });
});
