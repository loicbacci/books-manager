# AGENTS.md

Guidance for coding agents working in this repository. Base rules and project context.

## Project Overview

Books Manager is a self-hosted, multi-user web application for tracking personal book collections. Users can manage books they've read, are reading, or plan to read, with progress tracking, ratings, wishlist management, and statistics dashboards. The app supports bilingual content (English/French) and invite-only registration.

## Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- UI: Chakra UI v3 + Tailwind CSS (prefixed with `tw-`)
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js v5 (Auth.js) with credentials provider
- i18n: next-intl (English/French)
- Charts: Recharts
- Deployment: Docker + Docker Compose

## Design Language

The UI is intended to feel literary, warm, and refined rather than techy.

- Typography: Headings use "Playfair Display" for a classic, bookish feel; body text uses "Source Sans 3" for clarity.
- Palette: Deep burgundy (`brand`) as the primary, warm gold (`gold`) as the accent, cream (`cream`) for surfaces, and ink (`ink`) for text.
- Surfaces: Soft, light backgrounds with raised cards; rounded corners (`md` to `xl`) and gentle shadows (`card`, `elevated`).
- Layout: Clean grids and stacks, lots of whitespace, and card-based sections for dashboards and lists.
- Navigation: Desktop uses a fixed left sidebar; mobile uses a bottom icon bar; emoji icons are used sparingly to add warmth.
- Charts: Recharts are used for stats; prefer brand/neutral colors over default bright palettes.
- Components: Prefer Chakra primitives; Tailwind `tw-` utilities only for layout/spacing.
- Practicality: Some parts can be intentionally utilitarian; do not sacrifice UX just to force the theme.
- Restraint: The UI does not need to lean heavily into the library aesthetic everywhere.
- Defaults: Using default colors can be fine (e.g. yellow stars, Recharts default palettes).
- Consistency: If a page uses `surface.*` tokens, avoid mixing in `gray.*` unless it is a deliberate neutral; keep backgrounds aligned across public/auth pages.
- States: Use clear visual states for loading/empty/error (spinners, empty cards, muted text) and keep them minimal.
- Icons: Prefer emoji for friendly accents; avoid mixing in multiple icon styles in the same view.
- Density: Favor readable spacing and avoid overly tight controls; dashboard cards should remain scannable at a glance.

## Build and test commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript check
npm run format           # Format with Prettier
npm run format:check     # Check formatting

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

## Code style guidelines

- TypeScript is strict (`tsconfig.json` uses `"strict": true`); keep API responses and Prisma queries fully typed.
- Formatting is enforced by Prettier (`.prettierrc`): semicolons, double quotes, 2-space tabs, 80-char print width, Tailwind class sorting via `prettier-plugin-tailwindcss`.
- Linting uses `eslint-config-next` (core web vitals + TypeScript); unused variables are disallowed unless prefixed with `_`.
- Prefer Chakra UI components for UI primitives; use Tailwind utilities only for layout/spacing and keep the `tw-` prefix.
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
- Styling: use Chakra UI components first; Tailwind utilities with `tw-` prefix for layout/spacing.
- Per-user data: genres, formats, genders, nationalities are user-scoped.
- Series: books can belong to a series with a per-book order; series use slugs for URLs.
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

- Run `npm run db:generate` after modifying `prisma/schema.prisma`.
- Add new translation keys to both `messages/en.json` and `messages/fr.json`.
- Keep API responses and database queries fully typed.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan (as described in .agent/PLANS.md) from design to implementation.
