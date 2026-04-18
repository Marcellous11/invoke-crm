-- ============================================================
-- Invoke CRM/PM — Database Schema
-- Run this in the Supabase SQL Editor after creating your project
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

create type user_role as enum ('admin', 'member');
create type project_status as enum ('active', 'completed', 'on_hold');
create type project_member_role as enum ('owner', 'member');
create type task_status as enum ('backlog', 'in_progress', 'in_review', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type activity_type as enum ('note', 'call', 'email', 'meeting', 'task');

-- ─── SHARED HELPERS ──────────────────────────────────────────────────────────

create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── USERS (extends auth.users) ──────────────────────────────────────────────

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  avatar_url  text,
  role        user_role not null default 'member',
  created_at  timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CLIENTS ─────────────────────────────────────────────────────────────────

create table public.clients (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  logo_url      text,
  website       text,
  phone         text,
  address       text,
  industry      text,
  company_size  text,
  notes         text,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── CONTACTS ────────────────────────────────────────────────────────────────

create table public.contacts (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  full_name   text not null,
  email       text,
  phone       text,
  title       text,
  is_primary  boolean not null default false,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index contacts_client_id_idx on public.contacts(client_id);
create unique index contacts_one_primary_per_client
  on public.contacts(client_id) where is_primary;

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.trigger_set_timestamp();

create index clients_tags_idx on public.clients using gin (tags);

create trigger set_clients_updated_at
  before update on public.clients
  for each row execute procedure public.trigger_set_timestamp();

-- ─── PROJECTS ────────────────────────────────────────────────────────────────

create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  client_id   uuid references public.clients(id) on delete set null,
  status      project_status not null default 'active',
  start_date  date,
  end_date    date,
  created_by  uuid not null references public.users(id) on delete restrict,
  created_at  timestamptz not null default now()
);

-- ─── PROJECT MEMBERS ─────────────────────────────────────────────────────────

create table public.project_members (
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        project_member_role not null default 'member',
  primary key (project_id, user_id)
);

-- Auto-add creator as owner
create or replace function public.handle_new_project()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_project_created
  after insert on public.projects
  for each row execute procedure public.handle_new_project();

-- ─── TASKS ───────────────────────────────────────────────────────────────────

create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  project_id  uuid not null references public.projects(id) on delete cascade,
  status      task_status not null default 'backlog',
  assignee_id uuid references public.users(id) on delete set null,
  priority    task_priority not null default 'medium',
  due_date    date,
  start_date  date,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_assignee_id_idx on public.tasks(assignee_id);

-- ─── TASK LABELS ─────────────────────────────────────────────────────────────

create table public.task_labels (
  id       uuid primary key default uuid_generate_v4(),
  task_id  uuid not null references public.tasks(id) on delete cascade,
  label    text not null,
  color    text not null default '#6366f1'
);

-- ─── ACTIVITIES ──────────────────────────────────────────────────────────────

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

-- ─── HELPER FUNCTIONS (security definer — bypass RLS for membership checks) ──

create or replace function public.is_project_member(p_project_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_project_owner(p_project_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.contacts enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_labels enable row level security;
alter table public.activities enable row level security;

-- Users
create policy "Users are viewable by authenticated users"
  on public.users for select to authenticated using (true);

create policy "Users can update their own profile"
  on public.users for update to authenticated using (auth.uid() = id);

-- Clients
create policy "Authenticated users can read clients"
  on public.clients for select to authenticated using (true);

create policy "Authenticated users can manage clients"
  on public.clients for all to authenticated using (true) with check (true);

-- Contacts
create policy "Authenticated users can read contacts"
  on public.contacts for select to authenticated using (true);

create policy "Authenticated users can manage contacts"
  on public.contacts for all to authenticated using (true) with check (true);

-- Projects
create policy "Project members can view projects"
  on public.projects for select to authenticated
  using (public.is_project_member(id));

create policy "Authenticated users can create projects"
  on public.projects for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Project owners can update projects"
  on public.projects for update to authenticated
  using (public.is_project_owner(id));

create policy "Project owners can delete projects"
  on public.projects for delete to authenticated
  using (public.is_project_owner(id));

-- Project members
create policy "Project members can view membership"
  on public.project_members for select to authenticated
  using (public.is_project_member(project_id));

create policy "Project owners can manage members"
  on public.project_members for all to authenticated
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

-- Tasks
create policy "Project members can view tasks"
  on public.tasks for select to authenticated
  using (public.is_project_member(project_id));

create policy "Project members can manage tasks"
  on public.tasks for all to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

-- Task labels
create policy "Project members can manage task labels"
  on public.task_labels for all to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_labels.task_id and public.is_project_member(t.project_id)
  ))
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_labels.task_id and public.is_project_member(t.project_id)
  ));

-- Activities
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
