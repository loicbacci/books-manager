/**
 * @jest-environment node
 */

import { GET as getStats } from "@/app/api/stats/route";
import { GET as getDetailed } from "@/app/api/stats/detailed/route";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    book: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const getDb = () =>
  (jest.requireMock("@/lib/db") as {
    db: { book: { count: jest.Mock; findMany: jest.Mock } };
  }).db;

describe("stats routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthorized", async () => {
    mockAuth.mockResolvedValue(null);

    expect((await getStats()).status).toBe(401);
    expect((await getDetailed()).status).toBe(401);
  });

  it("returns summary stats", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    db.book.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);

    db.book.findMany
      .mockResolvedValueOnce([{ totalPages: 100 }, { totalPages: 200 }])
      .mockResolvedValueOnce([
        {
          id: "reading-1",
          slug: "reading-1",
          title: "Reading",
          coverUrl: null,
          currentPage: 50,
          totalPages: 100,
          authors: [{ author: { name: "Author" } }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "recent-1",
          slug: "recent-1",
          title: "Recent",
          coverUrl: null,
          status: "READ",
          rating: 8,
          authors: [{ author: { name: "Author" } }],
        },
      ]);

    const response = await getStats();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalBooks).toBe(10);
    expect(data.totalPagesRead).toBe(300);
    expect(data.currentlyReading[0].progress).toBe(50);
  });

  it("returns detailed stats", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    getDb().book.findMany.mockResolvedValue([
      {
        totalPages: 300,
        rating: 8,
        endDate: new Date(),
        genres: [
          { genre: { id: "g1", name: "Fantasy", color: "blue" } },
        ],
        authors: [
          {
            author: {
              id: "a1",
              gender: { name: "Woman" },
              nationality: { name: "French" },
            },
          },
        ],
      },
    ]);

    const response = await getDetailed();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalBooksRead).toBe(1);
    expect(data.genreDistribution[0].name).toBe("Fantasy");
    expect(data.genderDistribution[0].name).toBe("Woman");
    expect(data.nationalityDistribution[0].name).toBe("French");
  });
});
