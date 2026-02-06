# E2E Test Suite

This folder contains Playwright end-to-end coverage for key user flows.

## Test Inventory

- `auth.setup.ts`
  - Logs in with the seed user and stores `storageState` for authenticated tests.

- `smoke.spec.ts`
  - Verifies the dashboard loads and primary navigation links are visible.

- `navigation.spec.ts`
  - Clicks through main navigation links (Library, Authors, Series, Stats, Settings).

- `library.spec.ts`
  - Ensures library search filters seeded books correctly.

- `authors.spec.ts`
  - Confirms seeded authors render in the authors list.

- `series-authors.spec.ts`
  - Creates a new author (with gender + nationality) and a new series, then opens the series detail.

- `book-crud.spec.ts`
  - Adds a book, edits title/rating/dates, saves changes, and deletes the book.
  - Verifies success toasts and that the book is removed from the library.

- `sheet-import.spec.ts`
  - Imports a small Excel sheet, resolves missing fields, and confirms books show in the library.

- `stats.spec.ts`
  - Adds a book, marks it as read via edit (end date), and verifies the stats summary updates.

- `language.spec.ts`
  - Switches to French on the login page, logs in, and ensures locale persists to Library.

- `language-persist.spec.ts`
  - Ensures locale stays consistent across navigation for both English and French.

- `errors.spec.ts`
  - Mocks API failures for save/delete and verifies error toasts render.

## Projects

Projects are configured in `playwright.config.ts`:
- Desktop Chrome
- iPhone (mobile)
- iPad (tablet)

All projects share the auth setup and run with a fresh seeded test database.
