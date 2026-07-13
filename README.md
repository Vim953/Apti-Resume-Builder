# APTI — AI Resume Builder

**Stack:** Next.js 14 (App Router) · NestJS 10 · Supabase (Auth / Postgres / Storage) · Gemini · Playwright/Chromium

---

## Quick Start

### 1 — Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| npm | ≥ 10 |
| Supabase project | any tier |
| Gemini API key | any model-access plan |

---

### 2 — Clone & install

```bash
git clone <repo-url> apti-resume-builder
cd apti-resume-builder
npm install          # installs workspaces: apps/api + apps/web
                     # postinstall also downloads Chromium for PDF export
```

---

### 3 — Supabase setup

#### 3a — Run migrations

In the Supabase dashboard → **SQL Editor**, run the two migration files in order:

```
supabase/migrations/0001_init.sql          # core schema (resumes, sections, ATS, AI events, templates, credits)
supabase/migrations/0002_profiles_and_storage.sql  # profiles table + storage bucket
```

Or if you have the Supabase CLI:

```bash
supabase db push
```

#### 3b — Collect credentials

From **Project Settings → API**:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret) |
| `SUPABASE_JWT_SECRET` | **Project Settings → JWT Settings → JWT Secret** |

---

### 4 — Configure environment

#### Backend — `apps/api/.env`

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in all required values (see `.env.example` for every variable and its purpose).

**Required:**
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
GEMINI_API_KEY=...
```

**Optional (integration touch-points):**
```
PROFILE_API_URL=        # APTI Profile module — prefills personal/education
PROJECTS_API_URL=       # APTI Projects module
CERTIFICATIONS_API_URL= # APTI Certifications module
SKILL_GAP_API_URL=      # APTI Skill Gap module
APP_URL=https://apti.in # Footer text on Free-plan PDF exports
```

> **Standalone mode:** If the upstream module URLs are left blank the resume builder runs perfectly on its own — it just won't pre-fill data from other APTI modules on first open.

#### Frontend — `apps/web/.env.local`

```bash
cp apps/web/.env.example apps/web/.env.local
```

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

### 5 — Run

```bash
# Terminal 1 — API (NestJS on :4000)
npm run dev:api

