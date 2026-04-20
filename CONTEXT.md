# NOMAAD AI PLATFORM — Project Context (AI Handoff Document)

> **Keep this file updated at the end of every AI session.**
> Any AI assistant should read this file FIRST before making changes.

---

## Quick Facts

| Key | Value |
|-----|-------|
| **Project Path** | `/Users/mavestone/Google/nomaad` |
| **Framework** | Vite + React 19 (JSX, not TypeScript for components) |
| **Styling** | Inline styles + Tailwind CSS v4 (both used) |
| **Backend** | Supabase (Auth, Postgres, RLS) |
| **Deployment** | Vercel → `nomaad-ai-platform.vercel.app` |
| **Dev Server** | `npm run dev` (may need `export PATH="/opt/homebrew/Cellar/node/25.5.0/bin:$PATH"` first) |
| **Supabase Config** | `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| **Design Language** | Apple Liquid Glass / macOS Tahoe — dark-mode-first, glassmorphic, volt accent `#CCFD01` |

---

## Tech Stack

- **React 19** via Vite 8
- **Supabase JS v2** for auth + database
- **Lucide React** for icons (but most icons are inline SVGs in App.jsx)
- **Motion (Framer Motion v12)** for animations
- **date-fns** for date utils
- **@dnd-kit** for drag-and-drop
- **@visx** for charts
- **react-use-measure** for responsive measurements

---

## Architecture

```
src/
├── App.jsx                    # Main shell: sidebar nav, theme system, route switching, Dashboard view
├── main.jsx                   # React root mount
├── index.css                  # Global CSS + Tailwind imports
├── contexts/
│   └── AuthContext.jsx         # Supabase auth provider (session, profile, signOut)
├── lib/
│   └── supabase.js             # Supabase client init
├── components/
│   ├── AuthPage.jsx            # Login/signup page
│   └── ui/
│       ├── prospecting-view.jsx   # Lead discovery (basic — needs overhaul)
│       ├── crm-view.jsx           # CRM with pipeline kanban + client profiles
│       ├── projects-view.jsx      # Project management with kanban boards
│       ├── calendar-view.jsx      # Full calendar (week/day/month, drag, NLP create)
│       ├── automations-view.jsx   # n8n-style workflow builder (node-based)
│       ├── financials-view.jsx    # Transactions + invoices dashboard
│       ├── docs-view.jsx          # Document management
│       ├── messages-view.jsx      # Messaging with channels
│       ├── client-portal-view.jsx # Client-facing portal (basic)
│       ├── deliverables-view.jsx  # Deliverables management
│       ├── area-chart.tsx         # Visx area chart component
│       └── demo.tsx               # Chart demo wrapper
supabase/
└── schema.sql                 # Full database schema (run in Supabase SQL Editor)
```

---

## Design System

### Colors
- **Volt (Primary Accent):** `#CCFD01` / `#B8E300` (dark variant)
- **Shell Dark:** `#08080a` | **Shell Light:** `#F2EFE9`
- **Cards:** Glassmorphic — semi-transparent with `backdrop-filter: blur(24px) saturate(1.6)`
- **Coral:** `#FF6259` | **Amber:** `#FFB340` | **Teal:** `#5AC8FA`

### Theme Object
The theme system is defined in `App.jsx` as the `T` object with `light` and `dark` variants. Every component receives `t` (theme), `dark` (boolean), `mobile`, and `compact` as props.

### Key Design Rules
1. Dark mode first — rich black, NOT pure #000
2. Volt accent used SPARINGLY — CTAs, active states, badges only
3. Generous border-radius (12-24px), generous padding
4. Cards float with layered shadows + glassmorphism
5. Spring-based animations, nothing snaps
6. System font stack: `-apple-system, 'SF Pro Display', system-ui, sans-serif`

---

## Database Schema (Supabase)

Tables with RLS enabled, all scoped to `user_id = auth.uid()`:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (auto-created on signup via trigger) |
| `customers` | CRM contacts |
| `prospects` | Prospecting pipeline leads |
| `projects` | Project management |
| `tasks` | Project tasks (kanban cards) |
| `calendar_events` | Calendar events |
| `documents` | Docs module |
| `channels` | Message channels |
| `messages` | Messages within channels |
| `automations` | Workflow automations (nodes/edges as JSONB) |
| `transactions` | Financial transactions |
| `invoices` | Client invoices |

