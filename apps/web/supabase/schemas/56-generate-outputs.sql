/*
 * -------------------------------------------------------
 * Section: Generate Outputs
 * Output artifact for the Generate step.
 * -------------------------------------------------------
 */

create table if not exists
  public.generate_outputs (
    id uuid primary key default gen_random_uuid (),
    presentation_id uuid references public.presentations (id) on delete cascade not null unique,
    user_id uuid references auth.users (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    template_id text not null,
    export_format text check (export_format in ('pptx', 'pdf')),
    export_url text,
    generated_at timestamptz,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
  );

comment on table public.generate_outputs is 'Generate step artifact (template selection + export metadata).';

-- Revoke all on generate_outputs table from authenticated and service_role
revoke all on public.generate_outputs
from
  authenticated,
  service_role;

-- Open up access to generate_outputs table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.generate_outputs to authenticated,
service_role;

-- Indexes
create index if not exists ix_generate_outputs_presentation_id on public.generate_outputs (presentation_id);

create index if not exists ix_generate_outputs_user_id on public.generate_outputs (user_id);

create index if not exists ix_generate_outputs_account_id on public.generate_outputs (account_id);

-- Triggers
create trigger generate_outputs_set_timestamps
before insert or update on public.generate_outputs
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.generate_outputs enable row level security;

-- RLS
-- SELECT(generate_outputs): Users can read their own generate outputs
create policy generate_outputs_read on public.generate_outputs for
select
  to authenticated using (
    auth.uid () = user_id
  );

-- INSERT(generate_outputs): Users can create generate outputs for themselves
create policy generate_outputs_insert on public.generate_outputs for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- UPDATE(generate_outputs): Users can update their own generate outputs
create policy generate_outputs_update on public.generate_outputs for
update
  to authenticated using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- DELETE(generate_outputs): Users can delete their own generate outputs
create policy generate_outputs_delete on public.generate_outputs for delete
  to authenticated using (
    auth.uid () = user_id
  );
