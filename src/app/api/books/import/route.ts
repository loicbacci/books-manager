import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateUniqueSlug } from "@/lib/slugify";

const importAuthorSchema = z
  .object({
    key: z.string().min(1),
    mode: z.enum(["existing", "new"]),
    existingId: z.string().optional(),
    name: z.string().min(1).max(200),
    genderId: z.string().optional().nullable(),
    nationalityIds: z.array(z.string()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === "existing" && !value.existingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "existingId is required for existing authors",
        path: ["existingId"],
      });
    }
  });

const importBookSchema = z
  .object({
    title: z.string().min(1).max(500),
    totalPages: z.number().int().positive().optional().nullable(),
    currentPage: z.number().int().min(0).optional().nullable(),
    status: z.enum(["TO_READ", "READING", "READ", "DROPPED"]).optional(),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    summary: z.string().max(5000).optional().nullable(),
    favoriteQuote: z.string().max(2000).optional().nullable(),
    favoriteMoment: z.string().max(2000).optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    formatId: z.string().optional().nullable(),
    genreIds: z.array(z.string()).optional(),
    authorKeys: z.array(z.string()).min(1),
  })
  .superRefine((value, ctx) => {
    if (
      value.totalPages != null &&
      value.currentPage != null &&
      value.currentPage > value.totalPages
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "currentPage cannot exceed totalPages",
        path: ["currentPage"],
      });
    }
  });

const importSchema = z.object({
  authors: z.array(importAuthorSchema),
  books: z.array(importBookSchema).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = importSchema.parse(await request.json());
    const userId = session.user.id;

    const result = await db.$transaction(async (tx) => {
      const authorIdByKey = new Map<string, string>();
      const existingIds = payload.authors
        .filter((author) => author.mode === "existing" && author.existingId)
        .map((author) => author.existingId as string);

      const genderIds = Array.from(
        new Set(payload.authors.map((author) => author.genderId).filter(Boolean))
      ) as string[];
      if (genderIds.length) {
        const count = await tx.gender.count({
          where: { id: { in: genderIds }, userId },
        });
        if (count !== genderIds.length) {
          throw new Error("Invalid genderIds");
        }
      }

      const nationalityIds = Array.from(
        new Set(
          payload.authors.flatMap((author) => author.nationalityIds ?? [])
        )
      );
      if (nationalityIds.length) {
        const count = await tx.nationality.count({
          where: { id: { in: nationalityIds }, userId },
        });
        if (count !== nationalityIds.length) {
          throw new Error("Invalid nationalityIds");
        }
      }

      if (existingIds.length) {
        const existingAuthors = await tx.author.findMany({
          where: { id: { in: existingIds }, userId },
        });
        existingAuthors.forEach((author) => {
          const matched = payload.authors.find(
            (entry) => entry.existingId === author.id
          );
          if (matched) {
            authorIdByKey.set(matched.key, author.id);
          }
        });
      }

      let createdAuthorsCount = 0;

      for (const author of payload.authors) {
        if (authorIdByKey.has(author.key)) continue;
        if (author.mode === "existing") continue;

        const existing = await tx.author.findFirst({
          where: { userId, name: author.name },
        });

        if (existing) {
          authorIdByKey.set(author.key, existing.id);
          continue;
        }

        const created = await tx.author.create({
          data: {
            name: author.name,
            userId,
            genderId: author.genderId ?? null,
            nationalities: {
              create: (author.nationalityIds ?? []).map((nationalityId) => ({
                nationalityId,
              })),
            },
          },
        });
        createdAuthorsCount += 1;
        authorIdByKey.set(author.key, created.id);
      }

      const uniqueGenreIds = Array.from(
        new Set(payload.books.flatMap((book) => book.genreIds ?? []))
      );
      if (uniqueGenreIds.length) {
        const count = await tx.genre.count({
          where: { id: { in: uniqueGenreIds }, userId },
        });
        if (count !== uniqueGenreIds.length) {
          throw new Error("Invalid genreIds");
        }
      }

      const uniqueFormatIds = Array.from(
        new Set(
          payload.books
            .map((book) => book.formatId)
            .filter((id): id is string => !!id)
        )
      );
      if (uniqueFormatIds.length) {
        const count = await tx.format.count({
          where: { id: { in: uniqueFormatIds }, userId },
        });
        if (count !== uniqueFormatIds.length) {
          throw new Error("Invalid formatIds");
        }
      }

      const createdBookIds: string[] = [];

      for (const book of payload.books) {
        const authorIds = Array.from(
          new Set(
            book.authorKeys
              .map((key) => authorIdByKey.get(key))
              .filter((id): id is string => !!id)
          )
        );

        if (authorIds.length === 0) {
          throw new Error("Missing author mapping for book");
        }

        const slug = await generateUniqueSlug(
          book.title,
          userId,
          async (candidate, scopedUserId) => {
            const existing = await tx.book.findUnique({
              where: { userId_slug: { userId: scopedUserId, slug: candidate } },
            });
            return !!existing;
          }
        );

        const genreIds = Array.from(new Set(book.genreIds ?? []));
        const createdBook = await tx.book.create({
          data: {
            userId,
            title: book.title,
            slug,
            totalPages: book.totalPages ?? null,
            currentPage: book.currentPage ?? 0,
            status: book.status ?? "TO_READ",
            rating: book.rating ?? null,
            summary: book.summary ?? null,
            favoriteQuote: book.favoriteQuote ?? null,
            favoriteMoment: book.favoriteMoment ?? null,
            startDate: book.startDate ? new Date(book.startDate) : null,
            endDate: book.endDate ? new Date(book.endDate) : null,
            formatId: book.formatId ?? null,
            authors: {
              create: authorIds.map((authorId) => ({ authorId })),
            },
            ...(genreIds.length
              ? {
                  genres: {
                    create: genreIds.map((genreId) => ({ genreId })),
                  },
                }
              : {}),
          },
          select: { id: true },
        });
        createdBookIds.push(createdBook.id);
      }

      return { createdBookIds, createdAuthorsCount };
    });

    return NextResponse.json(
      {
        createdBooks: result.createdBookIds.length,
        createdBookIds: result.createdBookIds,
        createdAuthors: result.createdAuthorsCount,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Missing author mapping for book") {
      return NextResponse.json(
        { error: "Missing author mapping for book" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error importing books:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
