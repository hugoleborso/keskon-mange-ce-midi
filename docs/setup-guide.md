# Setup Guide

Complete guide to deploy Keskon Mange from scratch.

## Prerequisites

- Node.js 22 (use `fnm install 22`)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker (for the local PostgreSQL database)
- A GitHub account
- A Google account (for OAuth)

## 1. Clone and Install

```bash
git clone https://github.com/your-org/keskon-mange-ce-midi.git
cd keskon-mange-ce-midi
fnm use 22
pnpm install
```

## 2. Local Database (Docker)

The app uses PostgreSQL. For local development, a Docker Compose file is included.

### Start the database

```bash
pnpm db:up
```

This starts a PostgreSQL 17 container on port 5432 with persistent data.

### Connection string

Add to `.env.local`:
```
DATABASE_URL="postgresql://keskonmange:keskonmange@localhost:5432/keskonmange"
```

### Push the schema

```bash
pnpm db:push
```

This creates all the tables (users, accounts, sessions, restaurants, reviews, favorites) in your local database.

### Other database commands

```bash
pnpm db:down       # Stop the database container
pnpm db:studio     # Open Drizzle Studio (visual DB browser)
```

### Production database (Neon)

For production on Vercel, use [Neon PostgreSQL](https://neon.tech) (free tier: 0.5 GB storage, 100 compute-hours/month):

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project (e.g. `keskon-mange`)
3. Copy the connection string from the dashboard:
   ```
   postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Add it as `DATABASE_URL` in Vercel environment variables
5. Push the schema: `DATABASE_URL="your-neon-url" pnpm db:push`

## 3. Google OAuth Credentials

Used for "Sign in with Google".

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services > Credentials**
4. Click **+ Create Credentials > OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User type: External
   - App name: `Keskon mange`
   - Support email: your email
   - Authorized domains: `localhost` (dev), `your-domain.vercel.app` (prod)
   - Scopes: `email`, `profile`, `openid`
6. Back in Credentials, create an **OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.vercel.app/api/auth/callback/google` (production)
7. Copy the **Client ID** and **Client Secret**
8. Add to `.env.local`:
   ```
   AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="GOCSPX-your-client-secret"
   ```

> The redirect URI must **exactly** match — case-sensitive, no trailing slash.

## 4. Auth Secret

A random string used by Auth.js to encrypt tokens and cookies.

Generate one:
```bash
openssl rand -base64 32
```

Add to `.env.local`:
```
AUTH_SECRET="your-generated-random-string"
```

## 5. Vercel Blob (Optional - for image uploads)

Used for restaurant/review photo uploads. Free tier: 250 MB storage.

1. Go to [Vercel Dashboard](https://vercel.com) > your project > Storage
2. Click **Create** > **Blob**
3. Copy the read-write token
4. Add to `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
   ```

> Skip this for now if you're not implementing photo uploads yet.

## 6. Complete .env.local

Your final `.env.local` should look like:
```bash
# Database (local Docker)
DATABASE_URL="postgresql://keskonmange:keskonmange@localhost:5432/keskonmange"

# Auth
AUTH_SECRET="openssl-generated-secret"
AUTH_GOOGLE_ID="123456789.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxx"

# Image storage (optional)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

## 7. Run Locally

```bash
pnpm db:up     # Start PostgreSQL
pnpm db:push   # Create tables (first time only)
pnpm dev       # Start dev server
```

Open [http://localhost:3000](http://localhost:3000). You should be redirected to the login page.

## 8. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New > Project**
3. Import your GitHub repository
4. Framework: **Next.js** (auto-detected)
5. Add all environment variables from your `.env.local` in the **Environment Variables** section
6. Also add: `AUTH_URL=https://your-project.vercel.app`
7. Click **Deploy**

After deployment:
- Add the Vercel URL to Google OAuth redirect URIs (step 3.6 above)
- Every PR will automatically get a **preview deployment** with its own URL

## 9. Push Database Schema (Production)

After first deploy, push the schema to your Neon production database:
```bash
DATABASE_URL="your-neon-connection-string" pnpm db:push
```

Or use `pnpm db:migrate` if you have generated migration files.

---

## GitHub Actions Secrets

For CI and the Claude Code integration, add these secrets in **GitHub > Settings > Secrets and variables > Actions**:

| Secret | Where to get it | Used by |
|--------|----------------|---------|
| `DATABASE_URL` | Neon dashboard | CI E2E tests |
| `AUTH_SECRET` | `openssl rand -base64 32` | CI E2E tests |
| `AUTH_GOOGLE_ID` | Google Cloud Console | CI E2E tests |
| `AUTH_GOOGLE_SECRET` | Google Cloud Console | CI E2E tests |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Claude Code Action |
| `SLACK_WEBHOOK_URL` | Slack app settings | PR notifications |

---

## Troubleshooting

### "ECONNREFUSED 127.0.0.1:5432"
Your local PostgreSQL isn't running. Run `pnpm db:up` to start the Docker container.

### "relation does not exist"
Tables haven't been created yet. Run `pnpm db:push` to push the schema.

### "Error: OAuthCallbackError" on Google sign-in
Your redirect URI doesn't match. Check that the URI in Google Cloud Console exactly matches `http://localhost:3000/api/auth/callback/google`.

### Build fails with "AUTH_SECRET is missing"
Add `AUTH_SECRET` to your environment. In Vercel, make sure it's set for all environments (Production, Preview, Development).

### Knip/Biome/TypeScript errors
Run `pnpm check:fix` to auto-fix formatting, then `pnpm typecheck` to see type errors.
