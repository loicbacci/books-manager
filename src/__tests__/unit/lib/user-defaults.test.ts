import { createUserDefaults } from "@/lib/user-defaults";

// Mock the db module
jest.mock("@/lib/db", () => ({
  db: {
    format: {
      createMany: jest.fn().mockResolvedValue({ count: 4 }),
    },
    gender: {
      createMany: jest.fn().mockResolvedValue({ count: 5 }),
    },
    genre: {
      createMany: jest.fn().mockResolvedValue({ count: 15 }),
    },
  },
}));

import { db } from "@/lib/db";

describe("createUserDefaults", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates default formats for the user", async () => {
    await createUserDefaults("test-user-id");

    expect(db.format.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ name: "Book", userId: "test-user-id" }),
        expect.objectContaining({ name: "Audiobook", userId: "test-user-id" }),
        expect.objectContaining({ name: "E-book", userId: "test-user-id" }),
        expect.objectContaining({ name: "Wattpad", userId: "test-user-id" }),
      ]),
    });
  });

  it("creates default genders for the user", async () => {
    await createUserDefaults("test-user-id");

    expect(db.gender.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ name: "Man", userId: "test-user-id" }),
        expect.objectContaining({ name: "Woman", userId: "test-user-id" }),
        expect.objectContaining({ name: "Non-binary", userId: "test-user-id" }),
        expect.objectContaining({ name: "Other", userId: "test-user-id" }),
        expect.objectContaining({ name: "Unknown", userId: "test-user-id" }),
      ]),
    });
  });

  it("creates default genres for the user", async () => {
    await createUserDefaults("test-user-id");

    expect(db.genre.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ name: "Fiction", userId: "test-user-id" }),
        expect.objectContaining({ name: "Fantasy", userId: "test-user-id" }),
        expect.objectContaining({ name: "Romance", userId: "test-user-id" }),
      ]),
    });
  });

  it("creates all defaults in parallel", async () => {
    await createUserDefaults("test-user-id");

    // All three should be called
    expect(db.format.createMany).toHaveBeenCalledTimes(1);
    expect(db.gender.createMany).toHaveBeenCalledTimes(1);
    expect(db.genre.createMany).toHaveBeenCalledTimes(1);
  });

  it("uses the correct user ID for all defaults", async () => {
    const userId = "different-user-id";
    await createUserDefaults(userId);

    const formatCall = (db.format.createMany as jest.Mock).mock.calls[0][0];
    const genderCall = (db.gender.createMany as jest.Mock).mock.calls[0][0];
    const genreCall = (db.genre.createMany as jest.Mock).mock.calls[0][0];

    // Check all items have the correct userId
    formatCall.data.forEach((item: { userId: string }) => {
      expect(item.userId).toBe(userId);
    });
    genderCall.data.forEach((item: { userId: string }) => {
      expect(item.userId).toBe(userId);
    });
    genreCall.data.forEach((item: { userId: string }) => {
      expect(item.userId).toBe(userId);
    });
  });
});
