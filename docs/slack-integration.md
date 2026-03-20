# Slack Integration Guide

Two ways to use Claude Code with this repo from Slack: the **native Claude Code in Slack** integration (recommended), and a **GitHub Actions fallback** for `@claude` mentions on issues/PRs.

## Architecture

```
Slack #keskonmange                     claude.ai/code           GitHub            Vercel
      |                                      |                     |                 |
  @Claude "add dark mode"                    |                     |                 |
      |                                      |                     |                 |
      +---[native Claude for Slack]--------->|                     |                 |
      |                              Claude Code session           |                 |
      |                              (reads CLAUDE.md,             |                 |
      |                               implements feature)          |                 |
      |                                      |                     |                 |
      |<------ progress updates -------------|                     |                 |
      |                                      |                     |                 |
      |                              "Create PR" ----------------->|                 |
      |                                      |                PR #99                 |
      |                                      |                     +---------------->|
      |                                      |                     |        Preview deploy
      |<------ "Done! PR created" -----------|                     |                 |
      |                                      |                     |                 |
  Review preview on phone, approve, merge                          |                 |
                                                                   +-- prod deploy ->|
```

## Option 1: Native Claude Code in Slack (Recommended)

This is the built-in integration. Claude Code runs on the web, understands your repo via `CLAUDE.md`, and creates PRs directly — no GitHub Issue bridge needed.

### Prerequisites

| Requirement | Details |
|-------------|---------|
| Claude plan | Pro, Max, Teams, or Enterprise with Claude Code access |
| Claude Code on the web | Enabled at [claude.ai/code](https://claude.ai/code) |
| GitHub account | Connected to Claude Code with this repo authenticated |
| Slack | Claude app installed in workspace |

### Setup

#### 1. Install the Claude app in Slack

A workspace admin installs the Claude app from the [Slack App Marketplace](https://slack.com/marketplace/A08SF47R6P4).

#### 2. Connect your Claude account

1. Open the Claude app in Slack (Apps section)
2. Go to the **App Home** tab
3. Click **Connect** and complete the auth flow in your browser

#### 3. Connect the repo in Claude Code on the web

1. Go to [claude.ai/code](https://claude.ai/code)
2. Sign in with the same account you linked to Slack
3. Connect your GitHub account
4. Authenticate the `keskon-mange-ce-midi` repository

#### 4. Choose routing mode

In the Claude App Home in Slack, set the **Routing Mode**:

- **Code only**: All `@Claude` mentions go to Claude Code sessions. Best if the channel is dev-only.
- **Code + Chat**: Claude auto-routes coding tasks to Code and general questions to Chat. Fallback buttons let you override.

#### 5. Invite Claude to the channel

```
/invite @Claude
```

in `#keskonmange`. Claude only responds in channels where it's been invited.

### Usage

Post in `#keskonmange`:
```
@Claude add a loading spinner on the restaurant list page
```

What happens:
1. Claude detects coding intent and creates a **Claude Code session** on the web
2. It reads `CLAUDE.md`, understands the project conventions, and implements the feature
3. **Progress updates** are posted back to your Slack thread
4. When done, Claude `@mentions` you with a summary and action buttons:
   - **View Session**: See the full transcript on claude.ai/code
   - **Create PR**: Open a pull request with the changes
   - **Change Repo**: Pick a different repository if Claude guessed wrong
5. Vercel auto-deploys a **preview** on the PR
6. Review the preview, approve, merge — production deploys on merge to main

### Tips

- **Use threads**: Reply in a thread about a bug so Claude gets the full conversation context
- **Be specific**: Include file names, function names, error messages
- **Define "done"**: "...and add a test for it" or "...and update the i18n messages"
- Claude reads `CLAUDE.md` which includes all project conventions (Biome, conventional commits, test rules)

## Option 2: GitHub Actions Claude Code (Fallback)

For teams without a Claude Pro/Max/Teams plan, or for triggering Claude from GitHub directly. Uses the `@anthropics/claude-code-action` GitHub Action with an Anthropic API key.

### Setup

#### 1. Install the Claude GitHub App

```bash
claude /install-github-app
```

Or manually: go to [github.com/apps/claude](https://github.com/apps/claude), install on the repo.

#### 2. Add Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com) > API Keys
2. Create a new key
3. In GitHub: **Settings > Secrets and variables > Actions > New repository secret**
4. Name: `ANTHROPIC_API_KEY`, Value: your key

#### 3. Use it

- Comment `@claude` on any issue or PR to trigger Claude Code
- Create an issue with the `claude` label to have Claude pick it up automatically

The workflow is already configured in `.github/workflows/claude-code.yml`.

## Vercel Preview Deploys

No extra setup needed — Vercel auto-deploys previews on every PR once the repo is connected.

1. Go to [vercel.com](https://vercel.com) > your project > Settings > Git
2. Ensure the GitHub repository is connected
3. Set preview environment variables (same as production):
   - `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
4. Add your Vercel preview domain to Google OAuth redirect URIs

## Slack PR Notifications (Optional)

The `.github/workflows/slack-notify.yml` workflow posts to `#keskonmange` when any PR is opened. To enable:

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable **Incoming Webhooks**, add one for `#keskonmange`
3. Add the webhook URL as `SLACK_WEBHOOK_URL` in GitHub repo secrets

> This is optional if you use the native Claude Slack integration, since Claude already posts updates to Slack threads.

## Cost Summary

| Service | Cost |
|---------|------|
| Claude Code in Slack | Included in Pro ($20/mo), Max, Teams, or Enterprise plans |
| Claude Code GitHub Action | Per API token via Anthropic API (~$0.01-1.00 per task) |
| GitHub Actions | Free for public repos, 2000 min/month for private |
| Vercel | Free hobby tier |
| Neon PostgreSQL | Free tier (100 compute-hours/month) |

## Current Limitations

- **GitHub only**: Claude Code currently supports GitHub repositories only
- **Channels only**: Claude in Slack works in channels (public/private), not DMs
- **One PR per session**: Each Claude Code session can create one pull request
- **Rate limits**: Sessions count against your individual Claude plan limits
