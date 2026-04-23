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

Paraglide 2.13.x ships plugins for **webpack, vite, rollup, rolldown,
rspack, esbuild**. It does **not** ship a Turbopack plugin. Turbopack
has no public bundler-plugin API at the time of writing, so no
Turbopack-targeting plugin can exist for Paraglide (or anything else).

We need a fix that:
1. Regenerates `src/paraglide/` reliably whenever messages change.
2. Works for all developers on `pnpm dev`, CI, and `pnpm build`.
3. Doesn't silently break again when someone deletes the output dir.

## What does Turbopack actually buy this project?

At today's scale (146 source files, 68 messages, no heavy compute):

| | Turbopack | Webpack |
|---|---|---|
| Cold `next dev` start | ~3-6 s | ~8-15 s |
| HMR on a single-file edit | ~100-300 ms | ~500 ms-2 s |

Savings per edit: a few hundred milliseconds. Savings per restart: 5-10
seconds. Nice, not load-bearing — this codebase is nowhere near the
scale where Turbopack becomes a productivity unlock.

Against that, Turbopack's costs here are concrete and recurring:
1. **Breaks every webpack plugin** the project needs, silently. This is
   the bug we just hit with Paraglide.
2. **Dev/prod divergence**: `next build` still uses webpack, so dev
   behavior doesn't match prod behavior. Entire classes of bugs only
   show up after deploy.
3. **Empty plugin ecosystem**: future needs (MDX, bundle analyzer,
   sourcemap tweaks, custom loaders) will all hit the same wall.
4. **Beta-tier stability**: expect sporadic warnings and edge cases
   (we already see the Google Fonts fetch behave differently under
   Turbopack in offline/sandbox environments).

## Options

### A — Drop `--turbopack` from `dev`

Change `package.json`:
```diff
- "dev": "next dev --turbopack",
+ "dev": "next dev",
```
Existing webpack plugin fires; `src/paraglide/` regenerates automatically
whenever a request compiles the import graph. `pnpm build` already uses
webpack, so prod behavior is unchanged and dev now matches prod.

### B — Keep Turbopack, run the Paraglide CLI alongside Next

```json
"scripts": {
  "paraglide:compile": "paraglide-js compile --project ./project.inlang --outdir ./src/paraglide",
  "predev": "pnpm paraglide:compile",
  "prebuild": "pnpm paraglide:compile",
  "dev": "concurrently \"paraglide-js compile ... --watch\" \"next dev --turbopack\""
}
```
CLI output matches the plugin output byte-for-byte. `--watch` is
supported.

**But**: editing a message causes the CLI to rewrite files that
`@/paraglide/messages.js` re-exports. Turbopack detects the change, but
because those files are module-level `export const … = …`, Fast Refresh
can't preserve component state — you get a full-page reload for every
message edit. The "keep Turbopack for fast HMR" argument mostly
evaporates as soon as you're actually editing translations. You also
pay the two-process overhead (Ctrl-C handling, interleaved logs, CI
script complexity) forever.

### C — Switch to a different Paraglide bundler plugin

The `paraglide-js` package exports vite / rspack / rollup / esbuild
plugins. None are loaded by Turbopack. Viable only via a bundler
migration:
- C1. Use `rspack` by migrating off Next — out of proportion.
- C2. Wait for an official `@inlang/paraglide-next` Turbopack adapter —
  doesn't exist today; no ETA.

Listed for completeness; not a near-term path.

### D — Do nothing

Keep relying on the stale `src/paraglide/` directory. First `git clean`
or fresh clone breaks dev. Already bit us once.

## Evaluation

Scored 1 (worst) → 5 (best) on each axis.

| Option | Performance | DevX | Bundle size | Community size |
|---|---|---|---|---|
| **A** Drop `--turbopack` | 3 — loses a few hundred ms of HMR and 5-10 s of cold start. Fine at current scale. | 5 — one-line change, dev matches prod, every Next/webpack plugin just works | 5 — identical output | 5 — Next on webpack is the long-default path; massive community |
| **B** CLI + `predev`/`--watch` | 3 — Turbopack speed for app-code edits preserved, but message edits force full-page reloads (Fast Refresh breaks on regenerated modules), and cold start pays the CLI compile twice (predev + first-watch) | 2 — two processes, concurrency dep, split logs, messier Ctrl-C and CI, hidden failure modes when the watcher dies silently | 5 — same output | 4 — CLI is first-party; `concurrently` ubiquitous |
| **C1** Migrate off Next | 5 | 1 — framework migration for an i18n concern | ≈ | 3 |
| **C2** Wait for Turbopack plugin | n/a | 1 — indefinite block | n/a | n/a |
| **D** Do nothing | 5 (until it breaks) | 1 — hidden landmine | 5 | n/a |

## Decision

**Option A: drop `--turbopack` from the `dev` script.**

Rationale:
- **Cost/benefit is lopsided.** Turbopack gains here are measured in
  hundreds of milliseconds; costs are concrete ecosystem gaps that
  already produced one production bug. Wrong trade for a 150-file app.
- **Dev/prod parity.** `next build` uses webpack today. Matching dev to
  prod eliminates an entire class of "works on my machine" bugs.
- **Re-evaluate when Turbopack ships a public plugin API** (so the
  Paraglide plugin can target it) or when the codebase grows to the
  point where webpack's cold start measurably hurts onboarding. Neither
  threshold is close.
- **Option B is a workaround, not a fix.** It preserves Turbopack on
  paper but surrenders Fast Refresh for the exact workflow (editing
  messages) that i18n tooling needs to support well, while adding a
  second dev process and a new dependency. Net negative.

Independently of this decision, `project.inlang/settings.json` should
stop fetching plugins from `cdn.jsdelivr.net` at compile time. Pin them
locally so compile is reproducible offline and on CI that's firewalled
from the public CDN.

## Consequences

### If A is adopted (recommended)
- `pnpm dev` cold start ~5-10 s slower; HMR a few hundred ms slower.
  Still well under the "annoying" threshold at current size.
- `src/paraglide/` regenerates via the webpack plugin on demand —
  self-healing, no extra scripts.
- Dev and prod use the same bundler; bug classes converge.
- Zero new dependencies.
- Trivially reversible when Turbopack is ready (flip the flag back).

### If B is adopted (not recommended)
- Message edits lose Fast Refresh → full-page reload per save.
- New `concurrently` dependency, dual-process dev loop.
- CI scripts must coordinate the watcher.
- Retains 5-10 s cold-start / ~few-hundred-ms HMR on code edits.

## References

- Next.js note: "Webpack is configured while Turbopack is not" — printed
  by `next dev --turbopack` when `next.config.ts` has a `webpack(...)`
  hook.
- Paraglide CLI: `paraglide-js compile --watch` (2.13.2).
- `node_modules/@inlang/paraglide-js/dist/bundler-plugins/index.d.ts` —
  enumerates supported bundlers (no Turbopack).
