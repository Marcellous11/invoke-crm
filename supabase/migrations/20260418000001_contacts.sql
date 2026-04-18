-- ============================================================
-- Phase 2: Contacts as first-class entity
-- ============================================================

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

-- At most one primary contact per client (partial unique index)
create unique index contacts_one_primary_per_client
  on public.contacts(client_id) where is_primary;

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.trigger_set_timestamp();

alter table public.contacts enable row level security;

-- Mirror clients RLS: any authenticated user can read/manage.
-- (Revisit in Phase 3 if we add per-client access control.)
create policy "Authenticated users can read contacts"
  on public.contacts for select to authenticated using (true);

create policy "Authenticated users can manage contacts"
  on public.contacts for all to authenticated using (true) with check (true);

-- ─── BACKFILL inline contact fields into contacts ────────────────────────────

insert into public.contacts (client_id, full_name, email, is_primary)
select id, coalesce(contact_name, contact_email), contact_email, true
from public.clients
where contact_name is not null or contact_email is not null;

-- ─── DROP legacy inline fields ───────────────────────────────────────────────

alter table public.clients
  drop column if exists contact_name,
  drop column if exists contact_email;
