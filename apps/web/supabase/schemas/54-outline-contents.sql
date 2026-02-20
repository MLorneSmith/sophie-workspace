/*
 * -------------------------------------------------------
 * Section: Outline Contents
 * Output artifact for the Outline step.
 * -------------------------------------------------------
 */

create table if not exists
  public.outline_contents (
    id uuid primary key default gen_random_uuid (),
    presentation_id uuid references public.presentations (id) on delete cascade not null unique,
    user_id uuid references auth.users (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    sections jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
  );

comment on table public.outline_contents is 'Outline step artifact (sections array).';

-- Revoke all on outline_contents table from authenticated and service_role
revoke all on public.outline_contents
from
  authenticated,
  service_role;

-- Open up access to outline_contents table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.outline_contents to authenticated,
service_role;

-- Indexes
create index if not exists ix_outline_contents_presentation_id on public.outline_contents (presentation_id);

create index if not exists ix_outline_contents_user_id on public.outline_contents (user_id);

create index if not exists ix_outline_contents_account_id on public.outline_contents (account_id);

-- Triggers
create trigger outline_contents_set_timestamps
before insert or update on public.outline_contents
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.outline_contents enable row level security;

-- RLS
-- SELECT(outline_contents): Users can read their own outline contents
create policy outline_contents_read on public.outline_contents for
select
  to authenticated using (
    auth.uid () = user_id
  );

-- INSERT(outline_contents): Users can create outline contents for themselves
create policy outline_contents_insert on public.outline_contents for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- UPDATE(outline_contents): Users can update their own outline contents
create policy outline_contents_update on public.outline_contents for
update
  to authenticated using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- DELETE(outline_contents): Users can delete their own outline contents
create policy outline_contents_delete on public.outline_contents for delete
  to authenticated using (
    auth.uid () = user_id
  );
