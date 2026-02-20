/*
 * -------------------------------------------------------
 * Section: Storyboard Contents
 * Output artifact for the Storyboard step.
 * -------------------------------------------------------
 */

create table if not exists
  public.storyboard_contents (
    id uuid primary key default gen_random_uuid (),
    presentation_id uuid references public.presentations (id) on delete cascade not null unique,
    user_id uuid references auth.users (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    slides jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
  );

comment on table public.storyboard_contents is 'Storyboard step artifact (slides array).';

-- Revoke all on storyboard_contents table from authenticated and service_role
revoke all on public.storyboard_contents
from
  authenticated,
  service_role;

-- Open up access to storyboard_contents table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.storyboard_contents to authenticated,
service_role;

-- Indexes
create index if not exists ix_storyboard_contents_presentation_id on public.storyboard_contents (presentation_id);

create index if not exists ix_storyboard_contents_user_id on public.storyboard_contents (user_id);

create index if not exists ix_storyboard_contents_account_id on public.storyboard_contents (account_id);

-- Triggers
create trigger storyboard_contents_set_timestamps
before insert or update on public.storyboard_contents
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.storyboard_contents enable row level security;

-- RLS
-- SELECT(storyboard_contents): Users can read their own storyboard contents
create policy storyboard_contents_read on public.storyboard_contents for
select
  to authenticated using (
    auth.uid () = user_id
  );

-- INSERT(storyboard_contents): Users can create storyboard contents for themselves
create policy storyboard_contents_insert on public.storyboard_contents for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- UPDATE(storyboard_contents): Users can update their own storyboard contents
create policy storyboard_contents_update on public.storyboard_contents for
update
  to authenticated using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- DELETE(storyboard_contents): Users can delete their own storyboard contents
create policy storyboard_contents_delete on public.storyboard_contents for delete
  to authenticated using (
    auth.uid () = user_id
  );