Full schema: `supabase/schema.sql`

---

## Navigation Structure

**Sidebar Main Menu** (navSec=0):
0. Dashboard — Business overview with live stats from Supabase
1. Prospecting — Lead discovery
2. CRM — Client management with kanban pipeline
3. Projects — Project boards with kanban tasks
4. Calendar — Week/Day/Month calendar with drag & NLP
5. Automations — n8n-style workflow builder
6. Financials — Transactions & invoices

**Sidebar Settings** (navSec=1):
0. Docs — Document management
1. Messages — Channel-based messaging
2. Settings — **NOT YET BUILT**

---

## What's Been Built (Status)

### ✅ Fully Functional
- **Auth** — Supabase login/signup with auth-gated UI, loading timeout fallback
- **Dashboard** — Live stats from Supabase (prospects, projects, transactions, events)
- **CRM** — Full CRUD, pipeline kanban with drag-and-drop, client profile slide-out, add new lead modal
- **Projects** — Project list, kanban board per project, add project/task modals, Supabase CRUD
- **Calendar** — Complete rebuild: week/day/month views, drag-create/move/resize, Inbox Rail (templates + tasks), NLP quick-create, Google Calendar OAuth, keyboard shortcuts (C, T, J/K, 1-3, D/W/M, Esc), localStorage persistence, context menu
- **Financials** — Transaction list, stats, add transaction modal, Supabase CRUD
- **Automations** — n8n-style node-based workflow builder with wire connections
- **Docs** — Document CRUD, project assignment
- **Messages** — Channel list, message thread, send messages

### 🔶 Built But Basic / Needs Overhaul
- **Prospecting** — Basic list view, needs curated card-based discovery UX with API search
- **Client Portal** — Basic shell, needs full branded client view
- **Messages** — State-managed but not fully real-time via Supabase subscriptions

### ❌ Not Built Yet
- **Settings page** — Nav item exists, no implementation
- **Automated onboarding flow** — Proposal → contract → invoice → project auto-generation
- **Content Planner / Social Publisher**
- **AI features** — Email drafting, follow-up suggestions, meeting summaries, phone handling
- **Scheduling links** — Calendly-like booking link generation
- **Real-time messaging** — Supabase realtime subscriptions
- **Search (⌘K)** — Global search across all modules
- **Mobile responsive polish** — Basic responsive exists but needs work

---

## Project Brief

The full product brief with user personas, problems solved, and module priorities is at:
`/Users/mavestone/.gemini/antigravity/brain/df6f596d-8f34-4bf8-90bf-d5e431c2f3c2/artifacts/nomaad_brief.md`

**TL;DR:** Nomaad is an all-in-one OS for solo creatives/freelancers replacing 8-12 separate tools. Core promise: reduce daily admin from ~4 hours to ~20 minutes.

---

## How to Run

```bash
# If node isn't on PATH:
export PATH="/opt/homebrew/Cellar/node/25.5.0/bin:$PATH"

# Install & run
npm install
npm run dev
```

---

## Git / Deploy Rules

- **Remote:** `https://github.com/mavestone/nomaad-ai-platform.git` → also deploys to Vercel automatically
- **Author:** `Liam <hello@mavestone.com>` (already set in git config)
- **After every significant change:** commit + `git push origin main`
  - Vercel picks up the push and redeploys automatically
  - Commit message format: `feat/fix/refactor(scope): short description`

---

## Session Log

