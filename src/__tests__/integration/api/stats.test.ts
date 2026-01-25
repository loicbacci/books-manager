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
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

const getDb = () =>
  (jest.requireMock("@/lib/db") as {
    db: {
      book: { count: jest.Mock; aggregate: jest.Mock; findMany: jest.Mock };
      $queryRaw: jest.Mock;
    };
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
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    db.book.aggregate
      .mockResolvedValueOnce({ _sum: { totalPages: 300 } })
      .mockResolvedValueOnce({ _sum: { totalPages: 120 } });
    db.book.findMany
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
      ])
      .mockResolvedValueOnce([
        {
          id: "wish-1",
          slug: "wish-1",
          title: "Wishlist",
          coverUrl: null,
          status: "TO_READ",
          rating: null,
          authors: [{ author: { name: "Author" } }],
        },
      ]);

    const response = await getStats();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalBooks).toBe(10);
    expect(data.pagesReadThisYear).toBe(300);
    expect(data.pagesReadThisMonth).toBe(120);
    expect(data.currentlyReading[0].progress).toBe(50);
  });

  it("returns detailed stats", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const db = getDb();
    const now = new Date("2024-02-10T00:00:00.000Z");

    db.$queryRaw
      .mockResolvedValueOnce([
        { total_books: 1, total_pages: 300, avg_rating: 8 },
      ])
      .mockResolvedValueOnce([
        { id: "g1", name: "Fantasy", color: "blue", count: 1 },
      ])
      .mockResolvedValueOnce([{ name: "Woman", count: 1 }])
      .mockResolvedValueOnce([{ name: "French", count: 1 }])
      .mockResolvedValueOnce([{ month: now, count: 1 }])
      .mockResolvedValueOnce([{ month: now, pages: 300 }])
      .mockResolvedValueOnce([{ rating: 8, count: 1 }])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 1 }]);

    const response = await getDetailed();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary.totalBooksRead).toBe(1);
    expect(data.genreDistribution[0].name).toBe("Fantasy");
    expect(data.genderDistribution[0].name).toBe("Woman");
    expect(data.nationalityDistribution[0].name).toBe("French");
  });
});
