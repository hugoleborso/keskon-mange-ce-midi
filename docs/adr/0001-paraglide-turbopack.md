# ADR 0001 — Paraglide i18n integration under Next.js dev

- **Status**: Proposed
- **Date**: 2026-04-20

## Context

`next.config.ts` registers Paraglide via `paraglideWebpackPlugin` inside
`config.webpack(...)`. `pnpm dev` runs `next dev --turbopack`. Turbopack
does not execute the `webpack` hook from `next.config.ts` (Next itself
prints "Webpack is configured while Turbopack is not, which may cause
problems"). Result: if `src/paraglide/` is deleted, it is never
regenerated during dev, and every request fails with
`Module not found: Can't resolve '@/paraglide/messages.js'`. Today the
directory only exists because some earlier run produced it; the project
is effectively relying on stale generated output.

Paraglide 2.13.x ships plugins for: **webpack, vite, rollup, rolldown,
rspack, esbuild**. It does **not** ship a Turbopack plugin (Turbopack
has no public bundler-plugin API at the time of writing).

We need a fix that:
1. Regenerates `src/paraglide/` reliably whenever messages change.
2. Works for all developers on `pnpm dev`, CI, and `pnpm build`.
3. Doesn't silently break again when someone deletes the output dir.

## Options

### A — Drop `--turbopack` from `dev`

Change `package.json`:
```diff
- "dev": "next dev --turbopack",
+ "dev": "next dev",
```
Existing webpack plugin continues to fire at every request. `pnpm build`
already uses webpack, so nothing changes for prod.

### B — Keep Turbopack, run the Paraglide CLI alongside Next

Use the Paraglide CLI directly, outside any bundler plugin. Concretely:
```json
"scripts": {
  "paraglide:compile": "paraglide-js compile --project ./project.inlang --outdir ./src/paraglide",
  "predev": "pnpm paraglide:compile",
  "prebuild": "pnpm paraglide:compile",
  "dev": "concurrently \"paraglide-js compile --project ./project.inlang --outdir ./src/paraglide --watch\" \"next dev --turbopack\""
}
```
The `--watch` flag is already supported by the CLI. Remove the webpack
plugin from `next.config.ts` once the CLI path is canonical.

### C — Switch to a different Paraglide bundler plugin

The `paraglide-js` package exports vite / rspack / rollup / esbuild
plugins. None of them are loaded by Turbopack either (Turbopack only
recognizes its own plugin API, which isn't public yet). This option
therefore only makes sense **together with** a bundler switch, which
for a Next.js app means either:
- C1. Use `rspack` by migrating off Next, or
- C2. Wait for an official `@inlang/paraglide-next` adapter that's
  Turbopack-aware (none exists today; the package name is currently
  just a wrapper around the bundler plugins).

Listed for completeness; not a near-term path.

### D — Do nothing

Keep relying on the stale `src/paraglide/` directory. First developer to
`git clean -fdx` or set up a fresh machine is blocked.

## Evaluation

Scored 1 (worst) → 5 (best) on each axis.

| Option | Performance | DevX | Bundle size | Community size |
|---|---|---|---|---|
| **A** Drop `--turbopack` | 2 — slower HMR / cold start than Turbopack on large codebases, but fine at current project size | 5 — one-line change, works immediately, identical behavior in dev and prod (both webpack) | 5 — no change | 5 — webpack + Next.js is the default for most apps in production; huge community |
| **B** CLI + `predev`/`--watch` | 5 — Turbopack speed preserved; CLI compile is O(ms) for 68 messages, watcher cost is negligible | 3 — adds `concurrently` + two extra scripts; two processes in the terminal; devs must remember the watcher if they edit `messages/*.json` | 5 — no change (the CLI emits exactly the same output as the plugin) | 4 — Paraglide CLI is first-party and stable; `concurrently` is ubiquitous |
| **C1** Migrate off Next | 5 — potentially faster | 1 — a full framework migration for an i18n concern is absurdly out of proportion | ≈ — depends entirely on new stack | 3 — Vite/Rspack communities smaller than Next, but still large |
| **C2** Wait for Turbopack-native plugin | n/a | 1 — blocks indefinitely, no ETA | n/a | n/a — doesn't exist |
| **D** Do nothing | 5 (until it breaks) | 1 — hidden landmine | 5 | n/a |

## Decision

Two viable candidates: **A** and **B**. Recommend **B** (CLI + `predev`
+ concurrent `--watch`). Rationale:

- **Turbopack matters more as the app grows.** The project already uses
  React 19, Leaflet, Drizzle, nuqs, and a Paraglide bundle — cold-dev
  times will diverge between webpack and Turbopack. Giving that up
  permanently to dodge a 10-line script is short-sighted.
- **Option A only postpones the problem.** Vercel has signaled that
  Turbopack will become the default for `next build` too; when that
  happens, the webpack plugin stops firing in prod and we'd have to
  migrate anyway.
- **Option B's DevX cost is small and localised.** `concurrently` is a
  single well-known dependency, the watcher is hands-off, and the
  `predev`/`prebuild` scripts make `src/paraglide/` self-healing — the
  exact property that would have prevented today's bug.
- **Bundle size identical.** The CLI's output is byte-for-byte what the
  webpack plugin produces. No runtime impact either way.

If the team prefers to minimize moving parts and accept slower dev for
now, fall back to **A** — it's cheap to reverse.

Either choice requires updating `project.inlang/settings.json` so the
`modules` entries point to locally-resolvable paths instead of
`cdn.jsdelivr.net` URLs, for reproducible offline builds and CI.

## Consequences

### If B is adopted
- `pnpm dev` spawns two processes (Next + Paraglide watcher); Ctrl-C
  must kill both (handled by `concurrently`).
- New devs need `pnpm install` to pull `concurrently`.
- `next.config.ts` loses the `webpack` hook — one fewer source of
  mystery build errors.
- Fresh clones (`pnpm install && pnpm dev`) just work, no hidden
  "must have run build once" precondition.

### If A is adopted
- Slower dev startup/HMR on cold caches; users may notice once the
  codebase grows.
- A future Next release that makes Turbopack mandatory forces a second
  migration.
- Zero new dependencies.

## References

- Next.js note: "Webpack is configured while Turbopack is not" — printed
  by `next dev --turbopack` when `next.config.ts` has a `webpack(...)`
  hook.
- Paraglide CLI: `paraglide-js compile --watch` (2.13.2).
- `node_modules/@inlang/paraglide-js/dist/bundler-plugins/index.d.ts`
  — enumerates supported bundlers (no Turbopack).
