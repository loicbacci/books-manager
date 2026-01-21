# Book Slug Migration Guide

This guide explains how to migrate your database to use URL-friendly slugs instead of IDs in book URLs.

## What Changed

- Book URLs now use slugs (e.g., `/books/harry-potter-philosophers-stone`) instead of IDs
- The database schema now includes a `slug` field for each book
- Slugs are automatically generated from book titles
- Duplicate titles get numbered suffixes (e.g., `dune`, `dune-1`, `dune-2`)

## Migration Steps

### 1. Start the Database

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Generate Prisma Client

```bash
npm run db:generate
```

### 3. Create and Apply the Migration

```bash
npm run db:migrate -- --name add-book-slug
```

This will:

- Add the `slug` column to the `books` table
- Create a unique constraint on `userId` + `slug`

### 4. Populate Slugs for Existing Books

Run the migration script to generate slugs for all existing books:

```bash
npx tsx scripts/add-book-slugs.ts
```

This script will:

- Generate URL-friendly slugs from book titles
- Handle conflicts by appending numbers (e.g., `-1`, `-2`)
- Update all books in the database

### 5. Verify the Migration

```bash
npm run db:studio
```

Open Prisma Studio and check that all books now have a `slug` field populated.

### 6. Start the Application

```bash
npm run dev
```

## How Slugs Work

### URL Format

Before: `/books/clx1234567890abcdef`
After: `/books/the-fellowship-of-the-ring`

### Slug Generation Rules

- Lowercase only
- Spaces replaced with hyphens
- Special characters removed
- Accents normalized (é → e)
- Multiple hyphens collapsed to single hyphen
- Leading/trailing hyphens removed

### Examples

| Title                                  | Slug                                  |
| -------------------------------------- | ------------------------------------- |
| The Fellowship of the Ring             | `the-fellowship-of-the-ring`          |
| 1984                                   | `1984`                                |
| Harry Potter & the Philosopher's Stone | `harry-potter-the-philosophers-stone` |
| Dune (first book)                      | `dune`                                |
| Dune (second with same title)          | `dune-1`                              |
| À la recherche du temps perdu          | `a-la-recherche-du-temps-perdu`       |

## Backwards Compatibility

The API still accepts both slugs and IDs for book lookups, so old URLs will continue to work:

- `/books/the-hobbit` ✅ (new slug format)
- `/books/clx1234567890abcdef` ✅ (old ID format, still works)

## Troubleshooting

### Error: "Can't reach database server"

Make sure the database is running:

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Error: "operation not permitted" (Windows)

Stop the development server before running migrations:

```bash
# Stop dev server (Ctrl+C)
npm run db:migrate
# Start dev server again
npm run dev
```

### Missing slugs after migration

Run the population script again:

```bash
npx tsx scripts/add-book-slugs.ts
```

### Duplicate slug errors

The migration script handles conflicts automatically. If you see errors, check that the script completed successfully.

## Rollback (if needed)

If you need to rollback this migration:

```bash
npm run db:migrate -- --name remove-book-slug
```

Then modify the schema to remove the `slug` field and revert the code changes.
