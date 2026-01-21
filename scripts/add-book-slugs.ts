/**
 * Migration script to add slugs to existing books
 * Run this after updating the schema and generating the Prisma client
 */

import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slugify";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting slug migration...");

  // Get all books without slugs
  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      userId: true,
    },
  });

  console.log(`Found ${books.length} books to process`);

  let updated = 0;
  let errors = 0;

  for (const book of books) {
    try {
      const baseSlug = slugify(book.title);
      let slug = baseSlug;
      let counter = 1;

      // Check for conflicts and append number if needed
      while (true) {
        const existing = await prisma.book.findUnique({
          where: {
            userId_slug: {
              userId: book.userId,
              slug,
            },
          },
        });

        if (!existing || existing.id === book.id) {
          break;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await prisma.book.update({
        where: { id: book.id },
        data: { slug },
      });

      updated++;
      if (updated % 10 === 0) {
        console.log(`Processed ${updated}/${books.length} books...`);
      }
    } catch (error) {
      console.error(`Error updating book ${book.id} (${book.title}):`, error);
      errors++;
    }
  }

  console.log(
    `\nMigration complete!\nUpdated: ${updated}\nErrors: ${errors}\nTotal: ${books.length}`
  );
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
