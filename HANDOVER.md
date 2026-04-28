# Handover — keskon-mange-ce-midi

Session context for the next Claude. Read this before touching anything.

## TL;DR

Two bugs investigated, both with PRs open:
- **PR #9** — login redirect loop (`claude/fix-login-redirect-loop-rgBOc`). Root cause: `signIn("google")` without `redirectTo` uses `Referer` (= `/login`), so users land back on `/login` after OAuth. One-line fix restores `{ redirectTo: "/" }`. **Ready to merge.**
- **PR #10** — Paraglide broken under `--turbopack` (`claude/drop-turbopack-for-paraglide`). 2 commits: ADR + drop `--turbopack` from dev script. **Needs end-to-end verification on a machine where `cdn.jsdelivr.net` is reachable.**

User asked for a fresh env to re-verify PR #10 since this sandbox blocks jsdelivr.

## Branches / PRs on the remote (`hugoleborso/keskon-mange-ce-midi`)

| Branch | PR | Status |
|---|---|---|
| `claude/fix-login-redirect-loop-rgBOc` | #9 | 1 commit, green, ready |
| `claude/drop-turbopack-for-paraglide` | #10 | 2 commits (ADR + fix), verify in real env |
| `claude/adr-paraglide-turbopack` | — | Superseded by #10. Safe to delete. |
| `claude/drop-turbopack-dev` | — | Superseded by #10. Safe to delete. |

Ask the user before deleting the two obsolete branches.

## PR #9 — login redirect loop (done)

`src/app/(auth)/login/page.tsx:28` — the fix is this one-line change:
```ts
- await signIn("google");
+ await signIn("google", { redirectTo: "/" });
```

Why it works: Auth.js v5's `signIn` server action resolves callback URL as
`redirectTo ?? headers.get("Referer") ?? "/"`. Form submits from `/login`, so
`Referer` = `/login`. Without an explicit `redirectTo`, the OAuth callback
sends the user back to `/login` after successful auth. The cookie **is** set
correctly — it only looks like an infinite loop because the login page has no
"already signed in" redirect.

User explicitly rejected adding a regression test to the PR — do **not** re-add one.

History preserved the same fix in commit `d33d277` and it was accidentally
removed during a preview-flow refactor in `8258076`.

## PR #10 — drop `--turbopack` from dev (needs env verification)

### The bug

