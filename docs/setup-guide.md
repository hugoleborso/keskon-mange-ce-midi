# Setup Guide

Complete guide to deploy Keskon Mange from scratch.

## Prerequisites

- Node.js 22 (use `fnm install 22`)
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- A GitHub account
- A Google account (for OAuth)

## 1. Clone and Install

```bash
git clone https://github.com/your-org/keskon-mange-ce-midi.git
cd keskon-mange-ce-midi
fnm use 22
pnpm install
```

## 2. Neon PostgreSQL (Free Tier)

The database. Free tier: 100 compute-hours/month, 0.5 GB storage. No credit card required.

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **New Project**
3. Choose a name (e.g. `keskon-mange`) and region closest to your users
4. A default database (`neondb`) and role are auto-created
5. Copy the connection string from the dashboard — it looks like:
   ```
   postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. Add to `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

### Push the schema

```bash
pnpm db:push
```

This creates all the tables (users, accounts, sessions, restaurants, reviews, favorites) directly in your Neon database.

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
# Database
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Auth
AUTH_SECRET="openssl-generated-secret"
AUTH_GOOGLE_ID="123456789.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxx"

# Image storage (optional)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
```

## 7. Run Locally

```bash
pnpm dev
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

After first deploy, push the schema to your production database:
```bash
DATABASE_URL="your-prod-connection-string" pnpm db:push
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

### "No database connection string was provided to neon()"
You're missing `DATABASE_URL` in your `.env.local`. See step 2.

### "Error: OAuthCallbackError" on Google sign-in
Your redirect URI doesn't match. Check that the URI in Google Cloud Console exactly matches `http://localhost:3000/api/auth/callback/google`.

### Build fails with "AUTH_SECRET is missing"
Add `AUTH_SECRET` to your environment. In Vercel, make sure it's set for all environments (Production, Preview, Development).

### Knip/Biome/TypeScript errors
Run `pnpm check:fix` to auto-fix formatting, then `pnpm typecheck` to see type errors.
