# AGENTS.md

Guidance for coding agents working in this repository. Base rules and project context.

## Project Overview

Books Manager is a self-hosted, multi-user web application for tracking personal book collections. Users can manage books they've read, are reading, or plan to read, with progress tracking, ratings, wishlist management, and statistics dashboards. The app supports bilingual content (English/French) and invite-only registration.

## Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- UI: shadcn/ui + Tailwind CSS + Remix Icon (preset `b39i8bS88` — rhea / mauve / fuchsia / Inter)
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js v5 (Auth.js) with credentials provider
- i18n: next-intl (English/French)
- Charts: Recharts
- Toasts: sonner
- Deployment: Docker + Docker Compose

## Design Language

UI follows the shadcn preset (`b39i8bS88`): rhea radius, mauve base, fuchsia accent, Inter typography.

- Components: Prefer shadcn/ui primitives from `src/components/ui/`.
- Icons: Prefer Remix Icon (`@remixicon/react`); avoid mixing icon families in the same view.
- Styling: Use Tailwind utility classes with design tokens (`bg-background`, `text-muted-foreground`, `bg-primary`, etc.).
- Charts: Recharts for stats; prefer theme/neutral colors over default bright palettes.
- States: Keep loading/empty/error states clear and minimal (skeletons, empty cards, muted text).
- Density: Favor readable spacing; dashboard cards should stay scannable.

## Build and test commands

```bash
# Development
pnpm run dev              # Start DB + Prisma generate + Next.js
pnpm run build            # Production build
pnpm run start            # Start production server
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Fix ESLint issues
pnpm run type-check       # TypeScript check
pnpm run format           # Format with Prettier
pnpm run format:check     # Check formatting

# Database
pnpm run db:generate      # Generate Prisma client
pnpm run db:push          # Push schema to DB (dev)
pnpm run db:migrate       # Create migration (dev)
pnpm run db:migrate:prod  # Deploy migrations (prod)
pnpm run db:studio        # Open Prisma Studio
pnpm run db:seed          # Seed database

# Docker (development - DB only)
docker compose -f docker-compose.dev.yml up -d

# Docker (production - full stack)
docker compose up -d --build

# Testing
pnpm run test              # Run all tests
pnpm run test:watch        # Run tests in watch mode
pnpm run test:coverage     # Run tests with coverage report
pnpm run test:ci           # Run tests in CI mode
```

## Code style guidelines

- TypeScript is strict (`tsconfig.json` uses `"strict": true`); keep API responses and Prisma queries fully typed.
- Formatting is enforced by Prettier (`.prettierrc`): semicolons, double quotes, 2-space tabs, 80-char print width, Tailwind class sorting via `prettier-plugin-tailwindcss`.
- Linting uses `eslint-config-next` (core web vitals + TypeScript); unused variables are disallowed unless prefixed with `_`.
- Prefer shadcn/ui components; style with Tailwind tokens and Remix icons.
- Add new translation keys to both `messages/en.json` and `messages/fr.json`.

## Testing instructions

- Unit tests: `src/__tests__/unit/`
- Integration tests: `src/__tests__/integration/`
- Component tests: `src/__tests__/components/`
- Test utilities: `src/__tests__/test-utils.tsx`
- Mocks: `src/__mocks__/`

Notes:

- Use `createMock*` factories from `test-utils.tsx`.
- Component tests should use the custom `render` function from test-utils.
- API route tests should use `@jest-environment node`.

## Architecture

Directory structure:

```text
src/
├── app/
│   ├── [locale]/               # Localized pages (en, fr)
│   │   ├── (authenticated)/    # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── authors/
│   │   │   ├── library/
│   │   │   ├── books/[id]/
│   │   │   ├── series/
│   │   │   ├── sheet-import/
│   │   │   ├── statistics/
│   │   │   └── settings/
│   ├── login/
│   └── register/
│   └── api/
│       ├── auth/
│       ├── books/
│       ├── authors/
│       ├── genres/
│       ├── formats/
│       ├── genders/
│       ├── nationalities/
│       ├── series/
│       ├── stats/
│       └── user/
├── components/
├── i18n/
├── lib/
├── messages/
├── types/
└── __tests__/
```

## Key Patterns

- Locale routing: pages under `[locale]` use next-intl.
- Styling: shadcn/ui + Tailwind design tokens + Remix Icon.
- Per-user data: genres, formats, genders, nationalities are user-scoped.
- Series: books can belong to a series with a per-book order; series use slugs for URLs.
- Ratings: stored as 1–10 (half-star scale); UI shows 5 stars.
- Invite-only registration: `REGISTRATION_INVITE_CODE` required.
- Route protection: Next.js middleware with NextAuth session checks.
- API design: RESTful routes with proper HTTP methods.

## Environment Variables

Required in `.env`:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
REGISTRATION_INVITE_CODE=<generate with: openssl rand -hex 16>
```

## Development Notes

- Run `pnpm run db:generate` after modifying `prisma/schema.prisma`.
- Add new translation keys to both `messages/en.json` and `messages/fr.json`.
- Keep API responses and database queries fully typed.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.