| Date | AI | Work Done |
|------|-----|-----------|
| 2026-04-05 | Antigravity | Initial build, Supabase auth, schema, MVP integration, CRM pipeline |
| 2026-04-16 | Claude (Sonnet 4.6) | Auth timeout fix, Calendar P0 rebuild + fixes, Google OAuth |
| 2026-04-16 | Claude (Sonnet 4.6) | Session handoff, context review |
| 2026-04-16 | Claude (Sonnet 4.6) | Google OAuth fix (Web app type, test user); Calendar: floating event popup (near-click, not slide-in), Google Meet join button, Calendars rail tab (connect/disconnect/sync), user-creatable + deletable templates (localStorage), month view equal cell heights, grid scrollbar alignment fix |
| 2026-04-17 | Claude (Sonnet 4.6) | Messages: ripped out localStorage cache, made send optimistic (`opt-` IDs), fixed "disappears on refresh" by driving data load off `INITIAL_SESSION` in `onAuthStateChange` (not `getSession()`). Built OnboardingView (5-step post-signup). Built UserProfileView (Linktree-style portfolio with edit mode, portfolio projects, availability, social links, shareable `/p/:username`). Moved profile button to sidebar bottom. Added `supabase/onboarding-migration.sql` (new profile columns: onboarding_complete, business_type, business_name, use_cases, bio, location, availability, portfolio_projects, social_links, username) — user must run in SQL Editor. Delivered 4-week MVP build plan: Tier 1 = finish Projects (wire tasks table, creative stages, client FK) + live Dashboard; Tier 2 = unified Tasks view, invoice↔project link, shareable portfolio public route; cut Automations/Prospecting/Client Portal/Content Planner from MVP. Positioning: "all-in-one OS for solo creatives — replace Notion + spreadsheets + Notes." |
| 2026-04-17 | Claude (Sonnet 4.6) | Settings UI: added currency selector. Demo UI: made charts accept real data. Dashboard UI: returned and wired up Cashflow area chart with transactions. Prospecting UI: removed hardcoded array, replaced with prospects table fetch. Hit API limit. |
| 2026-04-18 | Antigravity | Continued from Claude's session to purge remaining dummy data. Replaced `MOCK_DELIVERABLES` with `documents` query, wired `INBOX_TASKS` in `calendar-view.jsx` to fetch from `tasks` table, removed `MOCK_USERS` from `projects-view.jsx`, replaced hardcoded `MEMBERS` array in `nomaad-connect.jsx` with real `profiles` fetch. All pages build cleanly. **Next session**: Pick up with Week 1 MVP Priorities — Wire the tasks table properly to projects in `projects-view.jsx`, add FKs to Supabase schema, and persist CRM notes/tags. |
| 2026-04-20 | Antigravity | Rebuilt `UserProfileView.jsx` using Radix/OriginUI floating un-controlled dialog modals (`EditProfileDialog` + `ProjectDialog`). Solved bug where name change required hard-refresh (optimistic UI update via AuthContext). Inserted "Your Skills" phase in `OnboardingView.jsx`. Extended `schema.sql` profiles struct (skills, bio, use_cases, etc). Overhauled `PublicProfilePage.jsx` to feature a highly convertible Linktree-inspired aesthetic spanning Book a Call, Email, and dynamic YouTube project CTAs. Fixed minor layout overflow bounds on `LandingPage.jsx` mobile rendering. |

> **UPDATE THIS TABLE at the end of every session with what was accomplished.**

---

## Current MVP Priorities (as of 2026-04-17)

**Target:** Ship MVP within 1 month. Test: "Can a solo filmmaker run 3 paid jobs end-to-end without Notion/Sheets/Notes?"

**Week 1 — Data spine**
- Wire `tasks` table in projects-view (currently unused)
- Migrate project stages to: Briefing → Production → Review → Delivered → Invoiced
- Add FKs: `projects.client_id`, `invoices.client_id`, `tasks.project_id`
- Persist CRM notes + tags to Supabase
- Hide nav: Automations, Prospecting, Client Portal, Deliverables

**Week 2 — Live Dashboard**
- Replace hardcoded `BusinessOverview` in App.jsx with real queries
- KPIs: unpaid invoices $, month income, active projects, overdue tasks
- Today widget, Attention widget, Recent activity

**Week 3 — Tasks + polish**
- New unified Tasks view (all tasks, filter by project/client/due)
- Invoice prompt when project → Invoiced stage
- Wire Financials summary sums (currently hardcoded)
- Public route `/p/:username` for portfolio

**Week 4 — Ship**
- Mark-paid → creates transaction
- Mobile polish (Dashboard/Projects/CRM/Invoices)
- Empty states everywhere
- ⌘K search (customers + projects + invoices)
- Landing + Stripe checkout, £19/mo single plan
- Soft launch to 10 solo filmmakers

**Explicitly cut from MVP:** automations, email sequences, content planner, AI features, scheduling links, prospecting rebuild, settings page, realtime messaging upgrade, Stripe auto-reconciliation, mobile app.
