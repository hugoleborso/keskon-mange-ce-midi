# Keskon Mange - Full Rework Plan

## Context

The current app is a minimal Next.js 13.4 single-page app that picks a random restaurant from a Google Sheets data source. It has no auth, no database usage (Prisma schema exists but is unused), no map, no reviews, no tests, no CI/CD, and no i18n. The codebase uses ESLint + Prettier.

The goal is a complete rewrite into a modern, well-tooled, educational ("vulgatech") collaborative restaurant picker MVP. The app will be deployed free on Vercel and serve as a reference codebase with ADRs and an architecture guide for vulgatech sessions where tech people explain frontend, backend, databases, and devX to business people.

---

## Stack Decisions

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) | Latest stable, Vercel-native |
| Runtime | Node.js 22 LTS | Current LTS |
| Database | Neon PostgreSQL (free tier: 0.5GB, 190 compute hrs/mo) | Generous free tier, serverless driver, Vercel-native |
| ORM | Drizzle ORM + `@neondatabase/serverless` | SQL-transparent (great for vulgatech), type-safe, lightweight |
| Auth | Auth.js v5 with Google OAuth only | Free, simple, one provider |
| Map | React Leaflet + OpenStreetMap tiles | Completely free, no API key |
| Geocoding | Nominatim (OSM) | Free, no API key, 1 req/s limit is fine for manual restaurant addition |
| Image storage | Vercel Blob (free tier: 250MB) | Native Vercel integration, simple SDK |
| UI | shadcn/ui + Tailwind CSS v4 + Radix UI | Modern, accessible, well-documented |
| Forms | React Hook Form + Zod | Standard, type-safe validation |
| State | Server Components (default) + nuqs (URL state for filters) + React Context (map state) | No unnecessary client state |
| i18n | Paraglide (FR only, infrastructure for future EN) | Compile-time, type-safe, tree-shakable |
| Linting/Formatting | Biome | Single tool replaces ESLint + Prettier |
| Dead code | Knip | Detects unused exports, files, dependencies |
| Unit tests | Vitest + Testing Library | Fast, Vite-native, React support |
| E2E tests | Playwright | Industry standard, multi-browser |
| CI/CD | GitHub Actions + Vercel | Automated quality gates + deploy |
| Package manager | pnpm | Keep current, fast, disk-efficient |

Each major decision gets a formal ADR via the `adr-writer` skill (stored in `docs/adr/`).

---

## Part 1: Tooling & Guardrails (THE FOUNDATION)

This is the most critical part. Every subsequent epic depends on this being right.

### 1.1 CLAUDE.md

Create `CLAUDE.md` at project root (committed to git, shared with team):

```markdown
# Keskon Mange

## Project
Collaborative restaurant picker MVP. Next.js 15 App Router + Drizzle + Neon + Auth.js + React Leaflet.

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
- `pnpm db:generate` - Generate Drizzle migration files
- `pnpm db:migrate` - Apply migrations (ASK USER)
- `pnpm db:push` - Push schema directly (dev only, ASK USER)
- `pnpm db:studio` - Open Drizzle Studio

## Architecture
- `src/app/` - Next.js App Router (pages, layouts, API routes)
- `src/components/` - React components organized by feature (ui/, map/, restaurants/, reviews/, filters/, random-draw/, favorites/, layout/)
- `src/server/db/` - Drizzle schema (`schema.ts`) and client (`index.ts`)
- `src/server/actions/` - Server Actions for mutations (create, update, delete)
- `src/server/queries/` - Server-side read functions (for Server Components)
- `src/server/auth.ts` - Auth.js v5 configuration
- `src/lib/` - Utilities, Zod validation schemas, constants, geocoding
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

## Before Committing
1. `pnpm check` (biome lint + format)
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm knip`
```

### 1.2 Claude Code Hooks (`.claude/settings.json` - committed)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs -I {} sh -c 'case \"{}\" in *.ts|*.tsx|*.js|*.jsx|*.json|*.jsonc) cd \"$CLAUDE_PROJECT_DIR\" && pnpm exec biome format --write \"{}\" 2>/dev/null || true ;; esac'"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pre-commit-guard.sh"
          }
        ]
      }
    ]
  }
}
```

