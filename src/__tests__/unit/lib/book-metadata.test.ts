import { getBookByISBN, searchBooks } from "@/lib/book-metadata";

const mockFetch = jest.fn();

describe("book-metadata", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it("returns Google results when available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "google-1",
            volumeInfo: {
              title: "Google Book",
              authors: ["Author"],
              imageLinks: { thumbnail: "http://img" },
              pageCount: 120,
              industryIdentifiers: [{ type: "ISBN_13", identifier: "123" }],
            },
          },
        ],
      }),
    });

    const results = await searchBooks("query");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "google-1",
      title: "Google Book",
      authors: ["Author"],
      coverUrl: "https://img",
      isbn: "123",
    });
  });

  it("falls back to Open Library when Google returns empty", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          docs: [
            {
              key: "OL1",
              title: "Open Library Book",
              author_name: ["Author"],
              cover_i: 42,
            },
          ],
        }),
      });

    const results = await searchBooks("query");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "OL1",
      title: "Open Library Book",
      coverUrl: "https://covers.openlibrary.org/b/id/42-L.jpg",
    });
  });

  it("returns null when Google ISBN lookup fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await getBookByISBN("invalid");

    expect(result).toBeNull();
  });

  it("returns Google ISBN details when found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            volumeInfo: {
              title: "Found Book",
              authors: ["Author"],
              imageLinks: { smallThumbnail: "http://thumb" },
              pageCount: 200,
              publishedDate: "2020",
              publisher: "Publisher",
            },
          },
        ],
      }),
    });

    const result = await getBookByISBN("isbn");

    expect(result).toMatchObject({
      title: "Found Book",
      authors: ["Author"],
      coverUrl: "https://thumb",
      source: "google",
    });
  });

  it("falls back to Open Library ISBN details", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: "Open Book",
          covers: [9],
          authors: [{ key: "/authors/OL1A" }],
          number_of_pages: 100,
          description: { value: "Desc" },
          publish_date: "2000",
          publishers: ["Pub"],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: "Author Name" }),
      });

    const result = await getBookByISBN("isbn");

    expect(result).toMatchObject({
      title: "Open Book",
      authors: ["Author Name"],
      coverUrl: "https://covers.openlibrary.org/b/id/9-L.jpg",
      source: "openlibrary",
    });
  });
});
