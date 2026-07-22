/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/series/[id]/route";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    series: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    book: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (db: unknown) => unknown) =>
      callback((jest.requireMock("@/lib/db") as { db: unknown }).db)
    ),
  },
}));

jest.mock("@/lib/slugify", () => ({
  generateUniqueSlug: jest.fn(),
}));

const getDb = () =>
  (
    jest.requireMock("@/lib/db") as {
      db: {
        series: {
          findFirst: jest.Mock;
          findUnique: jest.Mock;
          update: jest.Mock;
          delete: jest.Mock;
        };
        book: { updateMany: jest.Mock };
        $transaction: jest.Mock;
      };
    }
  ).db;

const getSlugifyMock = () =>
  (jest.requireMock("@/lib/slugify") as { generateUniqueSlug: jest.Mock })
    .generateUniqueSlug;

const params = { params: Promise.resolve({ id: "series-1" }) };

const patchRequest = (body: object) =>
  new NextRequest("http://localhost/api/series/series-1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("series/[id] routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for GET when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for GET when series is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().series.findFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(404);
  });

  it("returns 401 for PATCH when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await PATCH(patchRequest({ name: "New Name" }), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for PATCH when series is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().series.findFirst.mockResolvedValue(null);

    const response = await PATCH(patchRequest({ name: "New Name" }), params);

    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid PATCH payload", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().series.findFirst.mockResolvedValue({ id: "series-1" });

    const response = await PATCH(patchRequest({}), params);

    expect(response.status).toBe(400);
  });

  it("returns 409 when another series has the same name", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.series.findFirst
      .mockResolvedValueOnce({ id: "series-1" })
      .mockResolvedValueOnce({ id: "series-2" });

    const response = await PATCH(
      patchRequest({ name: "Duplicate Name" }),
      params
    );

    expect(response.status).toBe(409);
  });

  it("updates the series and regenerates the slug", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.series.findFirst
      .mockResolvedValueOnce({ id: "series-1" })
      .mockResolvedValueOnce(null);
    getSlugifyMock().mockResolvedValue("new-name");
    db.series.update.mockResolvedValue({ id: "series-1", name: "New Name" });

    const response = await PATCH(patchRequest({ name: "New Name" }), params);

    expect(response.status).toBe(200);
    expect(getSlugifyMock()).toHaveBeenCalledWith(
      "New Name",
      "user-1",
      expect.any(Function)
    );
    expect(db.series.update).toHaveBeenCalledWith({
      where: { id: "series-1" },
      data: { name: "New Name", slug: "new-name" },
    });
  });

  it("returns 401 for DELETE when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(401);
  });

  it("returns 404 for DELETE when series is missing", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().series.findFirst.mockResolvedValue(null);

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(404);
  });

  it("clears book seriesId/seriesOrder and deletes the series", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.series.findFirst.mockResolvedValue({ id: "series-1" });

    const response = await DELETE(new NextRequest("http://localhost"), params);

    expect(response.status).toBe(200);
    expect(db.book.updateMany).toHaveBeenCalledWith({
      where: { seriesId: "series-1" },
      data: { seriesId: null, seriesOrder: null },
    });
    expect(db.series.delete).toHaveBeenCalledWith({
      where: { id: "series-1" },
    });
  });
});
