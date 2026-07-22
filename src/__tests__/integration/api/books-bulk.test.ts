/**
 * @jest-environment node
 */

import { DELETE, PATCH } from "@/app/api/books/bulk/route";
import { NextRequest } from "next/server";

const mockAuth = jest.fn();
jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockUpdateMany = jest.fn();
const mockDeleteMany = jest.fn();

jest.mock("@/lib/db", () => ({
  db: {
    book: {
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
}));

describe("/api/books/bulk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (method: string, body: object) =>
    new NextRequest("http://localhost:3000/api/books/bulk", {
      method,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  describe("PATCH", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const response = await PATCH(
        createRequest("PATCH", { ids: ["a"], status: "READ" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 for empty ids", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      const response = await PATCH(
        createRequest("PATCH", { ids: [], status: "READ" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when neither status nor isWishlist provided", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      const response = await PATCH(
        createRequest("PATCH", { ids: ["book-1"] })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when more than 100 ids", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      const ids = Array.from({ length: 101 }, (_, i) => `id-${i}`);
      const response = await PATCH(
        createRequest("PATCH", { ids, status: "READ" })
      );
      expect(response.status).toBe(400);
    });

    it("updates status for current user's books", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockUpdateMany.mockResolvedValue({ count: 2 });

      const response = await PATCH(
        createRequest("PATCH", {
          ids: ["book-1", "book-2"],
          status: "READING",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.updated).toBe(2);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["book-1", "book-2"] }, userId: "user-1" },
        data: { status: "READING" },
      });
    });

    it("updates wishlist flag", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockUpdateMany.mockResolvedValue({ count: 1 });

      const response = await PATCH(
        createRequest("PATCH", {
          ids: ["book-1"],
          isWishlist: true,
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.updated).toBe(1);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["book-1"] }, userId: "user-1" },
        data: { isWishlist: true },
      });
    });
  });

  describe("DELETE", () => {
    it("returns 401 when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const response = await DELETE(createRequest("DELETE", { ids: ["a"] }));
      expect(response.status).toBe(401);
    });

    it("deletes current user's books", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } });
      mockDeleteMany.mockResolvedValue({ count: 3 });

      const response = await DELETE(
        createRequest("DELETE", { ids: ["a", "b", "c"] })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.deleted).toBe(3);
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["a", "b", "c"] }, userId: "user-1" },
      });
    });
  });
});
