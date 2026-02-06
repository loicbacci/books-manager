# Sheet Import Wizard For Books

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This plan must be maintained in accordance with `/.agent/PLANS.md` from the repository root.

## Purpose / Big Picture

Users can import a list of books from an Excel spreadsheet via a new `/sheet-import` page. They can select the worksheet, map columns to book fields, preview rows, fix missing required data, resolve authors, and then import books in one flow. Success is visible by navigating to the new page, completing the wizard, and seeing new books in the library.

## Progress

- [x] (2026-02-02 00:40Z) Inspect existing book creation flow, author components, and database requirements to align import behavior.
- [x] (2026-02-02 00:40Z) Add Excel parsing dependency and build the step 1 UI for file/sheet selection, column mapping, skip rows, previews, and missing data edits.
- [x] (2026-02-02 00:41Z) Build step 2 author resolution UI with default matching and new author metadata fields.
- [x] (2026-02-02 00:41Z) Build step 3 summary + import confirmation and wire up import API.
- [x] (2026-02-02 00:42Z) Add API route for bulk import, translations in EN/FR, and add the entry point button in the Add Book modal.

## Surprises & Discoveries

- None yet.

## Decision Log

- Decision: Implement a dedicated `/api/books/import` endpoint instead of making many per-book API calls from the client.
  Rationale: This keeps import atomic and reduces network chatter for large spreadsheets.
  Date/Author: 2026-02-01 / Codex

## Outcomes & Retrospective

- The import wizard, bulk API endpoint, and translations were added, enabling end-to-end spreadsheet imports with author resolution. Remaining work is limited to runtime validation and UX polish after user testing.

## Context and Orientation

The current book creation flow is implemented in `src/components/books/add-book-modal.tsx`, which posts to `src/app/api/books/route.ts`. Authors are created via `src/app/api/authors/route.ts`, and book slugs are generated in `src/lib/slugify.ts`. The UI uses Chakra UI v3 components and local wrappers under `src/components/ui/`. Translations live in `src/messages/en.json` and `src/messages/fr.json`. The new import experience must live under `src/app/[locale]/(authenticated)/sheet-import/page.tsx` and should follow the design language and component patterns already in use.

## Plan of Work

First, confirm the required book fields by checking Prisma schema and the existing create-book API, then design the client-side wizard. Add the `xlsx` dependency for spreadsheet parsing and build step 1 UI: file upload, sheet selection, column mapping with header guessing, skip-rows control, preview cards, a collapsible raw table, and a missing-information section with inline inputs or row skipping. Next, implement step 2 to resolve authors by matching names against existing authors, with the ability to override matches or create new authors including gender and nationality selections. Step 3 should show summary counts and a full preview with a final import button. Finally, implement a bulk import API endpoint that creates missing authors, generates unique slugs, and inserts books with author relations in a transaction. Add translations for all new labels in both English and French, and add a button in the Add Book modal to navigate to the new page.

## Concrete Steps

Run the following commands from `c:\Users\loicb\Programming\books-manager` to explore and validate:

  - `rg -n "add-book-modal" src/components/books`
  - `rg -n "createBookSchema" src/app/api/books/route.ts`
  - `rg -n "CreateAuthorDialog" src/components/authors`

During implementation, edit these files:

  - `package.json` (add `xlsx`)
  - `src/app/[locale]/(authenticated)/sheet-import/page.tsx` (new wizard)
  - `src/app/api/books/import/route.ts` (bulk import API)
  - `src/components/books/add-book-modal.tsx` (new button)
  - `src/messages/en.json` and `src/messages/fr.json` (translations)

## Validation and Acceptance

Start the app with `npm run dev`, navigate to `/en/sheet-import`, upload an `.xlsx` file with headers and a few rows, map columns, resolve authors, and import. After import, visit `/en/library` to confirm the new books exist. The flow should prevent moving past step 1 if required data is missing and not manually resolved or skipped.

## Idempotence and Recovery

Edits are additive and can be repeated. If import fails due to data issues, the user can adjust mappings or author resolutions and retry without needing to modify the file. If npm dependencies are missing, running `npm install` will resolve them.

## Artifacts and Notes

No artifacts yet.

## Interfaces and Dependencies

Add the `xlsx` npm dependency for parsing Excel workbooks. Introduce a new API handler at `src/app/api/books/import/route.ts` that accepts a JSON payload shaped as:

  - `authors`: array of `{ key, mode, existingId?, name, genderId?, nationalityIds? }`
  - `books`: array of `{ title, totalPages?, rating?, summary?, favoriteQuote?, favoriteMoment?, startDate?, endDate?, authorKeys: string[] }`

The endpoint must return a JSON summary with counts and the created book IDs.

Plan Update Note: Marked all progress items as complete and added an outcomes summary after implementing the wizard, API endpoint, and translations.
