/*
 * -------------------------------------------------------
 * Section: Assemble Outputs
 * Output artifact for the Assemble step.
 * -------------------------------------------------------
 */

create table if not exists
  public.assemble_outputs (
    id uuid primary key default gen_random_uuid (),
    presentation_id uuid references public.presentations (id) on delete cascade not null unique,
    user_id uuid references auth.users (id) on delete cascade not null,
    account_id uuid references public.accounts (id) on delete cascade not null,
    presentation_type text not null check (
      presentation_type in ('general', 'sales', 'consulting', 'fundraising')
    ),
    situation text not null default '',
    complication text not null default '',
    question_type text not null check (
      question_type in (
        'strategy',
        'assessment',
        'implementation',
        'diagnostic',
        'alternatives',
        'postmortem'
      )
    ),
    argument_map jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now (),
    updated_at timestamptz not null default now ()
  );

comment on table public.assemble_outputs is 'Assemble step artifact (presentation framing + argument map).';

-- Revoke all on assemble_outputs table from authenticated and service_role
revoke all on public.assemble_outputs
from
  authenticated,
  service_role;

-- Open up access to assemble_outputs table for authenticated users and service_role
grant
select
,
  insert,
update,
delete on table public.assemble_outputs to authenticated,
service_role;

-- Indexes
create index if not exists ix_assemble_outputs_presentation_id on public.assemble_outputs (presentation_id);

create index if not exists ix_assemble_outputs_user_id on public.assemble_outputs (user_id);

create index if not exists ix_assemble_outputs_account_id on public.assemble_outputs (account_id);

-- Triggers
create trigger assemble_outputs_set_timestamps
before insert or update on public.assemble_outputs
for each row execute function public.trigger_set_timestamps();

-- Enable RLS
alter table public.assemble_outputs enable row level security;

-- RLS
-- SELECT(assemble_outputs): Users can read their own assemble outputs
create policy assemble_outputs_read on public.assemble_outputs for
select
  to authenticated using (
    auth.uid () = user_id
  );

-- INSERT(assemble_outputs): Users can create assemble outputs for themselves
create policy assemble_outputs_insert on public.assemble_outputs for insert
  to authenticated
  with check (
    auth.uid () = user_id
  );

-- UPDATE(assemble_outputs): Users can update their own assemble outputs
create policy assemble_outputs_update on public.assemble_outputs for
update
  to authenticated using (
    auth.uid () = user_id
  )
  with check (
    auth.uid () = user_id
  );

-- DELETE(assemble_outputs): Users can delete their own assemble outputs
create policy assemble_outputs_delete on public.assemble_outputs for delete
  to authenticated using (
    auth.uid () = user_id
  );
