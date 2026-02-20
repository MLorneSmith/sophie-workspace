-- Company briefs cache for audience profiling research
-- Stores synthesized company research to avoid re-researching the same company

create table if not exists public.company_briefs (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  company_domain text,
  netrows_data jsonb,
  web_research jsonb,
  brief_structured jsonb,
  researched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for lookup by company name
create index if not exists idx_company_briefs_company_name
  on public.company_briefs (lower(company_name));

-- Index for freshness check
create index if not exists idx_company_briefs_expires_at
  on public.company_briefs (expires_at);

-- RLS
alter table public.company_briefs enable row level security;

-- Users can read company briefs they created
create policy "Users can read own company briefs"
  on public.company_briefs for select
  using (auth.uid() = created_by);

-- Users can insert company briefs
create policy "Users can insert company briefs"
  on public.company_briefs for insert
  with check (auth.uid() = created_by);

-- Users can update their own company briefs
create policy "Users can update own company briefs"
  on public.company_briefs for update
  using (auth.uid() = created_by);
