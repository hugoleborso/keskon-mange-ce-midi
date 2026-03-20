# Quick Install

Get Keskon Mange running locally in 5 minutes.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22 LTS | `fnm install 22` or [nodejs.org](https://nodejs.org) |
| pnpm | latest | `corepack enable && corepack prepare pnpm@latest --activate` |
| Docker | latest | [docker.com](https://www.docker.com/get-started/) |

## Steps

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/keskon-mange-ce-midi.git
cd keskon-mange-ce-midi
fnm use 22
pnpm install
```

### 2. Set up environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```bash
# Database (keep as-is for local Docker)
DATABASE_URL="postgresql://keskonmange:keskonmange@localhost:5432/keskonmange"

# Auth - generate a secret
AUTH_SECRET="$(openssl rand -base64 32)"

# Google OAuth - see docs/setup-guide.md for instructions
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

> For Google OAuth setup, see [Setup Guide - Section 3](./setup-guide.md#3-google-oauth-credentials).

### 3. Start the database

```bash
pnpm db:up      # Start PostgreSQL via Docker
pnpm db:push    # Create all tables
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |

### Code Quality

| Command | Description |
|---------|-------------|
| `pnpm check` | Biome lint + format check |
| `pnpm check:fix` | Biome lint + format auto-fix |
| `pnpm typecheck` | TypeScript type check |
| `pnpm knip` | Dead code detection |

### Testing

| Command | Description |
|---------|-------------|
| `pnpm test` | Run unit tests (84 tests) |
| `pnpm test:coverage` | Run tests with coverage (100% target) |
| `pnpm test:e2e` | Run Playwright E2E tests |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:up` | Start local PostgreSQL (Docker) |
| `pnpm db:down` | Stop local PostgreSQL |
| `pnpm db:push` | Push schema to database |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Stopping

```bash
pnpm db:down    # Stop PostgreSQL
```

## Next Steps

- [Full Setup Guide](./setup-guide.md) — Google OAuth, Neon production DB, Vercel deployment
- [README](../README.md) — Architecture overview and project documentation
