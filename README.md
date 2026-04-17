# Invoke CRM/PM

Internal CRM and project management tool built for software teams. Replaces Jira/ClickUp with a focused, fast experience — clients, projects, tasks, and three views (Kanban, Calendar, Timeline) in one place.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Database / Auth | Supabase (PostgreSQL + RLS) |
| Styling | Tailwind CSS + shadcn/ui |
| Drag & Drop | @dnd-kit |
| Calendar | react-big-calendar |
| Charts | Recharts |
| Monorepo | Turborepo + pnpm |

---

## Features

- **Dashboard** — live stats, project table with task/member counts
- **Clients** — full CRUD with contact info and project history
- **Projects** — Kanban board, Calendar, and Timeline view per project
- **Tasks** — all-tasks view with My Tasks, Today, This Week, Overdue filters
- **Analytics** — task status, priority, and team workload charts
- **⌘K Command palette** — search projects, clients, and tasks instantly
- **Dark / light mode** — system default with manual toggle
- **Auth** — email/password via Supabase Auth with RLS-enforced data scoping

---

## Local Development

**Requirements:** Node 18+, pnpm, Docker Desktop

### 1. Clone and install

```bash
git clone https://github.com/Marcellous11/invoke-crm.git
cd invoke-crm
pnpm install
```

### 2. Start local Supabase

```bash
pnpm db:start
```

This spins up a local Postgres + Auth instance, runs migrations, and seeds 5 users, 6 clients, 8 projects, and 50 tasks.

**Test credentials:** `admin@invoke.dev` / `password123`

### 3. Run the app

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

---

## Environment

The app automatically uses the correct Supabase instance based on environment:

| File | Used when |
|---|---|
| `.env.development.local` | `pnpm dev` → local Supabase |
| `.env.production.local` | `pnpm build` / `pnpm start` → remote Supabase |

Copy `.env.local.example` to get started with remote keys.

---

## Database Commands

```bash
pnpm db:start    # start local Supabase containers
pnpm db:stop     # stop containers
pnpm db:reset    # wipe and re-seed from scratch
pnpm db:status   # check running services
```

Local Supabase Studio runs at `http://127.0.0.1:54323`.

---

## Project Structure

```
invoke-crm/
├── apps/
│   └── web/          # Next.js app
├── packages/
│   └── types/        # Shared TypeScript types
└── supabase/
    ├── migrations/   # Schema migrations
    └── seed.sql      # Dev seed data
```

---

## Roadmap

- [ ] Real-time notifications (Supabase Realtime)
- [ ] Mobile app (React Native / Expo)
- [ ] Task comments and attachments
- [ ] Team invites via email
