/*
 * -------------------------------------------------------
 * Section: Presentations
 * Top-level persistent entity for the presentation creation wizard.
 * -------------------------------------------------------
 */

create table if not exists
  public.presentations (
    id uuid primary key default gen_random_uuid (),
    user_id uuid references auth.users (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    title text not null default 'Untitled Presentation',
    current_step text not null default 'profile' check (
      current_step in (
        'profile',
        'assemble',
        'outline',
        'storyboard',
        'generate'
      )
    ),
    completed_steps text[] not null default '{}'::text[],
    template_id text,
    audience_profile_id uuid references public.audience_profiles (id) on delete set null,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
  );

comment on table public.presentations is 'Top-level presentation project that tracks wizard step progression.';

-- Revoke all on presentations table from authenticated and service_role
revoke all on public.presentations
from
  authenticated,
  service_role;

-- Open up access to presentations table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.presentations to authenticated,
service_role;

-- Indexes
create index if not exists ix_presentations_user_id on public.presentations (user_id);

create index if not exists ix_presentations_account_id on public.presentations (account_id);

create index if not exists ix_presentations_audience_profile_id on public.presentations (audience_profile_id);

-- Triggers
create trigger presentations_set_timestamps
before insert or update on public.presentations
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.presentations enable row level security;

-- RLS
-- SELECT(presentations): Users can read their own presentations
create policy presentations_read on public.presentations for
select
  to authenticated using (
    auth.uid () = user_id
  );

-- INSERT(presentations): Users can create presentations for themselves
create policy presentations_insert on public.presentations for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- UPDATE(presentations): Users can update their own presentations
create policy presentations_update on public.presentations for
update
  to authenticated using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- DELETE(presentations): Users can delete their own presentations
create policy presentations_delete on public.presentations for delete
  to authenticated using (
    auth.uid () = user_id
  );
