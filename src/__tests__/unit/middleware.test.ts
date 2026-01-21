const createMiddleware = jest.fn((routing?: unknown) => {
  return `mock-middleware-${routing ? "with-config" : "default"}`;
});

jest.mock("next-intl/middleware", () => ({
  __esModule: true,
  default: (routing: unknown) => createMiddleware(routing),
}));

describe("middleware", () => {
  it("exports a middleware created with routing config", async () => {
    const middlewareModule = await import("@/middleware");

    expect(middlewareModule.default).toBe("mock-middleware-with-config");
    expect(createMiddleware).toHaveBeenCalled();
  });

  it("exports matcher config", async () => {
    const middlewareModule = await import("@/middleware");

    expect(middlewareModule.config).toEqual({
      matcher: ["/((?!api|_next|.*\\..*).*)"],
    });
  });
});