# Terminal 2 — Web (Next.js on :3000)
npm run dev:web
```

Open **http://localhost:3000** — you'll land on the login page.

---

### 6 — Create your first user

Option A — Supabase dashboard: **Authentication → Users → Add user**

Option B — signup page: visit **http://localhost:3000/signup**, create an account, confirm the email link.

---

## Project Structure

```
apti-resume-builder/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── ai/             # AI Improve, Tips, Summary, project descriptions
│   │       ├── ats/            # Deterministic ATS scorer (zero LLM calls)
│   │       ├── auth/           # Supabase JWT guard + server-side plan resolution
│   │       ├── integrations/   # APTI platform touch-points (profile, projects, certs)
│   │       ├── pdf/            # Chromium PDF export + Supabase Storage upload
│   │       ├── resumes/        # CRUD, sections, autosave, ATS recompute
│   │       ├── supabase/       # Service-role client (global module)
│   │       └── templates/      # Template catalogue
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── auth/callback/  # Supabase auth code exchange
│       │   ├── login/          # Login page
│       │   ├── signup/         # Signup page
│       │   └── resume/[id]/    # Resume editor
│       ├── components/         # All UI components
│       └── lib/
│           ├── api.ts          # Typed API client (auto-injects Bearer token)
│           ├── auth-context.tsx # Supabase session + plan state + setAccessTokenProvider
│           ├── supabase/client.ts  # Browser Supabase client
│           └── supabase/server.ts  # Server Supabase client
├── supabase/migrations/        # SQL migrations (run these first)
└── middleware.ts               # Session refresh + route protection
```

---

## Authentication Architecture

| Layer | What it does |
|-------|-------------|
| `middleware.ts` | Runs on every request; refreshes the Supabase session cookie; redirects signed-out visitors to `/login` |
| `lib/auth-context.tsx` | React context; subscribes to `onAuthStateChange`; calls `setAccessTokenProvider()` so every API fetch automatically includes `Authorization: Bearer <token>` |
| `lib/api.ts` | `request()` helper; pulls the current access token via the provider before every call — no request ever goes out without a token |
| `apps/api/src/auth/supabase-auth.guard.ts` | Verifies the JWT on every endpoint; resolves the student's real plan from the `profiles` table (never trusts a client-supplied `plan` parameter) |

---

## SRS Compliance Summary

| Req ID | Description | Status |
|--------|-------------|--------|
| RB-CNT-01 | Personal/contact block, editable inline | ✅ |
| RB-CNT-02 | Education entries | ✅ |
| RB-CNT-03 | Skills with add/remove, grouped | ✅ |
| RB-CNT-04 | Projects auto-sourced, include/exclude | ✅ |
| RB-CNT-05 | Certifications from module, toggle | ✅ |
| RB-CNT-08 | Professional summary, AI-generated | ✅ |
| RB-EDT-01 | Two-pane editor/preview layout | ✅ |
| RB-EDT-02 | Preview updates in real time | ✅ |
| RB-EDT-03 | Inline validation (email, URL, required) | ✅ |
| RB-EDT-04 | Autosave with visual indicator | ✅ |
| RB-EDT-05 | Mobile editor/preview toggle | ✅ |
| RB-TPL-01 | Free plan gets ATS-safe template | ✅ |
| RB-TPL-02 | Single-column, selectable text | ✅ |
| RB-AI-01 | AI Improve (strong model, diff UI) | ✅ |
| RB-AI-02 | AI Tip for skills/keywords | ✅ |
| RB-AI-03 | Project description generation | ✅ |
| RB-AI-04 | All AI shown as accept/reject diff | ✅ |
| RB-AI-05 | Tiered model routing | ✅ |
| RB-AI-07 | AI professional summary | ✅ |
| RB-ATS-01 | ATS score (0–100) live on preview | ✅ |
| RB-ATS-02 | Weighted component score | ✅ |
| RB-ATS-03 | Per-component breakdown + fixes | ✅ |
| RB-INT-01 | Profile/education prefill | ✅ |
| RB-INT-02 | Projects sync | ✅ |
| RB-INT-03 | Certifications sync | ✅ |
| RB-EXP-01 | PDF with selectable text | ✅ |
| RB-EXP-02 | Deterministic filename, Free watermark | ✅ |
| RB-ENT-01 | Free: 1 template, 1 resume, limited AI | ✅ |
| RB-ENT-02 | Pro: all templates, multiple resumes | ✅ |
| RB-ENT-03 | AI credits metered per plan/period | ✅ |
| RB-ENT-04 | Gated actions show upgrade prompt | ✅ |
| NF-SEC-01 | RLS — own resumes only | ✅ |
| NF-SEC-02 | JWT auth on every endpoint | ✅ |
| NF-COST-01/02 | Credit caps + tiered model routing | ✅ |
| NF-COST-03 | ATS scoring deterministic, zero LLM | ✅ |
| NF-A11Y-01 | Keyboard navigation, visible focus | ✅ |

---

## Deploying

### API (e.g. Railway / Render)
- Set all env vars from `.env.example`
- Set `CHROMIUM_EXECUTABLE_PATH` if your host doesn't support Playwright's bundled Chromium (use `@sparticuz/chromium` on Lambda/Vercel)
- Build: `npm run build:api` → Start: `node apps/api/dist/main.js`

### Web (Vercel)
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`
- Build command: `npm run build:web`
- Output directory: `apps/web/.next`

---

## Environment Variables Reference

### `apps/api/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service-role key (bypasses RLS for PDF storage) |
| `SUPABASE_JWT_SECRET` | ✅ | JWT secret for verifying student tokens |
| `GEMINI_API_KEY` | ✅ | Gemini API key for AI features |
| `GEMINI_MODEL_LIGHT` | — | Default: `gemini-1.5-flash` |
| `GEMINI_MODEL_STRONG` | — | Default: `gemini-1.5-pro` |
| `AI_CREDITS_FREE_MONTHLY` | — | Default: `15` |
| `AI_CREDITS_PRO_MONTHLY` | — | Default: `300` |
| `PROFILE_API_URL` | — | APTI Profile module URL |
| `PROJECTS_API_URL` | — | APTI Projects module URL |
| `CERTIFICATIONS_API_URL` | — | APTI Certifications module URL |
| `SKILL_GAP_API_URL` | — | APTI Skill Gap module URL |
| `CHROMIUM_EXECUTABLE_PATH` | — | Custom Chromium path (serverless deploy) |
| `APP_URL` | — | Watermark footer URL (default: `apti.in`) |

### `apps/web/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `NEXT_PUBLIC_API_URL` | — | Default: `http://localhost:4000/api/v1` |
