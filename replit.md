# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Business Hub — an online business automation dashboard for managing digital projects (websites, YouTube channels, AI influencer accounts, apps), tracking revenue, expenses, keyword research, daily planning, content calendar, tasks, and notes. Protected with Clerk authentication.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: SQLite (embedded, single file) via `@libsql/client` + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui
- **Routing**: wouter (client-side)
- **Data fetching**: TanStack React Query + Orval-generated hooks
- **Auth**: Simple password-based (ADMIN_PASSWORD env var)

## Architecture

- `artifacts/dashboard` — React frontend (Vite) at `/`
- `artifacts/api-server` — Express REST API (Clerk-protected)
- `lib/api-spec` — OpenAPI 3.0 specification
- `lib/api-client` — Generated axios client (Orval)
- `lib/api-client-react` — Generated React Query hooks (Orval)
- `lib/api-zod` — Generated Zod validators (Orval)
- `lib/db` — Drizzle schema + embedded SQLite connection (auto-creates `data/business-hub.db` and tables on first run via `ensureSchema()` in `src/migrate.ts`)

## Database Tables

- `projects` — digital projects (website, app, youtube, ai_influencer) with status (idea, building, live, paused, abandoned, flopped)
- `revenue` — income entries by source (ads, youtube, subscriptions, apps, freelance, other)
- `tasks` — task management with priority, due dates, streak tracking
- `content` — content calendar (youtube, instagram, tiktok, blog, twitter)
- `notes` — quick notes/ideas with categories
- `activity` — activity feed for dashboard
- `keywords` — keyword research (niche, volume, difficulty, CPC, competition, position, status)
- `planner` — daily planner items (date, time slot, project, priority, status)
- `expenses` — expense tracking (tools, subscriptions, hosting, domains, freelancers, ads) with billing cycle
- `daily_focus` — "Today's 3 tasks" — exactly 3 focus slots per day (unique index on date+slot), with completedAt for streak math
- `daily_reflection` — End-of-day reflection (one row per date, unique on date), fields: didWhat, blocker, lesson
- `wins` — chronological win log (text, createdAt) — for momentum / proof-of-progress
- `settings` — singleton row id=1, seeded by `INSERT OR IGNORE` in `ensureSchema()`. Holds: mission, monthlyGoalAmount, killWarnDays, killDeadDays, weekStartsOn, reflectionStartHour

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only). Not normally needed: api-server runs `ensureSchema()` on startup and creates any missing SQLite tables idempotently.
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Notes

