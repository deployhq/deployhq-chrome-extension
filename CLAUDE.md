# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Overview

DeployHQ Chrome Extension - a Manifest V3 browser extension that integrates with the DeployHQ deployment platform. Provides a popup dashboard, one-click deploys, background status polling with desktop notifications, and "Deploy with DeployHQ" buttons injected into GitHub, GitLab, and Bitbucket PR pages.

## Commands

```bash
npm run dev          # Build in watch mode (development)
npm run build        # Production build (typecheck + vite build)
npm run typecheck    # TypeScript check only
```

### Loading locally

1. `npm run build`
2. Chrome > `chrome://extensions/` > Developer mode > Load unpacked > select `dist/`

## Tech Stack

- **TypeScript**, **React 18**, **Tailwind CSS 3**
- **Vite 5** with `@crxjs/vite-plugin` for Chrome extension bundling
- **Manifest V3** (required for Chrome Web Store)

## Architecture

```
src/
  background/service-worker.ts   # Polling, badge updates, notifications
  popup/                         # React app (380px wide popup)
    pages/Login.tsx              # Auth setup (email + API key + subdomain)
    pages/Dashboard.tsx          # Project list with search
    pages/ProjectDetail.tsx      # Servers, groups, recent deployments
    pages/DeployForm.tsx         # Deploy trigger (target + branch + revision)
    pages/Settings.tsx           # Notifications, polling interval, logout
    components/                  # StatusBadge, Header, ErrorMessage, LoadingSpinner
    hooks/useDeployIntent.ts     # Reads deploy intent from content scripts
  content/                       # Injected into git platform pages
    github.ts                    # GitHub PR/branch/repo pages
    gitlab.ts                    # GitLab MR/branch pages
    bitbucket.ts                 # Bitbucket PR/branch pages
    shared.ts                    # Button creation, project matching, toast
    github.css                   # Shared styles for injected buttons
  shared/                        # Used by all layers
    api.ts                       # DeployHQ API client (HTTP Basic Auth)
    types.ts                     # TypeScript types matching API responses
    storage.ts                   # Chrome storage wrapper (credentials, settings)
    constants.ts                 # Status colors, protocol labels
```

## API Integration

Uses the **DeployHQ Main API** with HTTP Basic Auth (`email:apiKey` base64-encoded).

Base URL: `https://{subdomain}.deployhq.com`

Key endpoints used:
- `GET /projects.json` - List projects
- `GET /projects/{permalink}/servers.json` - List servers
- `GET /projects/{permalink}/deployments.json` - List deployments (paginated)
- `POST /projects/{permalink}/deployments.json` - Trigger deployment
- `GET /projects/{permalink}/repository/branches.json` - List branches
- `GET /projects/{permalink}/repository/latest_revision.json` - Get latest revision

Full API docs: https://api.deployhq.com/docs

## Content Script Integration

Content scripts inject a "Deploy with DeployHQ" button on git platform pages. The flow:

1. Script detects page type (PR, branch, repo) via URL pattern matching
2. Fetches DeployHQ projects and matches by comparing repository URLs
3. If match found, injects button into the page header
4. Button click stores a deploy intent in `chrome.storage.local` and opens the popup
5. Popup reads the intent via `useDeployIntent` hook and navigates to DeployForm

GitHub/GitLab/Bitbucket update their DOM frequently - the CSS selectors in content scripts may need periodic updates.

## Key Design Decisions

- **No OAuth** - Uses API key auth (simpler, no backend needed, matches existing API)
- **Polling over WebSockets** - DeployHQ's Myxi WebSocket server is internal; API polling at 60s intervals is sufficient
- **Optional host permissions** - Git platform permissions are requested at install but optional
- **Project matching** - Normalizes repo URLs (handles git@/https://.git variations) to match DeployHQ projects
- **Badge states** - Running (blue "..."), Failed (red "!"), OK (clear), Error (gray "?")

## Security Notes

- API key stored in `chrome.storage.local` (not synced across devices)
- All API calls over HTTPS only
- Content scripts use `optional_host_permissions` for git platforms
- Never log or expose API keys in console output
