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

echo "Pre-commit: Running tests with coverage..." >&2
if ! pnpm test:coverage; then
  echo "BLOCKED: Tests failed or coverage thresholds not met." >&2
  exit 2
fi

echo "Pre-commit: Running knip..." >&2
if ! pnpm exec knip; then
  echo "BLOCKED: Dead code detected. Clean up before committing." >&2
  exit 2
fi

echo "Pre-commit: All checks passed." >&2
exit 0
