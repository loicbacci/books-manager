# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Books Manager is a multi-user web application for tracking personal book collections. Users can manage books they've read, are reading, or plan to read, with features including reading progress tracking, ratings, statistics, and wishlist management.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Chakra UI v3 + Tailwind CSS (prefixed with `tw-`)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5 (Auth.js) with credentials provider
- **i18n**: next-intl (English/French)
- **Charts**: Recharts
- **Deployment**: Docker + Docker Compose

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript check
npm run format           # Format with Prettier

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB (dev)
npm run db:migrate       # Create migration (dev)
npm run db:migrate:prod  # Deploy migrations (prod)
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Docker (development - DB only)
docker compose -f docker-compose.dev.yml up -d

# Docker (production - full stack)
docker compose up -d --build

# Testing
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
npm run test:ci           # Run tests in CI mode
```

## Testing

The project uses Jest and React Testing Library for comprehensive testing:

- **Unit tests**: `src/__tests__/unit/` - Test individual utilities and functions
- **Integration tests**: `src/__tests__/integration/` - Test API routes and data flows
- **Component tests**: `src/__tests__/components/` - Test React components
- **Test utilities**: `src/__tests__/test-utils.tsx` - Shared test helpers and factories
- **Mocks**: `src/__mocks__/` - Mock implementations for Prisma and other modules

### Running Tests

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
```

### Writing Tests

- Use `createMock*` factories from `test-utils.tsx` to create test data
- Mock the database using `src/__mocks__/db.ts`
- Component tests should use the custom `render` function from test-utils
- API route tests should use `@jest-environment node` directive

## Architecture

### Directory Structure

```text
src/
├── app/
│   ├── [locale]/               # Localized pages (en, fr)
│   │   ├── (authenticated)/    # Protected routes
│   │   │   ├── dashboard/      # Main dashboard with stats overview
│   │   │   ├── library/        # Book library with search/filters
│   │   │   ├── books/[id]/     # Individual book detail page
│   │   │   ├── statistics/     # Advanced stats with charts
│   │   │   └── settings/       # User settings & custom entities
│   │   ├── login/              # Login page
│   │   └── register/           # Registration page
│   └── api/                    # API routes
│       ├── auth/               # Authentication endpoints
│       ├── books/              # Book CRUD operations
│       ├── authors/            # Author management
│       ├── genres/             # Genre management
│       ├── formats/            # Format management
│       ├── genders/            # Gender management
│       ├── nationalities/      # Nationality management
│       ├── stats/              # Statistics endpoints
│       └── user/               # User profile endpoints
├── components/
│   ├── books/                  # Book-related components (modals, forms)
│   ├── layout/                 # Layout components
│   ├── providers/              # React context providers
│   └── ui/                     # Reusable UI components
├── i18n/                       # Internationalization config
├── lib/                        # Shared utilities (db, auth, theme)
├── messages/                   # Translation files (en.json, fr.json)
├── types/                      # TypeScript type definitions
└── __tests__/                  # Test files
    ├── unit/                   # Unit tests
    ├── integration/            # API integration tests
    ├── components/             # Component tests
    └── test-utils.tsx          # Test helpers and factories
```

### Key Patterns

- **Locale routing**: All pages under `[locale]` use next-intl for i18n
- **Chakra + Tailwind**: Chakra UI for components, Tailwind (with `tw-` prefix) for utilities
- **Per-user data**: All configurable entities (genres, formats, genders, nationalities) are user-scoped
- **Invite-only registration**: `REGISTRATION_INVITE_CODE` env var required to create accounts
- **Route protection**: Authenticated routes use Next.js middleware with NextAuth session checks
- **API design**: RESTful API routes with proper HTTP methods (GET, POST, PUT, DELETE)

### Features

#### Dashboard (`/dashboard`)

- Quick stats overview (books read, currently reading, read this year, pages read)
- Currently reading books with progress bars
- Recent books grid with covers and status badges

#### Library (`/library`)

- Full book collection with search functionality
- Filter by status (All, To Read, Reading, Read, Dropped, Wishlist)
- Grid view with book covers, progress, ratings, and metadata
- Add new books via modal dialog
- Online book search integration (Google Books & Open Library APIs)

#### Book Details (`/books/[id]`)

- Complete book information display
- Edit mode for updating all book fields (including cover URL)
- Online book search in edit mode (fetch metadata from internet)
- Progress tracking (current page / total pages)
- Reading dates (start/end)
- Personal notes (summary, favorite quote, favorite moment)
- Rating system (5-star scale)
- Author(s), genre(s), and format management
- Delete book functionality with confirmation

#### Book Metadata Fetching (`/api/books/search`)

- Integration with Google Books API (primary, free, no auth required)
- Open Library API as fallback
- Fetches: title, authors, cover images (high quality), page count, descriptions, ISBN, publisher, dates
- Search by title, author, or ISBN

#### Statistics (`/statistics`)

- Advanced analytics with Recharts visualizations:
  - Genre distribution (pie chart with custom colors)
  - Author gender distribution (pie chart)
  - Author nationality distribution (pie chart)
  - Monthly reading trends (line chart)
  - Monthly pages read (bar chart)
  - Rating distribution (bar chart)
- Summary stats (total books, pages, average rating, unique authors/genres)

#### Settings (`/settings`)

- User profile management (name, locale)
- Custom entity management:
  - Genres (with color customization)
  - Formats (book, audiobook, e-book, etc.)
  - Genders (for author demographics)
  - Nationalities (for author demographics)
- Create, delete custom entities
- Real-time validation and feedback

### Data Model

- `User` → owns Books, Authors, Genres, Formats, Genders, Nationalities
- `Book` → has Authors (many-to-many), Genres (many-to-many), Format, ReadingStatus
- `Author` → has Gender, Nationality
- Configurable entities per user: Genre, Format, Gender, Nationality

## Environment Variables

Required in `.env`:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
REGISTRATION_INVITE_CODE=<generate with: openssl rand -hex 16>
```

## Development Notes

- **Database changes**: Always run `npm run db:generate` after modifying `prisma/schema.prisma`
- **Testing**: Write tests for new features using the factories in `test-utils.tsx`
- **Translations**: Add new translation keys to both `messages/en.json` and `messages/fr.json`
- **Styling**: Use Chakra UI components first, Tailwind utilities (with `tw-` prefix) for spacing/layout
- **Type safety**: All API responses and database queries are fully typed with TypeScript
