/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/user/route";

const mockAuth = jest.fn();
const mockCompare = jest.fn();
const mockHash = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const getDb = () =>
  (jest.requireMock("@/lib/db") as {
    db: { user: { findUnique: jest.Mock; update: jest.Mock } };
  }).db;

jest.mock("bcryptjs", () => ({
  compare: (...args: unknown[]) => mockCompare(...args),
  hash: (...args: unknown[]) => mockHash(...args),
}));

const patchRequest = (body: object) =>
  new NextRequest("http://localhost/api/user", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

describe("user route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
    expect((await PATCH(patchRequest({ name: "Test" }))).status).toBe(401);
  });

  it("returns 404 when user not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().user.findUnique.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("returns current user data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().user.findUnique.mockResolvedValue({ id: "user-1" });

    const response = await GET();

    expect(response.status).toBe(200);
  });

  it("updates profile fields", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().user.update.mockResolvedValue({ id: "user-1" });

    const response = await PATCH(
      patchRequest({ name: "New", locale: "fr" })
    );

    expect(response.status).toBe(200);
    expect(getDb().user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "New", locale: "fr" },
      })
    );
  });

  it("requires current password when setting new password", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await PATCH(patchRequest({ newPassword: "password123" }));

    expect(response.status).toBe(400);
  });

  it("rejects invalid current password", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().user.findUnique.mockResolvedValue({ hashedPassword: "hashed" });
    mockCompare.mockResolvedValue(false);

    const response = await PATCH(
      patchRequest({ currentPassword: "wrong", newPassword: "password123" })
    );

    expect(response.status).toBe(400);
  });

  it("updates password when valid", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().user.findUnique.mockResolvedValue({ hashedPassword: "hashed" });
    mockCompare.mockResolvedValue(true);
    mockHash.mockResolvedValue("hashed-new");
    getDb().user.update.mockResolvedValue({ id: "user-1" });

    const response = await PATCH(
      patchRequest({ currentPassword: "ok", newPassword: "password123" })
    );

    expect(response.status).toBe(200);
    expect(getDb().user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hashedPassword: "hashed-new",
        }),
      })
    );
  });
});
