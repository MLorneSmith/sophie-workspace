-- Migration: ticker_mappings table for company name -> ticker/CIK resolution
-- Purpose: Cache resolved company name to stock ticker and CIK mappings with 30-day TTL

-- Create the ticker_mappings table
create table if not exists
  public.ticker_mappings (
    id uuid primary key default gen_random_uuid (),
    company_name text not null,
    ticker text not null,
    cik text not null,
    confidence_score numeric not null default 0,
    user_id uuid references auth.users (id) on delete cascade not null,
    resolved_at timestamptz not null default now (),
    expires_at timestamptz not null default (now() + interval '30 days')
  );

comment on table public.ticker_mappings is 'Cached company name to ticker/CIK mappings for financial data enrichment';

-- Revoke all on ticker_mappings table from authenticated and service_role
revoke all on public.ticker_mappings
from
  authenticated,
  service_role;

-- Grant access to authenticated users and service_role
grant
  select,
  insert,
  update,
  delete on table public.ticker_mappings to authenticated,
  service_role;

-- Indexes
create index if not exists ix_ticker_mappings_company_name_lower
  on public.ticker_mappings (lower(company_name));

create index if not exists ix_ticker_mappings_user_id
  on public.ticker_mappings (user_id);

create index if not exists ix_ticker_mappings_expires_at
  on public.ticker_mappings (expires_at);

-- Triggers
create trigger ticker_mappings_set_timestamps
  before insert or update on public.ticker_mappings
  for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.ticker_mappings enable row level security;

-- RLS: SELECT - Users can read their own mappings
create policy ticker_mappings_read on public.ticker_mappings
  for select
  to authenticated
  using (
    auth.uid () = user_id
  );

-- RLS: INSERT - Users can insert their own mappings
create policy ticker_mappings_insert on public.ticker_mappings
  for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- RLS: UPDATE - Users can update their own mappings
create policy ticker_mappings_update on public.ticker_mappings
  for update
  to authenticated
  using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- RLS: DELETE - Users can delete their own mappings
create policy ticker_mappings_delete on public.ticker_mappings
  for delete
  to authenticated
  using (
    auth.uid () = user_id
  );
