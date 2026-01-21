/**
 * @jest-environment node
 */

import { POST } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";

// Mock the db module
const mockCreate = jest.fn();
const mockFindUnique = jest.fn();

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

// Mock user defaults
jest.mock("@/lib/user-defaults", () => ({
  createUserDefaults: jest.fn().mockResolvedValue(undefined),
}));

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("POST /api/auth/register", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, REGISTRATION_INVITE_CODE: "valid-code" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createRequest = (body: object) => {
    return new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  it("creates a new user with valid data and invite code", async () => {
    mockFindUnique.mockResolvedValue(null); // User doesn't exist
    mockCreate.mockResolvedValue({
      id: "new-user-id",
      email: "test@example.com",
      name: "Test User",
    });

    const request = createRequest({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
      inviteCode: "valid-code",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("User created successfully");
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        hashedPassword: "hashed_password",
        name: "Test User",
      },
    });
  });

  it("returns 403 for invalid invite code", async () => {
    const request = createRequest({
      email: "test@example.com",
      password: "password123",
      inviteCode: "wrong-code",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Invalid invite code");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 403 when no invite code is configured", async () => {
    process.env.REGISTRATION_INVITE_CODE = "";

    const request = createRequest({
      email: "test@example.com",
      password: "password123",
      inviteCode: "any-code",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Invalid invite code");
  });

  it("returns 400 when user already exists", async () => {
    mockFindUnique.mockResolvedValue({
      id: "existing-user",
      email: "test@example.com",
    });

    const request = createRequest({
      email: "test@example.com",
      password: "password123",
      inviteCode: "valid-code",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("User already exists");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid email format", async () => {
    const request = createRequest({
      email: "invalid-email",
      password: "password123",
      inviteCode: "valid-code",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 for password shorter than 8 characters", async () => {
    const request = createRequest({
      email: "test@example.com",
      password: "short",
      inviteCode: "valid-code",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("returns 400 when invite code is missing", async () => {
    const request = createRequest({
      email: "test@example.com",
      password: "password123",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid input");
  });

  it("creates user without name when name is not provided", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: "new-user-id",
      email: "test@example.com",
    });

    const request = createRequest({
      email: "test@example.com",
      password: "password123",
      inviteCode: "valid-code",
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        hashedPassword: "hashed_password",
        name: undefined,
      },
    });
  });
});
