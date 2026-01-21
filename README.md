# Books Manager

> This project was built with [Claude Code](https://claude.ai/code) and OpenAI Codex.

A self-hosted web application for managing your personal book collection. Track books you've read, are currently reading, or plan to read, with detailed statistics and progress tracking.

## Features

- **Book Management**: Track title, authors, genres, format, cover, pages, and reading progress
- **Series & Authors**: Group books into series (with order) and browse dedicated author/series pages
- **Online Book Search**: Fetch metadata from Google Books & Open Library (covers, pages, descriptions)
- **Reading Status**: To Read, Reading, Read, Dropped
- **Progress Tracking**: Current page, percentage, start/end dates
- **Personal Notes**: Summary, favorite quote, favorite moment
- **Ratings**: Rate your books (5-star scale)
- **Wishlist**: Mark books you want to read
- **Dashboard**: Quick overview with stats cards and currently reading books
- **Advanced Statistics**:
  - Reading trends with charts (monthly books read, pages over time)
  - Genre distribution with customizable colors
  - Author demographics (gender and nationality breakdowns)
  - Rating distribution analysis
  - Year-over-year tracking
- **Search & Filter**: Find books by title, author, status, or wishlist
- **Sorting & Grouping**: Sort books by title/author/dates/progress and group by series/author/status/format
- **Multi-format Support**: Physical books, audiobooks, e-books, Wattpad, and custom formats
- **Customizable**: Add your own genres, formats, genders, and nationalities
- **Multi-user**: Each user has their own library (invite-only registration)
- **Bilingual**: English and French support (next-intl)
- **Comprehensive Testing**: Full test suite with Jest and React Testing Library

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Chakra UI v3 + Tailwind CSS
- PostgreSQL + Prisma
- NextAuth.js v5
- Docker

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- PostgreSQL (or use the provided Docker setup)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/loicbacci/books-manager.git
   cd books-manager
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booksmanager"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
   REGISTRATION_INVITE_CODE="<generate with: openssl rand -hex 16>"
   ```

4. Start the development database:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

5. Set up the database:

   ```bash
   npm run db:push
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Production Deployment

### Using Docker Compose

1. Create a `.env` file with production values:

   ```env
   NEXTAUTH_SECRET=<secure-random-string>
   REGISTRATION_INVITE_CODE=<your-invite-code>
   ```

2. Build and start:

   ```bash
   docker compose up -d --build
   ```

   This starts:
   - The Next.js application on port 3000
   - PostgreSQL database on port 5432
   - Runs database migrations automatically

3. Data is persisted in `./data/postgres/`

### Reverse Proxy

For HTTPS, put a reverse proxy (nginx, Caddy, Traefik) in front of the application and update `NEXTAUTH_URL` to your domain.

## Testing

The project includes comprehensive tests using Jest and React Testing Library:

```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Generate coverage report
npm run test:ci           # Run tests in CI mode
```

Test structure:

- **Unit tests**: `src/__tests__/unit/` - Individual utilities and functions
- **Integration tests**: `src/__tests__/integration/` - API routes and data flows
- **Component tests**: `src/__tests__/components/` - React components
- **Test utilities**: `src/__tests__/test-utils.tsx` - Shared helpers and factories

## Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start development server     |
| `npm run build`      | Build for production         |
| `npm run start`      | Start production server      |
| `npm run lint`       | Run ESLint                   |
| `npm run lint:fix`   | Fix ESLint issues            |
| `npm run type-check` | Run TypeScript checks        |
| `npm run format`     | Format code with Prettier    |
| `npm run db:migrate` | Create a new migration       |
| `npm run db:push`    | Push schema to database      |
| `npm run db:studio`  | Open Prisma Studio           |
| `npm run db:seed`    | Seed database with test data |
| `npm test`           | Run all tests                |
| `npm run test:watch` | Run tests in watch mode      |

## License

MIT
