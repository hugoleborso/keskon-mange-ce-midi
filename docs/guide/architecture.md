# Architecture Guide

A companion guide for vulgatech sessions. Explains how the pieces fit together for people who want to understand modern web development.

---

## The Big Picture

Keskon Mange is a **full-stack web application**. That means the same codebase handles:

1. **The UI** (what users see in their browser)
2. **The API** (how data moves between browser and server)
3. **The database** (where data lives permanently)

```
Browser  ←→  Next.js Server  ←→  PostgreSQL Database
  (React)     (Node.js)           (Drizzle ORM)
```

---

## Framework: Next.js 15 (App Router)

Next.js is a **React framework** — it adds server-side capabilities to React (which is normally browser-only).

### Server Components vs Client Components

By default, every component is a **Server Component**: it runs on the server, fetches data, and sends plain HTML to the browser. No JavaScript is shipped for these components.

```tsx
// Server Component (default) — runs on the server
export default async function HomePage() {
  const restaurants = await getRestaurants(); // Direct DB query!
  return <RestaurantList restaurants={restaurants} />;
}
```

When you need interactivity (clicks, forms, state), you add `"use client"` at the top:

```tsx
"use client"; // This component runs in the browser
import { useState } from "react";

export function DrawButton() {
  const [clicked, setClicked] = useState(false);
  return <button onClick={() => setClicked(true)}>Draw!</button>;
}
```

**Rule of thumb**: keep as much as possible on the server. Only go client when you need `useState`, `useEffect`, event handlers, or browser APIs.

### File-Based Routing

The file structure IS the URL structure:

| File | URL |
|------|-----|
| `src/app/(main)/page.tsx` | `/` |
| `src/app/(main)/restaurants/new/page.tsx` | `/restaurants/new` |
| `src/app/(main)/restaurants/[id]/page.tsx` | `/restaurants/abc123` |
| `src/app/(main)/favorites/page.tsx` | `/favorites` |
| `src/app/(auth)/login/page.tsx` | `/login` |

Folders in `(parentheses)` are **route groups** — they organize code without affecting URLs.

### Special Files

| File | Purpose |
|------|---------|
| `page.tsx` | The page content |
| `layout.tsx` | Wraps pages with shared UI (header, providers) |
| `loading.tsx` | Shown while the page loads (skeleton UI) |
| `error.tsx` | Shown when the page crashes (error boundary) |
| `not-found.tsx` | Shown for 404s |

---

## Database: PostgreSQL + Drizzle ORM

### The Schema

The database schema is defined in TypeScript (`src/server/db/schema.ts`), not in SQL:

```typescript
export const restaurants = pgTable("restaurants", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  priceRange: priceRangeEnum("price_range"),
  dineIn: boolean("dine_in").default(true).notNull(),
  takeAway: boolean("take_away").default(false).notNull(),
  // ...
});
```

Drizzle translates this to SQL. When you change the schema, you generate a migration (`pnpm db:generate`) and apply it (`pnpm db:push`).

### 7 Tables

```
users ──────── accounts        (Auth.js: who you are)
   │           sessions
   │           verificationTokens
   │
   ├── restaurants             (the core data)
   ├── reviews                 (1 per user per restaurant)
   └── favorites               (many-to-many: user ↔ restaurant)
```

### Queries vs Actions

**Reads** live in `src/server/queries/` — plain async functions called from Server Components:

```typescript
// src/server/queries/restaurants.ts
export async function getRestaurants(filters?) {
  return db.select().from(restaurants).where(/* ... */);
}
```

**Writes** live in `src/server/actions/` — Server Actions called from forms or client components:

```typescript
// src/server/actions/restaurants.ts
"use server";
export async function createRestaurant(formData: FormData) {
  const session = await auth();          // 1. Check auth
  const validated = schema.parse(raw);   // 2. Validate input
  await db.insert(restaurants).values(); // 3. Write to DB
  revalidatePath("/");                   // 4. Refresh cached pages
  redirect(`/restaurants/${id}`);        // 5. Navigate
}
```

This separation (queries for reads, actions for writes) keeps the codebase predictable.

### Computed Fields

`averageRating` and `reviewsCount` are **not stored** in the restaurants table. They're computed at query time via a SQL subquery that joins the reviews table. This avoids data getting out of sync.

---

## Authentication: Auth.js v5

Auth.js handles "Sign in with Google" end-to-end:

1. User clicks "Sign in" → redirected to Google
2. Google sends back a token → Auth.js creates a session
3. Session stored in the `sessions` table (database strategy, not JWT)
4. `auth()` function returns the current user anywhere on the server

### Route Protection