### 1.3 Hook Scripts (`.claude/hooks/`)

**`.claude/hooks/pre-commit-guard.sh`** - Blocks `git commit` unless quality checks pass:

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# Only intercept git commit commands
if [[ ! "$COMMAND" =~ ^git\ commit ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

echo "Pre-commit: Running biome check..." >&2
if ! pnpm exec biome check --no-errors-on-unmatched .; then
  echo "BLOCKED: Biome check failed. Run 'pnpm check:fix' first." >&2
  exit 2
fi

echo "Pre-commit: Running typecheck..." >&2
if ! pnpm exec tsc --noEmit; then
  echo "BLOCKED: TypeScript errors found." >&2
  exit 2
fi

echo "Pre-commit: Running knip..." >&2
if ! pnpm exec knip; then
  echo "BLOCKED: Dead code detected. Clean up before committing." >&2
  exit 2
fi

echo "Pre-commit: All checks passed." >&2
exit 0
```

### 1.4 Claude Code Rules (`.claude/rules/`)

**`.claude/rules/testing.md`**:
```markdown
---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---
When creating or modifying a file in src/server/ or src/lib/, always create or update
the corresponding .test.ts file. Run `pnpm test` after writing tests.
Coverage target: 100% for server/, lib/, hooks/.
```

**`.claude/rules/database.md`**:
```markdown
---
paths:
  - "src/server/db/**"
  - "drizzle.config.ts"
---
NEVER run pnpm db:push, pnpm db:migrate, or any command that modifies the database.
Only edit src/server/db/schema.ts and run pnpm db:generate.
Ask the user to apply changes.
```

### 1.5 Biome Configuration (`biome.json`)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "dist",
      "coverage",
      "src/paraglide"
    ]
  }
}
```

### 1.6 Knip Configuration (`knip.json`)

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": [
    "src/app/**/*.{ts,tsx}",
    "src/middleware.ts"
  ],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [
    "src/paraglide/**",
    "e2e/**"
  ],
  "ignoreDependencies": [
    "@biomejs/biome"
  ],
  "next": {
    "entry": ["src/app/**/*.{ts,tsx}", "next.config.ts"]
  }
}
```

### 1.7 Vitest Configuration (`vitest.config.ts`)

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/paraglide/**",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/components/ui/**",
        "src/test/**",
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
```

### 1.8 Playwright Configuration (`playwright.config.ts`)

Standard Playwright config with:
- Base URL: `http://localhost:3000`
- WebServer: `pnpm dev`
- Projects: chromium, firefox, webkit (mobile-first viewport)
- Test dir: `e2e/`
- Storage state for authenticated sessions

