---
paths:
  - "src/server/db/**"
  - "drizzle.config.ts"
---
NEVER run pnpm db:push, pnpm db:migrate, or any command that modifies the database.
Only edit src/server/db/schema.ts and run pnpm db:generate.
Ask the user to apply changes.
