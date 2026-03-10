/*
 * -------------------------------------------------------
 * Section: Saved Profiles
 * Library profiles as snapshots that can be reused across presentations.
 * Stored separately from presentation-bound audience_profiles.
 * -------------------------------------------------------
 */

create table if not exists
  public.saved_profiles (
    id uuid primary key default gen_random_uuid (),
    user_id uuid references auth.users (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    -- User-defined name for the saved profile
    name text not null,
    -- Original research inputs
    person_name text not null,
    company text,
    linkedin_url text,
    -- Snapshot of audience data (brief_structured from audience_profiles)
    audience_data jsonb not null default '{}'::jsonb,
    -- Snapshot of company brief (enrichment_data from audience_profiles)
    company_brief jsonb not null default '{}'::jsonb,
    -- Stores context/selectedLinkedinUrl for refresh capability
    enrichment_inputs jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now (),
    -- Tracks when profile was last used to create a presentation
    last_used_at timestamptz null,
    -- Tracks data age - updated when profile is refreshed
    last_refreshed_at timestamptz null
  );

comment on table public.saved_profiles is 'Library profiles as snapshots that can be reused across presentations.';

-- Revoke all on saved_profiles table from authenticated and service_role
revoke all on public.saved_profiles
from
  authenticated,
  service_role;

-- Open up access to saved_profiles table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.saved_profiles to authenticated,
service_role;

-- Indexes
create index if not exists ix_saved_profiles_user_id on public.saved_profiles (user_id);

create index if not exists ix_saved_profiles_account_id on public.saved_profiles (account_id);

-- Triggers
create trigger saved_profiles_set_timestamps
before insert or update on public.saved_profiles
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.saved_profiles enable row level security;

-- RLS
-- SELECT(saved_profiles): Users can read their own saved profiles
create policy saved_profiles_read on public.saved_profiles for
select
  to authenticated using (
    user_id = (select auth.uid())
  );

-- INSERT(saved_profiles): Users can create saved profiles for themselves
create policy saved_profiles_insert on public.saved_profiles for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
  );

-- UPDATE(saved_profiles): Users can update their own saved profiles
create policy saved_profiles_update on public.saved_profiles for
update
  to authenticated using (
    user_id = (select auth.uid())
  )
  with check (
    user_id = (select auth.uid())
  );

-- DELETE(saved_profiles): Users can delete their own saved profiles
create policy saved_profiles_delete on public.saved_profiles for delete
  to authenticated using (
    user_id = (select auth.uid())
  );
