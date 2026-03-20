---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---
When creating or modifying a file in src/server/ or src/lib/, always create or update
the corresponding .test.ts file. Run `pnpm test` after writing tests.
Coverage target: 100% for server/, lib/, hooks/.
