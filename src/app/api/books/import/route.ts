import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
    rating: z.number().int().min(1).max(10).optional().nullable(),
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

      // --- Batch Author Resolution ---
      // 1. Collect names to check (excluding those already mapped via existingId)
      const namesToCheck = new Set<string>();
      payload.authors.forEach((author) => {
        if (!authorIdByKey.has(author.key) && author.mode !== "existing") {
          namesToCheck.add(author.name);
        }
      });

      // 2. Bulk fetch existing authors
      if (namesToCheck.size > 0) {
        const existingByName = await tx.author.findMany({
          where: {
            userId,
            name: { in: Array.from(namesToCheck) },
          },
          select: { id: true, name: true },
        });

        existingByName.forEach((author) => {
          // Find entries in payload matching this name and map them
          // Note: multiple keys might map to same name/author
          payload.authors.forEach((entry) => {
            if (
              !authorIdByKey.has(entry.key) &&
              entry.mode !== "existing" &&
              entry.name === author.name
            ) {
              authorIdByKey.set(entry.key, author.id);
            }
          });
        });
      }

      // 3. Create missing authors in parallel
      const authorsToCreate = payload.authors.filter(
        (a) => !authorIdByKey.has(a.key) && a.mode !== "existing"
      );
      
      // Deduplicate by name for creation to avoid constraint errors
      const uniqueAuthorsToCreate = new Map<string, typeof authorsToCreate[0]>();
      authorsToCreate.forEach(a => {
          if(!uniqueAuthorsToCreate.has(a.name)) {
              uniqueAuthorsToCreate.set(a.name, a);
          }
      });

      let createdAuthorsCount = 0;
      
      if (uniqueAuthorsToCreate.size > 0) {
        // Run creations in parallel
        const creations = Array.from(uniqueAuthorsToCreate.values()).map(async (author) => {
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
              select: { id: true, name: true }
            });
            return created;
        });
        
        const createdAuthors = await Promise.all(creations);
        createdAuthorsCount = createdAuthors.length;
        
        // Map back to keys
        createdAuthors.forEach(created => {
            payload.authors.forEach(entry => {
                if (entry.name === created.name && !authorIdByKey.has(entry.key)) {
                    authorIdByKey.set(entry.key, created.id);
                }
            });
        });
      }
      
      // Ensure all keys are mapped (should be covered unless mode='existing' failed earlier validation)
      // Note: If authorsToCreate contained duplicates (Same name, different keys), the uniqueAuthorsToCreate logic handled creation
      // and the mapping loop above handled setting keys for ALL of them.

      // --- Batch Book Creation ---

      // 1. Validate auxiliary data (Genres, Formats) - Optimized checks done above

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

      // 2. Prepare Book Data and Slugs
      // We need to generate unique slugs.
      // Strategy: Generate base slugs. Check collisions in DB. Iterate.
      
      // Strategy: Generate base slugs. Check collisions in DB. Iterate.
      
      const { generateUniqueSlug } = await import("@/lib/slugify"); // Keep generateUniqueSlug as we use it in fallback case
      // Note: slugify generic function not used, we use simpleSlugify below for base generation. 
      // Ideally I should check imports. 'generateUniqueSlug' was imported. 'slugify' likely exported from same file.
      // If not, I can assume standard slugify or import it at top.
      // Let's assume I need to update imports for slugify.
      
      // Actually, let's do a quick local slugify or use the one from lib if available.
      // Checking file: `import { generateUniqueSlug } from "@/lib/slugify";`
      // I will assume `slugify` is named export too. If not valid, I might fail build.
      // I'll take a safe bet and just use the generateUniqueSlug import I have, but I can't batch it easily with that function.
      // I'll assume `slugify` is available or simple enough to reimplement: lowercase, dash separator.
      
      const simpleSlugify = (text: string) => text.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const bookDataWithSlugs: { book: typeof payload.books[0], slug: string }[] = [];
      const desiredSlugs = new Set<string>();
      
      for (const book of payload.books) {
          let slug = simpleSlugify(book.title);
          if (!slug) slug = "untitled";
          
          // Handle collision within the batch first
          let candidate = slug;
          let counter = 1;
          while (desiredSlugs.has(candidate)) {
              candidate = `${slug}-${counter}`;
              counter++;
          }
          desiredSlugs.add(candidate);
          bookDataWithSlugs.push({ book, slug: candidate });
      }
      
      // Now check DB collisions for these desired slugs
      const existingBooks = await tx.book.findMany({
          where: { userId, slug: { in: Array.from(desiredSlugs) } },
          select: { slug: true }
      });
      
      const existingSlugSet = new Set(existingBooks.map(b => b.slug));
      
      // Resolve collisions
      // If a slug exists in DB, we need to change it.
      // And we need to make sure the NEW slug doesn't collide with others in batch or DB.
      // This can be tricky.
      // Simplification: For any that collide, switch to `generateUniqueSlug` (slow path) or just simple loop with individual checks?
      // Or bulk resolve: 
      // If collision, append -imported-[timestamp]? Or just standard increment.
      
      // Given collisions are rare in import (usually new books), optimizing the happy path (batch check 0 collisions) is key.
      // For those with collisions, falling back to individual check is acceptable.
      
      const finalBookCreates = [];
      
      for (const item of bookDataWithSlugs) {
          let finalSlug = item.slug;
          if (existingSlugSet.has(finalSlug)) {
               // Collision with DB. Fallback to slow unique check for this one item
               // Or simply try appending counter locally until unique against `existingSlugSet` (which might be incomplete if we increment? NO, we only fetched existing for the INITIAL set).
               // So if we increment, we might hit another existing book we didn't fetch.
               // So we MUST query DB or `generateUniqueSlug` for this item.
               finalSlug = await generateUniqueSlug(item.book.title, userId, async (s, u) => {
                   const ex = await tx.book.findUnique({ where: { userId_slug: { userId: u, slug: s } }});
                   return !!ex;
               });
          }
          
          finalBookCreates.push({ ...item.book, slug: finalSlug });
      }

      // 3. Create Books in Parallel
      const createdBookIds: string[] = [];
      
      const bookPromises = finalBookCreates.map(async (bookItem) => {
         const authorIds = Array.from(
          new Set(
            bookItem.authorKeys
              .map((key) => authorIdByKey.get(key))
              .filter((id): id is string => !!id)
          )
        );

        if (authorIds.length === 0) throw new Error("Missing author mapping for book");
        
        const genreIds = Array.from(new Set(bookItem.genreIds ?? []));

        const createdBook = await tx.book.create({
          data: {
            userId,
            title: bookItem.title,
            slug: bookItem.slug,
            totalPages: bookItem.totalPages ?? null,
            currentPage: bookItem.currentPage ?? 0,
            status: bookItem.status ?? "TO_READ",
            rating: bookItem.rating ?? null,
            summary: bookItem.summary ?? null,
            favoriteQuote: bookItem.favoriteQuote ?? null,
            favoriteMoment: bookItem.favoriteMoment ?? null,
            startDate: bookItem.startDate ? new Date(bookItem.startDate) : null,
            endDate: bookItem.endDate ? new Date(bookItem.endDate) : null,
            formatId: bookItem.formatId ?? null,
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
        return createdBook.id;
      });
      
      const results = await Promise.all(bookPromises);
      createdBookIds.push(...results);

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
