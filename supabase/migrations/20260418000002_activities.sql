-- ============================================================
-- Phase 3: Activity log (calls, emails, meetings, notes)
-- ============================================================

create type activity_type as enum ('note', 'call', 'email', 'meeting', 'task');

create table public.activities (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid references public.clients(id)  on delete cascade,
  contact_id   uuid references public.contacts(id) on delete set null,
  project_id   uuid references public.projects(id) on delete cascade,
  type         activity_type not null,
  subject      text not null,
  body         text,
  occurred_at  timestamptz not null default now(),
  created_by   uuid not null references public.users(id) on delete restrict,
  created_at   timestamptz not null default now(),
  constraint activity_has_target
    check (client_id is not null or contact_id is not null or project_id is not null)
);

create index activities_client_id_idx  on public.activities (client_id, occurred_at desc);
create index activities_project_id_idx on public.activities (project_id, occurred_at desc);
create index activities_contact_id_idx on public.activities (contact_id, occurred_at desc);

alter table public.activities enable row level security;

-- Any authenticated user can read; write operations are self-scoped
create policy "Authenticated users can read activities"
  on public.activities for select to authenticated using (true);

create policy "Users can insert their own activities"
  on public.activities for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Authors can update their activities"
  on public.activities for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "Authors can delete their activities"
  on public.activities for delete to authenticated
  using (auth.uid() = created_by);
