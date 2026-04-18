-- ============================================================
-- Phase 1: Client enrichment + timestamp trigger helper
-- ============================================================

-- Generic updated_at trigger (reusable across tables)
create or replace function public.trigger_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── CLIENTS: new columns ────────────────────────────────────────────────────

alter table public.clients
  add column if not exists website       text,
  add column if not exists phone         text,
  add column if not exists address       text,
  add column if not exists industry      text,
  add column if not exists company_size  text,
  add column if not exists notes         text,
  add column if not exists tags          text[] not null default '{}',
  add column if not exists updated_at    timestamptz not null default now();

create index if not exists clients_tags_idx on public.clients using gin (tags);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
  before update on public.clients
  for each row execute procedure public.trigger_set_timestamp();
