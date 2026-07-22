/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/authors/[id]/route";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    author: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    gender: {
      findFirst: jest.fn(),
    },
    nationality: {
      count: jest.fn(),
    },
    authorNationality: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    bookAuthor: {
      deleteMany: jest.fn(),
    },
    book: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (db: unknown) => unknown) =>
      callback((jest.requireMock("@/lib/db") as { db: unknown }).db)
    ),
  },
}));

const getDb = () =>
  (
    jest.requireMock("@/lib/db") as {
      db: {
        author: {
          findFirst: jest.Mock;
          update: jest.Mock;
          delete: jest.Mock;
        };
        gender: { findFirst: jest.Mock };
        nationality: { count: jest.Mock };
        authorNationality: { deleteMany: jest.Mock; createMany: jest.Mock };
        bookAuthor: { deleteMany: jest.Mock };
        book: { findMany: jest.Mock };
        $transaction: jest.Mock;
      };
    }
  ).db;

const params = { params: Promise.resolve({ id: "author-1" }) };

const patchRequest = (body: object) =>
  new NextRequest("http://localhost/api/authors/author-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("authors/[id] routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for GET when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for GET when author is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.findFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(404);
  });

  it("returns 401 for PATCH when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await PATCH(patchRequest({ name: "New Name" }), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for PATCH when author is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.findFirst.mockResolvedValue(null);

    const response = await PATCH(patchRequest({ name: "New Name" }), params);

    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid PATCH payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.findFirst.mockResolvedValue({ id: "author-1" });

    const response = await PATCH(patchRequest({ name: "" }), params);

    expect(response.status).toBe(400);
  });

  it("returns 400 for PATCH with invalid genderId", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.findFirst.mockResolvedValue({ id: "author-1" });
    getDb().gender.findFirst.mockResolvedValue(null);

    const response = await PATCH(
      patchRequest({ genderId: "gender-x" }),
      params
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for PATCH with invalid nationalityIds", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.findFirst.mockResolvedValue({ id: "author-1" });
    getDb().nationality.count.mockResolvedValue(1);

    const response = await PATCH(
      patchRequest({ nationalityIds: ["n1", "n2"] }),
      params
    );

    expect(response.status).toBe(400);
  });

  it("returns 409 when renaming to an existing author name", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb()
      .author.findFirst.mockResolvedValueOnce({
        id: "author-1",
        name: "Old Name",
        userId: "user-1",
      })
      .mockResolvedValueOnce({ id: "author-2" });

    const response = await PATCH(patchRequest({ name: "Taken Name" }), params);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("An author with this name already exists");
  });

  it("updates author details and replaces nationalities", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.author.findFirst
      .mockResolvedValueOnce({ id: "author-1", name: "Old Name" })
      .mockResolvedValueOnce(null);
    db.gender.findFirst.mockResolvedValue({ id: "gender-1" });
    db.nationality.count.mockResolvedValue(2);
    db.author.update.mockResolvedValue({ id: "author-1" });

    const response = await PATCH(
      patchRequest({
        name: "New Name",
        genderId: "gender-1",
        nationalityIds: ["n1", "n2"],
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(db.authorNationality.deleteMany).toHaveBeenCalledWith({
      where: { authorId: "author-1" },
    });
    expect(db.authorNationality.createMany).toHaveBeenCalledWith({
      data: [
        { authorId: "author-1", nationalityId: "n1" },
        { authorId: "author-1", nationalityId: "n2" },
      ],
    });
    expect(db.author.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "author-1" },
        data: { name: "New Name", genderId: "gender-1" },
      })
    );
  });

  it("clears nationalities when nationalityIds is an empty array", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.author.findFirst.mockResolvedValue({ id: "author-1" });
    db.author.update.mockResolvedValue({ id: "author-1" });

    const response = await PATCH(
      patchRequest({ nationalityIds: [] }),
      params
    );

    expect(response.status).toBe(200);
    expect(db.authorNationality.deleteMany).toHaveBeenCalledWith({
      where: { authorId: "author-1" },
    });
    expect(db.authorNationality.createMany).not.toHaveBeenCalled();
  });

  it("returns 401 for DELETE when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for DELETE when author is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().author.findFirst.mockResolvedValue(null);

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(404);
  });

  it("detaches books and deletes the author", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.author.findFirst.mockResolvedValue({ id: "author-1" });
    db.bookAuthor.deleteMany.mockResolvedValue({ count: 3 });

    const response = await DELETE(new NextRequest("http://localhost"), params);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, booksDetached: 3 });
    expect(db.bookAuthor.deleteMany).toHaveBeenCalledWith({
      where: { authorId: "author-1" },
    });
    expect(db.author.delete).toHaveBeenCalledWith({
      where: { id: "author-1" },
    });
  });
});
