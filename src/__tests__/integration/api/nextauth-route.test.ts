/**
 * @jest-environment node
 */

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock("@/lib/auth", () => ({
  handlers: { GET: mockGet, POST: mockPost },
}));

describe("auth route exports", () => {
  it("re-exports NextAuth handlers", async () => {
    const authRoute = await import("@/app/api/auth/[...nextauth]/route");

    expect(authRoute.GET).toBe(mockGet);
    expect(authRoute.POST).toBe(mockPost);
  });
});
