-- ============================================================
-- Phase 4: Deals / sales pipeline
-- ============================================================

create type deal_stage as enum ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost');

create table public.deals (
  id                   uuid primary key default uuid_generate_v4(),
  client_id            uuid not null references public.clients(id) on delete cascade,
  primary_contact_id   uuid references public.contacts(id) on delete set null,
  title                text not null,
  description          text,
  stage                deal_stage not null default 'lead',
  value_cents          bigint,
  currency             text not null default 'USD',
  probability          int check (probability is null or (probability between 0 and 100)),
  expected_close_date  date,
  owner_id             uuid references public.users(id) on delete set null,
  project_id           uuid references public.projects(id) on delete set null,
  lost_reason          text,
  position             integer not null default 0,
  created_by           uuid not null references public.users(id) on delete restrict,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index deals_client_id_idx on public.deals(client_id);
create index deals_stage_pos_idx on public.deals(stage, position);

create trigger set_deals_updated_at
  before update on public.deals
  for each row execute procedure public.trigger_set_timestamp();

alter table public.deals enable row level security;

create policy "Authenticated users can read deals"
  on public.deals for select to authenticated using (true);

create policy "Authenticated users can insert deals"
  on public.deals for insert to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update deals"
  on public.deals for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete deals"
  on public.deals for delete to authenticated using (true);