### 1.9 GitHub Actions CI (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".node-version"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm check        # biome lint + format
      - run: pnpm typecheck     # tsc --noEmit
      - run: pnpm knip          # dead code

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: ".node-version", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [quality, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: ".node-version", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          AUTH_GOOGLE_ID: ${{ secrets.AUTH_GOOGLE_ID }}
          AUTH_GOOGLE_SECRET: ${{ secrets.AUTH_GOOGLE_SECRET }}
      - run: pnpm test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
```

### 1.10 package.json scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format .",
    "format:fix": "biome format --write .",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "knip": "knip",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## Part 2: Target Folder Structure

```
keskon-mange-ce-midi/
  .claude/
    settings.json            # Shared hooks (committed)
    settings.local.json      # Local overrides (gitignored)
    hooks/
      pre-commit-guard.sh    # Pre-commit quality gate
    rules/
      testing.md             # Testing enforcement
      database.md            # DB safety rules
    skills/
      adr-writer/            # Existing ADR skill
  .github/
    workflows/
      ci.yml                 # CI pipeline (lint, typecheck, knip, tests)
      claude-code.yml        # Claude Code Action (issues + PR comments)
      slack-notify.yml       # Post PR/preview links to Slack
  docs/
    adr/                     # Architecture Decision Records
      001-database.md
      002-orm.md
      003-auth.md
      004-map.md
      005-i18n.md
      006-image-storage.md
      007-tooling.md
    features/
      vulgatech-rework/
        specs.md             # Existing specs
        plan.md              # This file
    guide/
      architecture.md        # Vulgatech architecture guide
  e2e/
    fixtures/
    auth.spec.ts
    restaurants.spec.ts
    map.spec.ts
    reviews.spec.ts
    filters.spec.ts
    favorites.spec.ts
    random-draw.spec.ts
  messages/
    fr.json                  # Paraglide French messages
  public/
    food-bg.jpg
  src/
    app/
      (auth)/
        login/page.tsx
      (main)/
        layout.tsx           # Main layout: header + nav
        page.tsx             # Home: map + list + filters + draw CTA
        restaurants/
          new/page.tsx
          [id]/
            page.tsx         # Restaurant detail (fiche)
            edit/page.tsx
        favorites/page.tsx
      api/
        auth/[...nextauth]/route.ts
        upload/route.ts
      layout.tsx             # Root layout (html, body, providers)
      globals.css            # Tailwind v4 CSS
    components/
      ui/                    # shadcn/ui components
      map/
        restaurant-map.tsx   # Dynamic import wrapper
        map-inner.tsx        # Leaflet map (client-only)
        restaurant-marker.tsx
        map-popup.tsx
      restaurants/
        restaurant-card.tsx
        restaurant-list.tsx
        restaurant-form.tsx
      reviews/
        review-form.tsx
        review-list.tsx
        star-rating.tsx
      filters/
        filter-bar.tsx
        price-filter.tsx
      random-draw/
        draw-button.tsx
        draw-animation.tsx
        draw-result.tsx
      favorites/
        favorite-button.tsx
      layout/
        header.tsx
        nav.tsx
    server/
      db/
        index.ts             # Drizzle client (Neon serverless)
        schema.ts            # All tables
        migrations/          # Generated by drizzle-kit
      actions/
        restaurants.ts
        reviews.ts
        favorites.ts
      queries/
        restaurants.ts
        reviews.ts
        favorites.ts
      auth.ts                # Auth.js v5 config
    lib/
      utils.ts               # cn() helper
      constants.ts           # Restaurant types, labels, price ranges
      geocoding.ts           # Nominatim integration
      validations/
        restaurant.ts        # Zod schemas
        review.ts
    hooks/
      use-map-context.ts
      use-filters.ts
    providers/
      map-provider.tsx
      session-provider.tsx
    middleware.ts             # Auth route protection
    test/
      setup.ts               # Vitest global setup
  biome.json
  knip.json
  drizzle.config.ts
  vitest.config.ts
  playwright.config.ts
  next.config.ts
  tsconfig.json
  package.json
  pnpm-lock.yaml
  .env.example
  .gitignore
  .node-version
  CLAUDE.md
  README.md
```

---

## Part 3: Database Schema (Drizzle)

Tables: `users`, `accounts`, `sessions`, `verification_tokens` (Auth.js), `restaurants`, `reviews`, `favorites`.

Key design decisions:
- `averageRating` and `reviewsCount` are **computed at query time** (SQL subquery), not stored. Avoids consistency issues.
- `reviews` has a **unique constraint on (restaurantId, authorId)** enforcing 1 review per user per restaurant.
- `favorites` uses a **composite primary key (userId, restaurantId)**.
- `labels` stored as `text[]` (Postgres array).
- `priceRange` is an enum: `"EUR_1"`, `"EUR_2"`, `"EUR_3"`, `"EUR_4"`.
- `status` is an enum: `"active"`, `"temporarily_closed"`, `"permanently_closed"`.

---

## Part 4: Epic Breakdown

### Epic 0 - Project Setup & Tooling (includes i18n)
**Deps**: None
**Goal**: Clean slate with all tooling, configs, CI/CD, CLAUDE.md, hooks, and Paraglide i18n ready. App builds and deploys (placeholder page). Every string from day 1 goes through `m.key()`.

Tasks:
1. Wipe old code (src/core/, src/helpers/, prisma/, old configs)
2. Init Next.js 15 + React 19 + TypeScript in package.json
3. Configure Tailwind v4 (CSS-first, no tailwind.config.ts)
4. Configure Biome (`biome.json`)
5. Configure Knip (`knip.json`)
6. Configure Vitest (`vitest.config.ts`, `src/test/setup.ts`)
7. Configure Playwright (`playwright.config.ts`, `e2e/`)
8. Set up shadcn/ui with Tailwind v4 (`components.json`, initial components)
9. **Set up Paraglide i18n**: install `@inlang/paraglide-next`, configure in `next.config.ts`, create `messages/fr.json` with initial keys, create `src/paraglide/` output. All placeholder page strings must use `m.key()`.
10. Create CLAUDE.md
11. Create `.claude/settings.json` with hooks
12. Create `.claude/hooks/pre-commit-guard.sh`
13. Create `.claude/rules/testing.md` and `database.md`
14. Create `.github/workflows/ci.yml`
15. Create `.env.example`
16. Create `.node-version` (22)
17. Update `.gitignore`
18. Create placeholder `src/app/layout.tsx` and `src/app/page.tsx` (all strings via Paraglide)
19. Verify: `pnpm dev`, `pnpm build`, `pnpm check`, `pnpm test`, `pnpm knip` all pass

Tests: `e2e/smoke.spec.ts` (app loads without errors)

### Epic 0.5 - ADRs
**Deps**: Epic 0
**Goal**: Write all 7 ADRs using the `adr-writer` skill.

ADRs to write (in `docs/adr/`):
1. `001-database.md` - Neon PostgreSQL vs Vercel Postgres vs Turso vs Supabase
2. `002-orm.md` - Drizzle vs Prisma vs Kysely
3. `003-auth.md` - Auth.js v5 vs Clerk vs Supabase Auth
4. `004-map.md` - React Leaflet + OSM vs Mapbox vs Google Maps
5. `005-i18n.md` - Paraglide vs next-intl vs react-i18next
6. `006-image-storage.md` - Vercel Blob vs UploadThing vs Cloudinary
7. `007-tooling.md` - Biome + Knip vs ESLint + Prettier

### Epic 1 - Database + Auth
**Deps**: Epic 0
**Goal**: Drizzle connected to Neon, Auth.js with Google OAuth, protected routes.

Tasks:
1. Install: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`
2. Create `drizzle.config.ts`
3. Create `src/server/db/schema.ts` (all tables)
4. Create `src/server/db/index.ts` (Drizzle client singleton)
5. Install: `next-auth@beta`, `@auth/drizzle-adapter`
6. Create `src/server/auth.ts` (Auth.js config with Google + Drizzle adapter)
7. Create `src/app/api/auth/[...nextauth]/route.ts`
8. Create `src/providers/session-provider.tsx`
9. Create `src/middleware.ts` (protect all routes except /login, /api/auth)
10. Create `src/app/(auth)/login/page.tsx`
11. Create `src/components/layout/header.tsx` (user avatar, sign out)
12. Update root layout with SessionProvider
13. Ask user to run `pnpm db:push` to create tables

Unit tests: schema types, auth config
E2E: `e2e/auth.spec.ts` - login redirect, sign in with Google (mocked), sign out, protected routes

### Epic 2 - Restaurant CRUD
**Deps**: Epic 1
**Goal**: Create, list, view, edit restaurants with geocoding.

Tasks:
1. Create `src/lib/constants.ts` (RESTAURANT_TYPES, LABELS, PRICE_RANGES)
2. Create `src/lib/validations/restaurant.ts` (Zod schemas)
3. Create `src/lib/geocoding.ts` (Nominatim address -> lat/lng)
4. Create `src/server/queries/restaurants.ts` (getRestaurants, getRestaurantById, getRestaurantsByFilters, findPotentialDuplicates)
5. Create `src/server/actions/restaurants.ts` (createRestaurant, updateRestaurant)
6. Create `src/components/restaurants/restaurant-card.tsx`
7. Create `src/components/restaurants/restaurant-list.tsx`
8. Create `src/components/restaurants/restaurant-form.tsx` (React Hook Form + Zod)
9. Create `src/app/(main)/layout.tsx` (header, nav)
10. Create `src/app/(main)/page.tsx` (list view for now, map comes in Epic 3)
11. Create `src/app/(main)/restaurants/new/page.tsx`
12. Create `src/app/(main)/restaurants/[id]/page.tsx` (restaurant detail/fiche)
13. Create `src/app/(main)/restaurants/[id]/edit/page.tsx`
14. Implement duplicate detection warning in form

Unit tests: Zod validation, geocoding (mocked), queries (mocked DB), actions (mocked DB + auth), form component, card component
E2E: `e2e/restaurants.spec.ts` - CRUD flow, duplicate warning

### Epic 3 - Map Integration
**Deps**: Epic 2
**Goal**: Interactive map with restaurant markers, ratings on pins, popup, zoom-to.

Tasks:
1. Install: `react-leaflet`, `leaflet`, `@types/leaflet`
2. Create `src/providers/map-provider.tsx` (MapContext: selectedId, flyTo)
3. Create `src/hooks/use-map-context.ts`
4. Create `src/components/map/restaurant-map.tsx` (dynamic import, ssr: false)
5. Create `src/components/map/map-inner.tsx` (actual Leaflet map)
6. Create `src/components/map/restaurant-marker.tsx` (custom DivIcon with rating)
7. Create `src/components/map/map-popup.tsx` (name, rating, type, price, photo)
8. Update `src/app/(main)/page.tsx` (split layout: map + list, responsive)
9. Update `src/app/(main)/restaurants/[id]/page.tsx` ("Show on map" link)
10. Wrap main layout with MapProvider

Unit tests: MapProvider context, marker rendering, popup content
E2E: `e2e/map.spec.ts` - map loads, markers visible, click opens popup, zoom works

### Epic 4 - Reviews & Photos
**Deps**: Epic 2
**Goal**: 1 review per user per restaurant, rating 1-5, comment, photos. Average rating computed.

Tasks:
1. Create `src/lib/validations/review.ts`
2. Create `src/server/queries/reviews.ts` (getReviewsByRestaurant, getUserReview)
3. Create `src/server/actions/reviews.ts` (createOrUpdateReview, deleteReview)
4. Create `src/app/api/upload/route.ts` (Vercel Blob upload, image compression)
5. Create `src/components/reviews/star-rating.tsx` (interactive 1-5 stars)
6. Create `src/components/reviews/review-form.tsx`
7. Create `src/components/reviews/review-list.tsx`
8. Update restaurant detail page with reviews section
9. Handle "Modifier mon avis" vs "Ajouter un avis" based on existing review
10. Update restaurant queries to include computed averageRating/reviewsCount

Unit tests: validation, actions (unique constraint), star rating interaction, form behavior
E2E: `e2e/reviews.spec.ts` - add review, edit, delete, rating updates, photo upload

### Epic 5 - Filters & Favorites
**Deps**: Epic 3, Epic 4
**Goal**: URL-based filters (dineIn, takeAway, priceRange) apply to list + map + draw. Personal favorites.

Tasks:
1. Install: `nuqs`
2. Create `src/hooks/use-filters.ts` (nuqs parsers for URL state)
3. Create `src/components/filters/filter-bar.tsx`
4. Create `src/components/filters/price-filter.tsx`
5. Update `src/server/queries/restaurants.ts` - accept filter params
6. Update `src/app/(main)/page.tsx` - pass filters to queries and map
7. Create `src/server/actions/favorites.ts` (toggleFavorite)
8. Create `src/server/queries/favorites.ts` (getUserFavorites, isUserFavorite)
9. Create `src/components/favorites/favorite-button.tsx` (optimistic toggle)
10. Create `src/app/(main)/favorites/page.tsx`
11. Add favorite indicator on cards and markers

Unit tests: filter parsing/URL sync, favorite toggle, filter bar interactions
E2E: `e2e/filters.spec.ts`, `e2e/favorites.spec.ts`

### Epic 6 - Random Draw
**Deps**: Epic 5
**Goal**: "Keskon mange ?" CTA, random pick from filtered results, animation, map zoom, relaunch.

Tasks:
1. Create `src/server/actions/restaurants.ts` - add `drawRandomRestaurant(filters)`
2. Create `src/components/random-draw/draw-button.tsx` (big CTA)
3. Create `src/components/random-draw/draw-animation.tsx` (fun animation sequence)
4. Create `src/components/random-draw/draw-result.tsx` (result card)
5. Integrate with MapProvider `flyTo()` to zoom on selected restaurant
6. Handle empty state ("Aucun resto ne matche")
7. Handle relaunch ("Relancer la machine du dej")
8. Mobile-responsive draw experience

Unit tests: draw action respects filters/status, button states, animation lifecycle
E2E: `e2e/random-draw.spec.ts` - draw, empty state, relaunch, map zoom

### Epic 7 - Polish & Accessibility
**Deps**: Epics 2-6
**Goal**: Fun microcopy, mobile polish, accessibility, loading/error states. (i18n is already set up since Epic 0 -- all strings already go through Paraglide.)

Tasks:
1. Add fun microcopy from specs ("Le destin a parle", "Meme la carte a faim", etc.) to `messages/fr.json`
2. Mobile-first responsive polish (375px baseline)
3. Accessibility pass (ARIA labels, keyboard nav, focus management)
4. Loading states (`loading.tsx` files, Skeleton components)
5. Error boundaries (`error.tsx` files)

Unit tests: message key rendering
E2E: visual checks on mobile viewport

### Epic 8 - DevOps, Slack-to-PR Pipeline & Documentation
**Deps**: All previous
**Goal**: Final CI/CD, Vercel preview on PRs, Slack-to-Claude-to-PR pipeline, architecture guide, README, final test coverage audit.

Tasks:

**Vercel Preview Deployments:**
1. Connect GitHub repo to Vercel project (Vercel GitHub Integration)
2. Every PR automatically gets a preview deployment URL
3. Vercel bot comments the preview link on the PR
4. Configure env vars for preview environments (Neon branch DB or shared dev DB)

**Claude Code GitHub Action (claude-code-action):**
5. Create `.github/workflows/claude-code.yml` using `@anthropics/claude-code-action`
6. Configure triggers:
   - On issue creation with label `claude` → Claude Code reads the issue, creates a branch, implements, opens a PR
   - On PR comment with `@claude` → Claude Code responds to review comments, pushes fixes
7. Set `ANTHROPIC_API_KEY` as GitHub secret
8. Configure the action with project CLAUDE.md so it follows all conventions
9. The resulting PR auto-triggers Vercel preview + CI pipeline

**Slack-to-GitHub-Issue bridge (the full loop):**
10. Create a Slack Workflow (or use Zapier/n8n free tier) in the `#keskonmange` channel:
    - Trigger: message mentioning `@Claude` in the channel
    - Action: creates a GitHub Issue on the repo with label `claude` and the Slack message as body
    - Bonus: posts back to Slack with the issue link
11. The Claude Code GitHub Action picks up the new issue (from step 6), implements the feature, opens a PR
12. Vercel deploys a preview (from step 2)
13. Add a second Slack notification (GitHub → Slack webhook) that posts the PR link + Vercel preview URL back to `#keskonmange`

**Result: Full loop**
```
Slack message "@Claude add a dark mode toggle"
  → GitHub Issue created (label: claude)
  → Claude Code Action implements the feature on a branch
  → PR opened with changes
  → Vercel deploys preview (link posted on PR)
  → Slack notification with PR link + preview URL
  → Team reviews on phone, merges, done
```

**GitHub Actions files:**
- `.github/workflows/ci.yml` - Quality + tests (already exists from Epic 0)
- `.github/workflows/claude-code.yml` - Claude Code on issues + PR comments
- `.github/workflows/slack-notify.yml` - Post PR/preview links back to Slack

**Documentation:**
14. Create `docs/guide/architecture.md` (vulgatech companion guide)
15. Update README.md (setup, contributing, architecture overview, Slack workflow setup)
16. Final CLAUDE.md update with complete project knowledge
17. 100% coverage audit - fill any gaps
18. All E2E scenarios green

---

## Part 5: Testing Strategy Summary

| Layer | Tool | Target | What |
|-------|------|--------|------|
| Validations (`src/lib/validations/`) | Vitest | 100% | Zod schemas: valid/invalid inputs |
| Server queries (`src/server/queries/`) | Vitest | 100% | SQL query shape, filters, computed fields (mocked DB) |
| Server actions (`src/server/actions/`) | Vitest | 100% | Mutations, auth checks, constraints (mocked DB + auth) |
| Utilities (`src/lib/`) | Vitest | 100% | geocoding, cn(), constants |
| Hooks (`src/hooks/`) | Vitest + Testing Library | 100% | Filter parsing, map context |
| Components | Vitest + Testing Library | Key interactions | Form submission, star rating, favorite toggle |
| E2E journeys | Playwright | All user journeys | Auth, CRUD, map, reviews, filters, favorites, draw |

---

## Part 6: ADRs to Write

7 ADRs using the `adr-writer` skill, stored in `docs/adr/`:

1. **Database** - Neon PostgreSQL (vs Vercel Postgres, Turso, Supabase)
2. **ORM** - Drizzle (vs Prisma, Kysely)
3. **Auth** - Auth.js v5 with Google (vs Clerk, Supabase Auth)
4. **Map** - React Leaflet + OSM (vs Mapbox, Google Maps)
5. **i18n** - Paraglide (vs next-intl, react-i18next)
6. **Image Storage** - Vercel Blob (vs UploadThing, Cloudinary)
7. **Tooling** - Biome + Knip (vs ESLint + Prettier)

---

## Part 7: Verification

After full implementation, verify:
1. `pnpm dev` starts without errors
2. `pnpm build` succeeds
3. `pnpm check` (biome) passes
4. `pnpm typecheck` passes
5. `pnpm knip` reports clean
6. `pnpm test:coverage` shows 100%
7. `pnpm test:e2e` all green
8. GitHub Actions CI passes on PR
9. Vercel preview deployment works on every PR (link visible in PR comments)
10. All user journeys from specs work on mobile
11. Creating a GitHub Issue with label `claude` triggers Claude Code Action
12. Claude Code Action creates a PR with passing CI
13. Slack message tagging Claude in `#keskonmange` creates a GitHub Issue
14. PR link + Vercel preview URL is posted back to Slack

---

## Sequencing (dependency graph)

```
Epic 0 (Setup & Tooling + i18n)
  |
  +---> Epic 0.5 (ADRs) [can parallel with Epic 1]
  |
  v
Epic 1 (DB + Auth)
  |
  +----------+----------+
  |                      |
  v                      v
Epic 2 (Restaurant CRUD) |
  |                      |
  +----------+----------+
  |                      |
  v                      v
Epic 3 (Map)        Epic 4 (Reviews & Photos)
  |                      |
  +----------+-----------+
             |
             v
         Epic 5 (Filters & Favorites)
             |
             v
         Epic 6 (Random Draw)
             |
             v
         Epic 7 (Polish & A11y)
             |
             v
         Epic 8 (DevOps, Slack Pipeline & Docs)
```

Epics 3 and 4 can be developed in parallel.
