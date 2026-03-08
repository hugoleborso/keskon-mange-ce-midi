# Keskon Mange

## Project
Collaborative restaurant picker MVP. Next.js 15 App Router + Drizzle + PostgreSQL + Auth.js + React Leaflet.

## Commands
- `pnpm dev` - Dev server (http://localhost:3000)
- `pnpm build` - Production build
- `pnpm lint` - Biome lint check
- `pnpm lint:fix` - Biome lint + auto-fix
- `pnpm format` - Biome format check
- `pnpm format:fix` - Biome format + auto-fix
- `pnpm check` - Biome lint + format check (CI)
- `pnpm check:fix` - Biome lint + format + auto-fix
- `pnpm typecheck` - TypeScript type check (tsc --noEmit)
- `pnpm test` - Vitest unit tests
- `pnpm test:coverage` - Vitest with coverage report
- `pnpm test:e2e` - Playwright E2E tests
- `pnpm knip` - Dead code detection
- `pnpm db:up` - Start local PostgreSQL (Docker)
- `pnpm db:down` - Stop local PostgreSQL
- `pnpm db:generate` - Generate Drizzle migration files
- `pnpm db:migrate` - Apply migrations (ASK USER)
- `pnpm db:push` - Push schema directly (dev only, ASK USER)
- `pnpm db:studio` - Open Drizzle Studio

## Architecture
- `src/app/` - Next.js App Router (pages, layouts, API routes)
- `src/components/` - React components by feature (ui/, map/, restaurants/, reviews/, filters/, random-draw/, favorites/, layout/)
- `src/server/db/` - Drizzle schema (`schema.ts`) and client (`index.ts`)
- `src/server/actions/` - Server Actions for mutations
- `src/server/queries/` - Server-side read functions (for Server Components)
- `src/server/auth.ts` - Auth.js v5 configuration
- `src/lib/` - Utilities, Zod validations, constants, geocoding
- `src/hooks/` - Client-side React hooks
- `src/providers/` - React Context providers (map, session)
- `messages/` - Paraglide i18n messages (fr.json)
- `e2e/` - Playwright E2E tests
- `docs/adr/` - Architecture Decision Records

## Conventions
- Server Components by default. Only add "use client" when truly needed.
- All mutations via Server Actions in `src/server/actions/`.
- All reads via query functions in `src/server/queries/` called from Server Components.
- Zod validation for ALL inputs (form + server action).
- URL state with nuqs for filters (shareable URLs).
- All user-facing strings through Paraglide `m.key()`.
- Biome handles all linting AND formatting. No ESLint. No Prettier.
- Tests colocated: `foo.ts` -> `foo.test.ts` in the same directory.

## Database Rules
- NEVER run `pnpm db:migrate` or `pnpm db:push` without asking the user first.
- Edit schema at `src/server/db/schema.ts`, then run `pnpm db:generate`.
- Ask user to apply with `pnpm db:push` (dev) or `pnpm db:migrate` (prod).

## Testing Rules
- 100% unit test coverage target for: validations, server queries, server actions, utilities, hooks.
- E2E tests cover every user journey from specs.
- Mock the DB in unit tests (never hit real database).
- After writing/modifying code, always run relevant tests.

## Git Commits
- Use conventional commits (feat:, fix:, chore:, docs:, refactor:, test:, ci:).
- Commit atomically: one logical change per commit. Do NOT bundle unrelated changes.
- Commit as you code — don't accumulate large diffs.

## Before Committing
1. `pnpm check` (biome lint + format)
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm knip`
