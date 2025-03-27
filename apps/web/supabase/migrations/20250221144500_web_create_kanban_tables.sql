-- Create task status enum
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status as enum ('do', 'doing', 'done');

-- Create tasks table
create table if not exists public.tasks (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    status public.task_status not null default 'do',
    priority public.task_priority not null default 'medium',
    image_url text,
    account_id uuid not null references auth.users(id),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create subtasks table
create table if not exists public.subtasks (
    id uuid default uuid_generate_v4() primary key,
    task_id uuid not null references public.tasks(id) on delete cascade,
    title text not null,
    is_completed boolean default false,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Add indexes
create index idx_tasks_account_id on public.tasks(account_id);
create index idx_tasks_status on public.tasks(status);
create index idx_subtasks_task_id on public.subtasks(task_id);

-- Grant access to authenticated users
grant usage on schema public to authenticated;
grant all on public.tasks to authenticated;
grant all on public.subtasks to authenticated;

-- Enable RLS
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;

-- RLS policies for tasks
create policy "Users can manage their own tasks"
    on public.tasks
    for all
    to authenticated
    using (account_id = auth.uid())
    with check (account_id = auth.uid());

-- RLS policies for subtasks
create policy "Users can manage subtasks of their tasks"
    on public.subtasks
    for all
    to authenticated
    using (
        exists (
            select 1 from public.tasks
            where tasks.id = subtasks.task_id
            and tasks.account_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.tasks
            where tasks.id = subtasks.task_id
            and tasks.account_id = auth.uid()
        )
    );

-- Add updated_at trigger function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger handle_tasks_updated_at
    before update on public.tasks
    for each row
    execute function public.handle_updated_at();

create trigger handle_subtasks_updated_at
    before update on public.subtasks
    for each row
    execute function public.handle_updated_at();
