# Slack Integration Guide

This guide sets up the full loop: **Slack message → GitHub Issue → Claude Code PR → Vercel Preview → Slack notification**.

## Architecture

```
Slack #keskonmange           GitHub                    Vercel
      |                         |                        |
  @Claude "add dark mode"       |                        |
      |                         |                        |
      +--[Slack Workflow]------>|                        |
      |                    Issue #42 (label: claude)     |
      |                         |                        |
      |                    Claude Code Action runs       |
      |                         |                        |
      |                    Opens PR #99                  |
      |                         +----------------------->|
      |                         |              Preview deploy
      |                         |              https://pr-99-xxx.vercel.app
      |<---[Slack Notify]-------+                        |
      |                         |                        |
  "PR #99 ready! Preview: ..."  |                        |
```

## Step 1: Install Claude GitHub App

This lets Claude Code Action push code and create PRs.

1. Go to [github.com/apps/claude](https://github.com/apps/claude)
2. Click **Install**
3. Select your repository (`keskon-mange-ce-midi`)
4. Grant permissions: Contents (read/write), Issues (read/write), Pull requests (read/write)

Or run from your terminal:
```bash
claude /install-github-app
```

## Step 2: Add Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com) > API Keys
2. Create a new key
3. In your GitHub repo: **Settings > Secrets and variables > Actions > New repository secret**
4. Name: `ANTHROPIC_API_KEY`, Value: your key

This is the only secret needed for Claude Code Action. Cost is per API token usage.

## Step 3: Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) > your project > Settings > Git
2. Ensure the GitHub repository is connected
3. Vercel automatically deploys previews on every PR — no workflow needed
4. The Vercel bot will comment the preview URL directly on the PR

Set preview environment variables in Vercel dashboard (same as production):
- `DATABASE_URL` (can point to a dev/staging Neon database)
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

> Add `https://*.vercel.app/api/auth/callback/google` to your Google OAuth redirect URIs.

## Step 4: Create Slack Incoming Webhook

This lets GitHub Actions post back to Slack.

1. Go to [api.slack.com/apps](https://api.slack.com/apps) > **Create New App**
2. Choose **From scratch**, name it `Keskon Mange Bot`
3. Go to **Incoming Webhooks** > Toggle **On**
4. Click **Add New Webhook to Workspace**
5. Select channel: `#keskonmange`
6. Copy the webhook URL
7. Add to GitHub repo secrets: Name: `SLACK_WEBHOOK_URL`, Value: the webhook URL

## Step 5: Set Up Slack → GitHub Issue Bridge

This is the trigger: a Slack message creates a GitHub issue that Claude Code picks up.

### Option A: Native Slack Workflow (Free, recommended)

1. In Slack, go to **Automations** (or click the lightning bolt)
2. Create a new workflow:
   - **Trigger**: "When a message is posted" in `#keskonmange` containing `@Claude`
   - **Step 1**: "Send a web request" (webhook)
     - URL: `https://api.github.com/repos/YOUR_ORG/keskon-mange-ce-midi/issues`
     - Method: POST
     - Headers:
       ```
       Authorization: Bearer YOUR_GITHUB_PAT
       Content-Type: application/json
       ```
     - Body:
       ```json
       {
         "title": "{{message.text}}",
         "labels": ["claude"],
         "body": "From Slack #keskonmange by {{user.name}}:\n\n{{message.text}}"
       }
       ```
   - **Step 2**: Reply in thread: "Issue created, Claude is on it!"

> You'll need a **GitHub Personal Access Token** (PAT) with `repo` scope. Create one at [github.com/settings/tokens](https://github.com/settings/tokens).

### Option B: Zapier (Managed, paid)

1. Create a Zap: **Slack New Message** → **GitHub Create Issue**
2. Filter: message contains `@Claude`
3. Issue title: message text
4. Issue labels: `claude`
5. Cost: ~$29/month for the Starter plan

### Option C: n8n (Self-hosted, free)

1. Deploy n8n (Docker or [n8n.cloud](https://n8n.cloud))
2. Create workflow: Slack Trigger → GitHub Create Issue
3. Filter on `@Claude` keyword
4. Add label `claude` to the issue

## Step 6: Test the Full Loop

1. Post in `#keskonmange`: `@Claude add a loading spinner on the home page`
2. Check GitHub: a new issue should appear with the `claude` label
3. Claude Code Action picks it up, creates a branch, implements the change
4. A PR is opened automatically
5. Vercel deploys a preview and comments the URL on the PR
6. Slack receives a notification with the PR link
7. Review the preview on your phone, approve, merge
8. Production auto-deploys on merge to main

## Workflow Files

Two GitHub Actions workflows are included:

### `.github/workflows/claude-code.yml`
Triggers when:
- Someone comments `@claude` on an issue or PR
- A new issue is created with the `claude` label

### `.github/workflows/slack-notify.yml`
Posts to `#keskonmange` when a new PR is opened, with a link to the PR.

## Cost Summary

| Service | Cost |
|---------|------|
| Claude Code Action | Per API token (~$0.01-0.50 per task depending on complexity) |
| GitHub Actions | Free for public repos, 2000 min/month for private |
| Vercel | Free hobby tier (sufficient for MVP) |
| Slack Workflow | Free |
| n8n (if self-hosted) | Free |

## Gotchas

- **`CLAUDE.md` is critical**: Claude Code reads it to understand project conventions. It's already set up in this repo.
- **Redirect URIs**: Add your Vercel preview domains to Google OAuth.
- **Max turns**: Claude Code Action defaults to reasonable limits. If a task runs too long, it'll stop and comment.
- **Issue label**: The workflow triggers on the `claude` label. Create it in GitHub: Settings > Labels > New label.