`next.config.ts` registers Paraglide via `paraglideWebpackPlugin` inside a
`webpack: (config) => { ... }` hook. `pnpm dev` runs `next dev --turbopack`.
Turbopack silently skips the webpack hook (Next even warns: "Webpack is
configured while Turbopack is not"). So the plugin never runs in dev, and
`src/paraglide/` exists only because some earlier webpack run (e.g. `next build`)
produced it. `rm -rf src/paraglide/ && pnpm dev` leaves the app permanently
broken with `Module not found: Can't resolve '@/paraglide/messages.js'`.

### The fix

`package.json`:
```diff
- "dev": "next dev --turbopack",
+ "dev": "next dev",
```

That's all PR #10 touches (plus the ADR).

### What the user specifically rejected

- **Option B** (run the Paraglide CLI via `concurrently --watch` alongside Next
  while keeping Turbopack). User rejection: breaks Fast Refresh on message
  edits (Turbopack detects regenerated re-exports → full-page reload) and
  introduces a dual-process dev loop. **Don't propose this again.**
- **Vendoring jsdelivr-hosted inlang plugins locally.** The user wants to
  verify jsdelivr works in a fresh env first. I had vendored
  `@inlang/plugin-message-format@4` and `@inlang/plugin-m-function-matcher@2`
  tarballs under `inlang-plugins/` — **this was reverted on user request**.
  Do not re-add unless jsdelivr is confirmed to be unavailable in the target env.

### How to verify PR #10 on a fresh env

```bash
git checkout claude/drop-turbopack-for-paraglide
pnpm install
rm -rf src/paraglide          # prove self-healing
pnpm dev
# In another terminal:
curl -s http://localhost:3000/login | grep -oE "Keskon mange|Se connecter avec Google"
```

Expected: server returns 200, translations render.

HMR verification (already verified once in this sandbox — redo only if user asks):
1. Edit `src/app/(auth)/login/page.tsx` (add trivial text) → dev log shows
   `✓ Compiled in <2s (N modules)` (incremental, not cold). Content updates.
2. Edit a value in `messages/fr.json` → incremental recompile, text updates live.

### If jsdelivr 403s in the new env too

Paraglide will print:
```
PluginImportError: Couldn't import the plugin "https://cdn.jsdelivr.net/..."
SyntaxError: Unexpected identifier 'not'
```
That's Paraglide trying to parse the 403 response body ("Host not in
allowlist") as JS. Verify with:
```bash
node -e "fetch('https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js').then(r=>r.text()).then(t=>console.log(t.slice(0,50)))"
```
If this prints `Host not in allowlist`, the allowlist hasn't propagated —
**stop and ask the user before reintroducing vendored plugins**. The previous
vendoring attempt is in the reflog if needed (commit `fa4c85d` on the reflog,
pre-force-push).

## Environment quirks in this sandbox (may or may not apply in the new one)

- **Blocked by default**: `cdn.jsdelivr.net` (403 `Host not in allowlist`) and
  `fonts.googleapis.com` (next/font warns and falls back).
- **`pnpm` / `node`** live at `/opt/node22/bin/`. Prepend that to `PATH` in
  `Bash` calls — e.g. `export PATH="/opt/node22/bin:$PATH" && pnpm check`.
- **Docker is not available**, but Postgres 16 is installed. To run the DB:
  ```bash
  # one-time
  useradd -m pgrun
  mkdir -p /tmp/pgdata /tmp/pgrun
  chown pgrun:pgrun /tmp/pgdata /tmp/pgrun
  su - pgrun -c "export PATH=/usr/lib/postgresql/16/bin:\$PATH; \
    initdb -D /tmp/pgdata -U keskonmange --auth=trust && \
    pg_ctl -D /tmp/pgdata -l /tmp/pglog -o '-c unix_socket_directories=/tmp/pgrun' start && \
    createdb -h /tmp/pgrun -U keskonmange keskonmange && \
    psql -h /tmp/pgrun -U keskonmange -d keskonmange -c \"ALTER USER keskonmange PASSWORD 'keskonmange';\""
  # then
  DATABASE_URL="postgresql://keskonmange:keskonmange@localhost:5432/keskonmange" pnpm db:migrate
  ```
- **`.env.local`** was created with fake OAuth credentials for local dev
  testing. Not committed. It's fine; recreate if needed:
  ```bash
  cat > .env.local <<'EOF'
  DATABASE_URL="postgresql://keskonmange:keskonmange@localhost:5432/keskonmange"
  AUTH_SECRET="dGVzdC10ZXN0LXRlc3QtdGVzdC10ZXN0LXRlc3QtdGVzdC10ZXN0"
  AUTH_GOOGLE_ID="test-client-id"
  AUTH_GOOGLE_SECRET="test-client-secret"
  AUTH_URL="http://localhost:3000"
  AUTH_TRUST_HOST="true"
  EOF
  ```

## Pre-commit hook in this repo

`lefthook` runs biome → knip → typecheck → tests on every commit.
**Typecheck and knip fail if `src/paraglide/` is empty**, because many
components import from `@/paraglide/messages.js`. In a jsdelivr-blocked
sandbox, stub the generated module before committing:
```bash
node -e 'const fs=require("fs"); const msgs=JSON.parse(fs.readFileSync("messages/fr.json","utf8")); let out="/* eslint-disable */\n"; for(const[k,v] of Object.entries(msgs)){if(k.startsWith("$"))continue;out+=`export const ${k} = (_args) => ${JSON.stringify(v)};\n`;} fs.mkdirSync("src/paraglide/messages",{recursive:true}); fs.writeFileSync("src/paraglide/messages/_index.js",out); fs.writeFileSync("src/paraglide/messages.js","/* eslint-disable */\nexport * from \"./messages/_index.js\";\nexport * as m from \"./messages/_index.js\";\n");'
```
`src/paraglide/` is gitignored; these stubs never ship. In a real env, running
Paraglide normally will produce the correct output and this hack isn't needed.

## User's standing instructions

- Commit only when asked. Never bundle unrelated changes in a PR.
- Never amend or force-push without a good reason. When force-pushing, use
  `--force-with-lease`.
- Conventional commits: `fix:`, `feat:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `ci:`.
- Don't add tests proactively to a bug-fix PR; ask first.
- Don't add comments to code unless the *why* is genuinely non-obvious.
- Don't propose Option B (the Paraglide CLI watcher) for the Turbopack issue.

## Open threads

1. **Verify PR #10 on the fresh env.** If it works, ping user for review/merge.
2. If jsdelivr still 403s in the fresh env, **ask** the user before reintroducing
   vendored plugins — this decision was explicit.
3. Two stale branches (`claude/adr-paraglide-turbopack`, `claude/drop-turbopack-dev`)
   exist on the remote. Ask user before deleting.