The middleware (`src/middleware.ts`) intercepts every request. If you're not logged in and you're not on `/login` or `/api/auth/*`, you get redirected to the login page.

```typescript
export { auth as middleware } from "@/server/auth";
export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## Map: React Leaflet + OpenStreetMap

The map uses **Leaflet** (a JavaScript map library) with **OpenStreetMap** tiles (free, no API key).

### The Dynamic Import Pattern

Leaflet needs the browser's `window` object, which doesn't exist on the server. So we use a **dynamic import** with `ssr: false`:

```tsx
// restaurant-map.tsx
const MapInner = dynamic(() => import("./map-inner"), { ssr: false });
```

This tells Next.js: "don't try to render this on the server — wait for the browser."

### MapProvider Context

The map state (which restaurant is selected, the `flyTo` function) is shared via React Context:

```
MapProvider (in layout)
  ├── MapInner (registers the Leaflet map instance)
  ├── RestaurantList (can highlight a restaurant)
  └── DrawContainer (flies to the winning restaurant)
```

### Color-Coded Markers

Markers use custom `DivIcon` with rating badges:
- Green: rating >= 4
- Orange: rating >= 3
- Red: rating < 3
- Gray: no reviews yet

---

## URL State: nuqs

Filters (dine-in, takeaway, price range) are stored in the **URL query string**, not in React state:

```
/?dineIn=true&priceRange=EUR_1,EUR_2
```

This means:
- Filters survive page refresh
- You can share a filtered URL with someone
- The server reads `searchParams` directly to filter the database query

The `nuqs` library keeps the URL and React state in sync.

---

## Internationalization: Paraglide

All user-facing strings go through Paraglide (`messages/fr.json`):

```json
{
  "app_title": "Keskon Mange",
  "restaurants_add": "Ajouter un resto",
  "draw_button": "Keskon mange ?!"
}
```

In code:

```tsx
import * as m from "@/paraglide/messages.js";
<h1>{m.app_title()}</h1>
```

Paraglide is **compile-time**: it generates typed functions from the JSON, so typos in message keys are caught by TypeScript. No runtime bundle overhead.

---

## The Random Draw

The "Keskon mange ?!" feature is a client-side state machine:

```
idle → animating → result
 ↑                    │
 └────── redraw ──────┘
```

1. **idle**: Big CTA button visible
2. **animating**: Slot-machine effect cycling through restaurant names (decelerating)
3. **result**: Winner displayed, map flies to location, "Relancer" button

The random pick is `Math.floor(Math.random() * restaurants.length)` — uniform probability across the filtered list.

---

## Favorites

Uses React 19's `useOptimistic` for instant feedback:

```tsx
const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);

startTransition(async () => {
  setOptimisticFavorite(!optimisticFavorite);  // Instant UI update
  await toggleFavorite(restaurantId);           // Server call in background
});
```

The heart icon toggles immediately. If the server call fails, the state reverts.

---

## Validation: Zod

Every input is validated twice:
1. **Client-side** (in the form, for instant feedback)
2. **Server-side** (in the Server Action, for security)

Same Zod schema is shared:

```typescript
export const createRestaurantSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  priceRange: z.enum(["EUR_1", "EUR_2", "EUR_3", "EUR_4"]).optional(),
  // ...
});
```

---

## Quality Gates

Every commit passes through:

1. **Biome** — linting + formatting (replaces ESLint + Prettier)
2. **TypeScript** — type checking (`tsc --noEmit`)
3. **Vitest** — 84 unit tests, 100% coverage on server code
4. **Knip** — dead code detection (unused exports, files, dependencies)

CI runs the same checks on every pull request. The pre-commit hook blocks commits that don't pass.

---

## Data Flow Summary

```
User action (click, form submit)
  │
  ├─ Read? → Server Component → query function → Drizzle → PostgreSQL
  │                                                           │
  │                                              ←── data ────┘
  │
  └─ Write? → Server Action → Zod validate → Drizzle → PostgreSQL
                    │                                       │
                    ├── revalidatePath (refresh cache)  ←────┘
                    └── redirect (navigate)
```

---

## Key Architectural Decisions

| Decision | Why |
|----------|-----|
| Server Components by default | Less JavaScript shipped, direct DB access |
| Computed ratings (not stored) | No stale data, simpler writes |
| URL state for filters | Shareable, server-readable, survives refresh |
| `useOptimistic` for favorites | Instant feedback, graceful degradation |
| Dynamic import for map | Leaflet needs browser APIs |
| Compile-time i18n | Type-safe, zero runtime cost |
| Colocated tests | Easy to find, maintain, and enforce coverage |
