create table if not exists public.building_blocks_submissions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id),
    title varchar not null,
    audience text,
    presentation_type varchar,
    question_type varchar,
    situation text,
    complication text,
    answer text,
    outline text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table public.building_blocks_submissions enable row level security;

-- Create policies
create policy "Users can view their own building blocks submissions"
    on public.building_blocks_submissions for select
    using (auth.uid() = user_id);

create policy "Users can create their own building blocks submissions"
    on public.building_blocks_submissions for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own building blocks submissions"
    on public.building_blocks_submissions for update
    using (auth.uid() = user_id);

create policy "Users can delete their own building blocks submissions"
    on public.building_blocks_submissions for delete
    using (auth.uid() = user_id);
