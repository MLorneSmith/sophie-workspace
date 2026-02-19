/*
 * -------------------------------------------------------
 * Section: Audience Profiles
 * Saved audience profiles ("Audience Brief" artifact) that can be reused
 * across presentations.
 * -------------------------------------------------------
 */

create table if not exists
  public.audience_profiles (
    id uuid primary key default gen_random_uuid (),
    user_id uuid references auth.users (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    -- Nullable: profiles can be reused across multiple presentations.
    presentation_id uuid null,
    person_name text not null,
    company text,
    title text,
    linkedin_url text,
    enrichment_data jsonb not null default '{}'::jsonb,
    adaptive_answers jsonb not null default '[]'::jsonb,
    -- Generated editable brief (markdown / rich text string).
    brief_text text,
    -- Structured internal representation used for downstream context injection.
    brief_structured jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
  );

comment on table public.audience_profiles is 'Saved audience profiles (Audience Brief) that can be reused across presentations.';

-- Revoke all on audience_profiles table from authenticated and service_role
revoke all on public.audience_profiles
from
  authenticated,
  service_role;

-- Open up access to audience_profiles table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.audience_profiles to authenticated,
service_role;

-- Indexes
create index if not exists ix_audience_profiles_user_id on public.audience_profiles (user_id);

create index if not exists ix_audience_profiles_account_id on public.audience_profiles (account_id);

create index if not exists ix_audience_profiles_presentation_id on public.audience_profiles (presentation_id);

-- Triggers
create trigger audience_profiles_set_timestamps
before insert or update on public.audience_profiles
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.audience_profiles enable row level security;

-- RLS
-- SELECT(audience_profiles): Users can read their own profiles
create policy audience_profiles_read on public.audience_profiles for
select
  to authenticated using (
    auth.uid () = user_id
  );

-- INSERT(audience_profiles): Users can create profiles for themselves
create policy audience_profiles_insert on public.audience_profiles for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- UPDATE(audience_profiles): Users can update their own profiles
create policy audience_profiles_update on public.audience_profiles for
update
  to authenticated using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- DELETE(audience_profiles): Users can delete their own profiles
create policy audience_profiles_delete on public.audience_profiles for delete
  to authenticated using (
    auth.uid () = user_id
  );
