const mockFindUnique = jest.fn();
const mockCompare = jest.fn();
type AuthorizeFn = (
  credentials: { email?: string; password?: string } | undefined
) => Promise<unknown>;
type SessionCallback = (params: {
  session: { user?: { id?: string } };
  token: { sub?: string };
}) => Promise<{ user?: { id?: string } }>;
type JwtCallback = (params: {
  token: { sub?: string };
  user?: { id?: string };
}) => Promise<{ sub?: string }>;

let capturedOptions: {
  providers?: Array<{ authorize: AuthorizeFn }>;
  callbacks?: { session: SessionCallback; jwt: JwtCallback };
} | undefined;

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: (...args: unknown[]) => mockCompare(...args),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (options: Record<string, unknown>) => options,
}));

jest.mock("next-auth", () => ({
  __esModule: true,
  default: (options: Record<string, unknown>) => {
    capturedOptions = options;
    return {
      handlers: { GET: jest.fn(), POST: jest.fn() },
      signIn: jest.fn(),
      signOut: jest.fn(),
      auth: jest.fn(),
    };
  },
}));

describe("auth config", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    capturedOptions = undefined;
    await import("@/lib/auth");
  });

  it("rejects authorize when credentials are missing", async () => {
    expect(capturedOptions?.providers).toBeDefined();
    const authorize = capturedOptions!.providers![0].authorize;

    await expect(authorize(undefined)).resolves.toBeNull();
  });

  it("rejects authorize when user does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(capturedOptions?.providers).toBeDefined();
    const authorize = capturedOptions!.providers![0].authorize;

    await expect(
      authorize({ email: "user@example.com", password: "secret" })
    ).resolves.toBeNull();
  });

  it("rejects authorize when password is invalid", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      image: null,
      hashedPassword: "hashed",
    });
    mockCompare.mockResolvedValue(false);
    expect(capturedOptions?.providers).toBeDefined();
    const authorize = capturedOptions!.providers![0].authorize;

    await expect(
      authorize({ email: "user@example.com", password: "bad" })
    ).resolves.toBeNull();
  });

  it("returns a session user when password is valid", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      image: "avatar.png",
      hashedPassword: "hashed",
    });
    mockCompare.mockResolvedValue(true);
    expect(capturedOptions?.providers).toBeDefined();
    const authorize = capturedOptions!.providers![0].authorize;

    await expect(
      authorize({ email: "user@example.com", password: "good" })
    ).resolves.toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      image: "avatar.png",
    });
  });

  it("adds user id to session in callback", async () => {
    expect(capturedOptions?.callbacks).toBeDefined();
    const sessionCallback = capturedOptions!.callbacks!.session;

    const session = await sessionCallback({
      session: { user: {} },
      token: { sub: "user-1" },
    });

    expect(session.user?.id).toBe("user-1");
  });

  it("sets token sub when user exists in jwt callback", async () => {
    expect(capturedOptions?.callbacks).toBeDefined();
    const jwtCallback = capturedOptions!.callbacks!.jwt;

    const token = await jwtCallback({
      token: {},
      user: { id: "user-2" },
    });

    expect(token.sub).toBe("user-2");
  });
});