- SQLite file location: `${cwd}/data/business-hub.db` by default (override with `DATABASE_URL` env var). Accepts a bare file path, `file:` URL, `libsql:` URL, or remote http(s) Turso URL.
- A `DATABASE_URL` starting with `postgres://` / `postgresql://` is ignored and the default local SQLite file is used (legacy Replit Postgres URL won't break the app).
- `data/`, `*.db`, `*.db-wal`, `*.db-shm` are gitignored — DB lives only on disk where the app runs.
- Backups: just copy the `.db` file. Migration to another machine: copy the file.

## Frontend Pages

- `/` — Password login page (redirects to /hub after login)
- `/hub` — "Empire Control Room" dashboard. Top of page: TodayFocus (3 focus slots + streak), MonthlyGoalBar, then standard stat cards, WinsLog, EndOfDayReflection (only after `reflectionStartHour` PKT), WeeklyReview (revenue/tasks/focus-days/streak + per-project kill-flags), recent activity, quick stats. All UI copy is in English (the user previously preferred Roman Urdu but reverted on 2026-04-25 — keep all new strings English-only).
- `/projects` — Project cards with CRUD, type filters, abandoned/flopped status support. Each card shows age in days and a Kill Rule badge (working / review / kill — `grace` is hidden) computed from settings thresholds via `lib/kill-flag.ts`
- `/settings` — Owner-only settings: mission text (shows in MissionStrip atop every page), monthlyGoalAmount, Kill Rule thresholds (killWarnDays, killDeadDays), reflectionStartHour
- `/revenue` — Revenue tracking with source breakdown, monthly comparison
- `/expenses` — Expense tracking with monthly burn, yearly costs, category breakdown, active/deactivate toggle
- `/tasks` — Task list with priority badges, toggle completion, streak counter, delete
- `/planner` — Daily planner with week view, date navigation, status cycling (planned/in_progress/done/skipped)
- `/keywords` — Keyword research table with niche filters, volume/difficulty/CPC/competition columns, status tracking
- `/content` — Content calendar with platform filters, status management
- `/notes` — Quick capture notes with category filter

> Scope note (2026-04-24): All AI content/SEO tools (`/content-tools`, `/seo-tools`, `generation_history` table, `lib/integrations-openai-ai-server`) were intentionally removed at user request. Hub is now strictly tracker + management + planner. No AI providers (OpenAI, Anthropic, etc.) are wired into the codebase.
## Authentication

- Simple password-based auth (single owner, no email/signup)
- ADMIN_PASSWORD env secret stores the password
- POST /api/auth/login verifies password, returns session token
- Token stored in localStorage, sent as Bearer header
- API routes protected with `requireAuth` middleware (except `/healthz` and `/auth/*`)
- Frontend uses AuthProvider context for auth state
- Sign-out button in sidebar

## Notes

- CSS: `@import url()` for Google Fonts must come BEFORE `@import "tailwindcss"` in index.css
- Backend route order: dashboardRouter must come before projectsRouter to avoid `/projects/stats` being matched as `/projects/:id`
- `lib/api-zod/src/index.ts` only exports from `./generated/api` (not `./generated/types`) to avoid duplicate export conflicts (the generated `types/` directory exports `interface Foo` while `api.ts` exports `const Foo = zod.object(...)` — both share the type-namespace name and re-exporting both produces TS2308)
- "Empire Control Room" upserts (`POST /focus`, `PUT /reflection`, `PATCH /settings`) all use SQLite `ON CONFLICT(...) DO UPDATE` (Drizzle's `.onConflictDoUpdate({...})`) so concurrent writes never throw a 500 from the unique-index constraint. The settings singleton self-heals via `ON CONFLICT(id) DO NOTHING` if seeding ever gets skipped.
- Daily-focus streak (`/api/focus/streak` and `/api/dashboard/weekly-review`) looks back **365 days** so multi-month streaks are reported accurately; the weekly-review endpoint runs a separate wider focus query just for streak math (the 14-day query is reused only for week-over-week aggregates)
- MissionStrip (`artifacts/dashboard/src/components/mission-strip.tsx`) renders inside Layout above main content on every page — shows mission, streak, completed/filled count, and any review/kill project counts (links to /projects)
- User preference: content must feel human, no AI buzzwords, natural style
- User speaks Roman Urdu/Urdu
- Vite config has safe defaults for PORT/BASE_PATH (fallback to 5173 and "/" if missing)
- `seedDatabase()` in `lib/db/src/seed.ts` is intentionally a no-op — the app starts with an empty database (no demo/sample data)
- `lib/db/src/reset.ts` truncates all data tables (RESTART IDENTITY CASCADE) — used to wipe the dashboard back to a clean state. Run via `pnpm --filter @workspace/db run reset` (requires tsx). The current database has already been truncated.
- Production builds are optimized for lightweight VPS-style hosting: source maps disabled, esbuild minification + tree-shaking enabled in both api-server (build.mjs) and dashboard (vite.config.ts)
- Search-engine indexing is intentionally **disabled** for this app (it's a private owner-only dashboard): `artifacts/dashboard/public/robots.txt` returns `Disallow: /` and `artifacts/dashboard/index.html` includes `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">` (plus a googlebot-specific tag). When self-hosting on a custom domain, additionally set the HTTP header `X-Robots-Tag: noindex, nofollow` at your reverse proxy (e.g. Nginx) to be belt-and-suspenders. Do not remove these unless you intentionally want the dashboard to be indexed.
- Source repo mirror: `https://github.com/shanio786/content-planer` (push uses GITHUB_TOKEN secret)
- Automatic GitHub mirroring: `scripts/github-mirror.sh` runs after every merge via `scripts/post-merge.sh`. Excludes `.git`, `node_modules`, `dist`, `.local`, `.cache`, `.tmp`, `*.log`. Force-pushes a snapshot to the configured GitHub repo. Always attempted (runs even if the install/db-push phase fails) and never fatal — never blocks the merge pipeline.
  - Token is delivered to git via `GIT_ASKPASS` only — never embedded in the remote URL or command-line args.
  - Configurable via env: `GITHUB_MIRROR_REPO` (default: `shanio786/content-planer`), `GITHUB_MIRROR_BRANCH` (default: `main`), `GITHUB_MIRROR_DISABLED=1` to disable, `GITHUB_TOKEN` (required for auth — recommend a fine-grained PAT with **Contents: Read/Write** scoped to the target repo only).
  - To re-target: set `GITHUB_MIRROR_REPO` to a new `owner/name` and ensure GITHUB_TOKEN has write access.
  - To disable: set `GITHUB_MIRROR_DISABLED=1` as a workspace env var, or remove the call from `scripts/post-merge.sh`.
  - **Mirror runbook (verify last push):**
    1. Visit `https://github.com/<GITHUB_MIRROR_REPO>/commits/<GITHUB_MIRROR_BRANCH>` and look for the most recent commit titled `Mirror snapshot <UTC timestamp>`.
    2. If missing/stale, check the post-merge logs for the last task — search for `[github-mirror]` lines (look for `OK:` or `WARN:`).
    3. Manually re-run from the workspace shell: `bash scripts/github-mirror.sh` — output will show the result inline.
    4. Common causes of `WARN: push failed`: token expired/revoked, token scope insufficient, repo deleted/renamed, network outage.
- **Application timezone**: All "today" / "this month" boundaries on the server (`artifacts/api-server/src/routes/dashboard.ts`, `artifacts/api-server/src/routes/planner.ts`) and on the client (`artifacts/dashboard/src/pages/planner.tsx`) go through helpers in `artifacts/api-server/src/lib/timezone.ts` and `artifacts/dashboard/src/lib/timezone.ts`. The configured zone is **Asia/Karachi (PKT, UTC+5, no DST)**, so the dashboard summary cards and planner "today" agree with the owner's wall clock regardless of where the host (Replit / VPS) or the browser is running. The implementation uses a fixed `+5:00` offset because PKT has no DST transitions; if the timezone ever needs to change, update both `APP_TIMEZONE` constants and the matching `APP_TZ_OFFSET_MINUTES` together (and switch to `Intl.DateTimeFormat`-based arithmetic if the new zone observes DST).

## Security Log

### GITHUB_TOKEN rotated — 2026-04-24
- Reason: previous token value had been pasted in chat and was therefore considered compromised.
- User instructed (and confirmed) to revoke the old PAT at https://github.com/settings/tokens before creating a new one.
- New PAT generated by the user with `repo` scope (or fine-grained Contents: Read/Write on `shanio786/content-planer`) and saved as the Replit `GITHUB_TOKEN` secret, replacing the prior value.
- Verified end-to-end against `https://github.com/shanio786/content-planer.git` from a fresh temp clone (token passed only via an inline `credential.helper` reading `$GITHUB_TOKEN`, never written to disk or URLs):
  1. `git ls-remote ... HEAD` → returned `<sha-redacted> HEAD` ✅ auth works.
  2. `git push origin agent/token-rotation-verify-<ts>` (empty commit on throwaway branch) → `* [new branch]      agent/token-rotation-verify-<ts> -> agent/token-rotation-verify-<ts>` ✅ push permission works.
  3. `git push origin --delete agent/token-rotation-verify-<ts>` → `- [deleted]         agent/token-rotation-verify-<ts>` ✅ remote left clean.
- Going forward: never paste secrets (PATs, API keys, DB URLs with passwords, etc.) into chat. Send them via the Replit secrets prompt only. If a secret is exposed, rotate immediately following the runbook below.

### Emergency secret rotation runbook
Use whenever a secret (PAT, API key, DB password, OAuth secret, etc.) is exposed in chat, logs, screenshots, or commits.
1. **Revoke first.** Open the issuing provider's UI and revoke/delete the leaked credential before doing anything else (e.g. https://github.com/settings/tokens for GitHub PATs). Do not wait for the replacement.
2. **Generate a replacement** with the minimum scope/permissions actually needed (e.g. for the GitHub mirror: classic `repo` scope, or fine-grained Contents: Read/Write on `shanio786/content-planer` only).
3. **Store in Replit Secrets**, never in code or chat. Use the secrets pane (or have the agent request it via the secrets prompt). The new value overwrites the old secret of the same name.
4. **Verify** the new credential works end-to-end from a temp clone / temp script — never echo the secret. For git tokens, use a one-shot inline `credential.helper` that reads from `$GITHUB_TOKEN` so the value never lands on a command line or in a remote URL.
5. **Audit for blast radius.** Check provider audit logs (e.g. the GitHub repo's commit history / security log) for any unauthorized activity that may have occurred while the secret was exposed; revert anything suspicious.
6. **Document** the rotation in this Security Log section with the date, reason, and a sanitized verification snippet.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
