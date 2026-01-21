/**
 * Book metadata fetching from multiple sources
 * - Google Books API (primary, free, no auth required)
 * - Open Library API (fallback)
 */

export type BookMetadata = {
  title: string;
  authors: string[];
  coverUrl?: string;
  totalPages?: number;
  description?: string;
  isbn?: string;
  publishedDate?: string;
  publisher?: string;
  source: "google" | "openlibrary";
};

export type SearchResult = {
  id: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  totalPages?: number;
  description?: string;
  isbn?: string;
  publishedDate?: string;
  publisher?: string;
};

type GoogleBooksIndustryIdentifier = {
  type?: string;
  identifier?: string;
};

type GoogleBooksVolumeInfo = {
  title?: string;
  authors?: string[];
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  pageCount?: number;
  description?: string;
  industryIdentifiers?: GoogleBooksIndustryIdentifier[];
  publishedDate?: string;
  publisher?: string;
};

type GoogleBooksItem = {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
};

type GoogleBooksResponse = {
  items?: GoogleBooksItem[];
};

type OpenLibraryDoc = {
  key: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  first_sentence?: string[] | string;
  isbn?: string[];
  first_publish_year?: number;
  publisher?: string[];
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibraryDoc[];
};

type OpenLibraryBook = {
  title?: string;
  covers?: number[];
  authors?: Array<{ key: string }>;
  number_of_pages?: number;
  description?: { value?: string } | string;
  publish_date?: string;
  publishers?: string[];
};

type OpenLibraryAuthor = {
  name?: string;
};

/**
 * Search for books using Google Books API
 */
async function searchGoogleBooks(query: string): Promise<SearchResult[]> {
  try {
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.append("q", query);
    url.searchParams.append("maxResults", "10");
    url.searchParams.append("printType", "books");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Google Books API request failed");
    }

    const data = (await response.json()) as GoogleBooksResponse;
    if (!data.items) {
      return [];
    }

    return data.items.map((item) => {
      const volumeInfo = item.volumeInfo;
      return {
        id: item.id,
        title: volumeInfo.title || "Unknown Title",
        authors: volumeInfo.authors || [],
        coverUrl:
          volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ||
          volumeInfo.imageLinks?.smallThumbnail?.replace("http://", "https://"),
        totalPages: volumeInfo.pageCount,
        description: volumeInfo.description,
        isbn: volumeInfo.industryIdentifiers?.find(
          (id) => id.type === "ISBN_13" || id.type === "ISBN_10"
        )?.identifier,
        publishedDate: volumeInfo.publishedDate,
        publisher: volumeInfo.publisher,
      };
    });
  } catch (error) {
    console.error("Error searching Google Books:", error);
    return [];
  }
}

/**
 * Search for books using Open Library API
 */
async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  try {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.append("q", query);
    url.searchParams.append("limit", "10");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Open Library API request failed");
    }

    const data = (await response.json()) as OpenLibrarySearchResponse;
    if (!data.docs || data.docs.length === 0) {
      return [];
    }

    return data.docs.map((doc) => {
      const coverId = doc.cover_i;
      const firstSentence = Array.isArray(doc.first_sentence)
        ? doc.first_sentence[0]
        : doc.first_sentence;
      return {
        id: doc.key,
        title: doc.title || "Unknown Title",
        authors: doc.author_name || [],
        coverUrl: coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          : undefined,
        totalPages: doc.number_of_pages_median,
        description: firstSentence,
        isbn: doc.isbn?.[0],
        publishedDate: doc.first_publish_year?.toString(),
        publisher: doc.publisher?.[0],
      };
    });
  } catch (error) {
    console.error("Error searching Open Library:", error);
    return [];
  }
}

/**
 * Get detailed book information by ISBN
 */
export async function getBookByISBN(
  isbn: string
): Promise<BookMetadata | null> {
  try {
    // Try Google Books first
    const url = new URL("https://www.googleapis.com/books/v1/volumes");
    url.searchParams.append("q", `isbn:${isbn}`);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Google Books API request failed");
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      // Fallback to Open Library
      return getBookByISBNOpenLibrary(isbn);
    }

    const volumeInfo = data.items[0].volumeInfo;
    return {
      title: volumeInfo.title || "Unknown Title",
      authors: volumeInfo.authors || [],
      coverUrl:
        volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ||
        volumeInfo.imageLinks?.smallThumbnail?.replace("http://", "https://"),
      totalPages: volumeInfo.pageCount,
      description: volumeInfo.description,
      isbn,
      publishedDate: volumeInfo.publishedDate,
      publisher: volumeInfo.publisher,
      source: "google",
    };
  } catch (error) {
    console.error("Error fetching book by ISBN:", error);
    return null;
  }
}

async function getBookByISBNOpenLibrary(
  isbn: string
): Promise<BookMetadata | null> {
  try {
    const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as OpenLibraryBook;
    const coverId = data.covers?.[0];

    // Fetch additional info from work
    let authors: string[] = [];
    if (data.authors && data.authors.length > 0) {
      const authorPromises = data.authors.map(async (author) => {
        const authorResponse = await fetch(
          `https://openlibrary.org${author.key}.json`
        );
        const authorData = (await authorResponse.json()) as OpenLibraryAuthor;
        return authorData.name || "Unknown";
      });
      authors = await Promise.all(authorPromises);
    }

    return {
      title: data.title || "Unknown Title",
      authors,
      coverUrl: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : undefined,
      totalPages: data.number_of_pages,
      description:
        typeof data.description === "string"
          ? data.description
          : data.description?.value,
      isbn,
      publishedDate: data.publish_date,
      publisher: data.publishers?.[0],
      source: "openlibrary",
    };
  } catch (error) {
    console.error("Error fetching book from Open Library:", error);
    return null;
  }
}

/**
 * Search for books from multiple sources
 */
export async function searchBooks(query: string): Promise<SearchResult[]> {
  // Try Google Books first (usually better quality)
  const googleResults = await searchGoogleBooks(query);

  if (googleResults.length > 0) {
    return googleResults;
  }

  // Fallback to Open Library
  const openLibraryResults = await searchOpenLibrary(query);
  return openLibraryResults;
}
