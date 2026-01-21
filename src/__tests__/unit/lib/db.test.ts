import { PrismaClient } from "@prisma/client";

describe("db", () => {
  it("reuses a prisma client instance in non-production", async () => {
    const { db } = await import("@/lib/db");

    expect(db).toBeInstanceOf(PrismaClient);
    expect((globalThis as { prisma?: PrismaClient }).prisma).toBe(db);
  });
});
