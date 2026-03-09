# Keskon Mange

Collaborative restaurant picker for teams. Find where to eat, share reviews, and let fate decide with a random draw.

## Features

- **Restaurant directory** — Add, edit, and browse restaurants with type, labels, price range
- **Interactive map** — Leaflet map with color-coded markers by rating, popups, and zoom-to
- **Reviews** — Rate restaurants 1-5 stars with comments (1 review per user per restaurant)
- **Filters** — Filter by dine-in, takeaway, price range (URL-based, shareable)
- **Favorites** — Save restaurants with an optimistic heart toggle
- **Random draw** — "Keskon mange ?!" slot-machine animation that picks a random restaurant and zooms the map
- **Auth** — Google OAuth via Auth.js v5
- **i18n** — French via Paraglide (compile-time, type-safe)
- **Mobile-first** — Responsive layout (map 40vh mobile / 60% desktop)

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Database | PostgreSQL (Docker local, Neon production) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 + Google OAuth |
| Map | React Leaflet + OpenStreetMap |
| Geocoding | Nominatim (OSM) |
| UI | shadcn/ui + Tailwind CSS v4 |
| Validation | Zod |
| URL State | nuqs |
| i18n | Paraglide.js (FR) |
| Linting | Biome 2 |
| Testing | Vitest (100% coverage) + Playwright |
| Dead Code | Knip |

## Quick Start

```bash
fnm use 22
pnpm install
cp .env.example .env.local   # Edit with your values
pnpm db:up                    # Start PostgreSQL
pnpm db:push                  # Create tables
pnpm dev                      # http://localhost:3000
```

> See [docs/install.md](docs/install.md) for detailed instructions and [docs/setup-guide.md](docs/setup-guide.md) for Google OAuth and production setup.

## Architecture

```
src/
  app/                    # Next.js App Router
    (auth)/login/         # Public login page
    (main)/               # Protected routes
      page.tsx            # Home: map + list + filters + draw
      favorites/          # User's favorite restaurants
      restaurants/
        new/              # Create restaurant
        [id]/             # Detail + reviews
          edit/           # Edit restaurant
  components/
    map/                  # Leaflet map, markers, popups
    restaurants/          # Card, list, form, skeleton
    reviews/              # Star rating, form, list
    filters/              # Filter bar, price filter
    random-draw/          # Draw button, animation, result
    favorites/            # Favorite button
    layout/               # Header
    ui/                   # shadcn/ui components
  server/
    db/schema.ts          # Drizzle schema (7 tables)
    actions/              # Server Actions (mutations)
      restaurants.ts      # createRestaurant, updateRestaurant
      reviews.ts          # createReview, updateReview, deleteReview
      favorites.ts        # toggleFavorite
    queries/              # Server queries (reads)
      restaurants.ts      # getRestaurants, getRestaurantById
      reviews.ts          # getReviewsByRestaurant, getUserReview
      favorites.ts        # getUserFavorites, isFavorite, getUserFavoriteRestaurants
    auth.ts               # Auth.js v5 config
  lib/
    constants.ts          # Types, labels, price ranges
    geocoding.ts          # Nominatim address -> lat/lng
    validations/          # Zod schemas
  hooks/
    use-map-context.ts    # Map interaction context
    use-filters.ts        # nuqs URL state for filters
  providers/
    map-provider.tsx      # MapContext (selectedId, flyTo)
    session-provider.tsx  # NextAuth session
  middleware.ts           # Auth route protection
messages/
  fr.json                 # Paraglide i18n (French)
e2e/                      # Playwright E2E tests
docs/
  setup-guide.md          # Full deployment guide
  install.md              # Quick install
```

## Conventions

- **Server Components** by default. Only `"use client"` when needed.
- **Server Actions** for all mutations (`src/server/actions/`).
- **Server queries** for all reads (`src/server/queries/`).
- **Zod validation** on all inputs.
- **URL state** via nuqs for shareable filters.
- **Paraglide** `m.key()` for all user-facing strings.
- **Biome** for linting and formatting (no ESLint, no Prettier).
- **Colocated tests**: `foo.ts` -> `foo.test.ts`.
- **Conventional commits**: `feat:`, `fix:`, `test:`, `docs:`, etc.

## Quality

```bash
pnpm check          # Biome lint + format
pnpm typecheck      # TypeScript
pnpm test:coverage  # 84 tests, 100% coverage
pnpm knip           # Dead code detection
pnpm build          # Production build
```

## Database

Schema lives in `src/server/db/schema.ts`. Tables:

- `users`, `accounts`, `sessions`, `verificationTokens` (Auth.js)
- `restaurants` — name, address, lat/lng, type, labels, priceRange, dineIn, takeAway, status
- `reviews` — rating (1-5), comment, unique per (restaurant, author)
- `favorites` — composite PK (userId, restaurantId)

```bash
pnpm db:up       # Start local PostgreSQL
pnpm db:push     # Push schema (dev)
pnpm db:studio   # Visual browser
```

## Deployment

Deploy to Vercel with a Neon PostgreSQL database. See [docs/setup-guide.md](docs/setup-guide.md) for full instructions.

## License

Private project.
