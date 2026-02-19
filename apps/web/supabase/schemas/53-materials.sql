/*
 * -------------------------------------------------------
 * Section: Materials
 * Uploaded/attached materials for a presentation.
 * -------------------------------------------------------
 */

create table if not exists
  public.materials (
    id uuid primary key default gen_random_uuid (),
    presentation_id uuid references public.presentations (id) on delete cascade not null,
    user_id uuid references auth.users (id) on delete cascade not null,
    type text not null check (type in ('upload', 'braindump', 'link')),
    name text not null,
    content text,
    mime_type text,
    file_url text,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
  );

comment on table public.materials is 'Uploaded/attached materials for a presentation.';

-- Revoke all on materials table from authenticated and service_role
revoke all on public.materials
from
  authenticated,
  service_role;

-- Open up access to materials table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.materials to authenticated,
service_role;

-- Indexes
create index if not exists ix_materials_presentation_id on public.materials (presentation_id);

create index if not exists ix_materials_user_id on public.materials (user_id);

-- Triggers
create trigger materials_set_timestamps
before insert or update on public.materials
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.materials enable row level security;

-- RLS
-- SELECT(materials): Users can read their own materials
create policy materials_read on public.materials for
select
  to authenticated using (
    auth.uid () = user_id
  );

-- INSERT(materials): Users can create materials for themselves
create policy materials_insert on public.materials for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- UPDATE(materials): Users can update their own materials
create policy materials_update on public.materials for
update
  to authenticated using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- DELETE(materials): Users can delete their own materials
create policy materials_delete on public.materials for delete
  to authenticated using (
    auth.uid () = user_id
  );
