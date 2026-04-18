-- ============================================================
-- Phase 5: Task detail — subtasks, comments, attachments, events
-- ============================================================

-- ─── SUBTASKS: parent_task_id on tasks ───────────────────────────────────────

alter table public.tasks
  add column parent_task_id uuid references public.tasks(id) on delete cascade;

create index tasks_parent_task_id_idx on public.tasks(parent_task_id);

-- ─── COMMENTS ────────────────────────────────────────────────────────────────

create table public.task_comments (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  author_id   uuid not null references public.users(id) on delete restrict,
  body        text not null,
  edited_at   timestamptz,
  created_at  timestamptz not null default now()
);

create index task_comments_task_id_idx on public.task_comments(task_id, created_at);

-- ─── ATTACHMENTS ─────────────────────────────────────────────────────────────

create table public.task_attachments (
  id            uuid primary key default uuid_generate_v4(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  uploaded_by   uuid not null references public.users(id) on delete restrict,
  storage_path  text not null unique,
  filename      text not null,
  size_bytes    bigint not null,
  mime_type     text,
  created_at    timestamptz not null default now()
);

create index task_attachments_task_id_idx on public.task_attachments(task_id, created_at);

-- ─── EVENTS (audit log) ──────────────────────────────────────────────────────

create type task_event_kind as enum (
  'created',
  'status_changed',
  'assignee_changed',
  'priority_changed',
  'due_date_changed',
  'title_changed'
);

create table public.task_events (
  id          uuid primary key default uuid_generate_v4(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  actor_id    uuid references public.users(id) on delete set null,
  kind        task_event_kind not null,
  from_value  text,
  to_value    text,
  created_at  timestamptz not null default now()
);

create index task_events_task_id_idx on public.task_events(task_id, created_at);

-- ─── TRIGGER: log events on task change ──────────────────────────────────────

create or replace function public.log_task_events()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if (tg_op = 'INSERT') then
    insert into public.task_events (task_id, actor_id, kind, from_value, to_value)
    values (new.id, actor, 'created', null, new.title);
    return new;
  end if;

  if (tg_op = 'UPDATE') then
    if new.status is distinct from old.status then
      insert into public.task_events (task_id, actor_id, kind, from_value, to_value)
      values (new.id, actor, 'status_changed', old.status::text, new.status::text);
    end if;
    if new.assignee_id is distinct from old.assignee_id then
      insert into public.task_events (task_id, actor_id, kind, from_value, to_value)
      values (new.id, actor, 'assignee_changed', old.assignee_id::text, new.assignee_id::text);
    end if;
    if new.priority is distinct from old.priority then
      insert into public.task_events (task_id, actor_id, kind, from_value, to_value)
      values (new.id, actor, 'priority_changed', old.priority::text, new.priority::text);
    end if;
    if new.due_date is distinct from old.due_date then
      insert into public.task_events (task_id, actor_id, kind, from_value, to_value)
      values (new.id, actor, 'due_date_changed', old.due_date::text, new.due_date::text);
    end if;
    if new.title is distinct from old.title then
      insert into public.task_events (task_id, actor_id, kind, from_value, to_value)
      values (new.id, actor, 'title_changed', old.title, new.title);
    end if;
    return new;
  end if;

  return null;
end;
$$;

create trigger on_task_change
  after insert or update on public.tasks
  for each row execute procedure public.log_task_events();

-- Backfill 'created' events for existing tasks so timelines aren't empty
insert into public.task_events (task_id, actor_id, kind, to_value, created_at)
select id, null, 'created', title, created_at from public.tasks;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_events enable row level security;

-- Comments
create policy "Project members can view task comments"
  on public.task_comments for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_comments.task_id and public.is_project_member(t.project_id)
  ));

create policy "Project members can insert task comments"
  on public.task_comments for insert to authenticated
  with check (
    auth.uid() = author_id and exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id and public.is_project_member(t.project_id)
    )
  );

create policy "Authors can update their task comments"
  on public.task_comments for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "Authors can delete their task comments"
  on public.task_comments for delete to authenticated
  using (auth.uid() = author_id);

-- Attachments
create policy "Project members can view task attachments"
  on public.task_attachments for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_attachments.task_id and public.is_project_member(t.project_id)
  ));

create policy "Project members can insert task attachments"
  on public.task_attachments for insert to authenticated
  with check (
    auth.uid() = uploaded_by and exists (
      select 1 from public.tasks t
      where t.id = task_attachments.task_id and public.is_project_member(t.project_id)
    )
  );

create policy "Uploaders can delete their attachments"
  on public.task_attachments for delete to authenticated
  using (auth.uid() = uploaded_by);

-- Events: read-only; writes come from the trigger (security definer bypasses RLS)
create policy "Project members can view task events"
  on public.task_events for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_events.task_id and public.is_project_member(t.project_id)
  ));

-- ─── STORAGE BUCKET ──────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

-- Simple policies: any authenticated user can read/write within the bucket;
-- DB-level task_attachments RLS controls visibility of metadata.
-- Storage paths are UUID-based so they're unguessable.
create policy "Authenticated can read task-attachments objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'task-attachments');

create policy "Authenticated can upload task-attachments objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'task-attachments');

create policy "Uploaders can delete their task-attachments objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'task-attachments' and auth.uid() = owner);
