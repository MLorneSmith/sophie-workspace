create type public.testimonial_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.testimonials (
    id uuid default gen_random_uuid() primary key,
    customer_name varchar(255) not null,
    customer_company_name varchar(255),
    customer_avatar_url varchar(255),
    content varchar(5000) not null,
    link varchar(2048),
    video_url varchar(2048),
    source varchar(255) not null default 'manual',
    rating integer not null check (rating >= 1 and rating <= 5),
    status public.testimonial_status default 'pending' not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    constraint valid_link check (link ~ '^https?://.*$'),
    constraint valid_video_url check (video_url ~ '^https?://.*$')
);

-- add indexes
create index idx_testimonials_status on public.testimonials(status);
create index idx_testimonials_source on public.testimonials(rating);

-- Grant select to anon role for public access
grant usage on schema public to anon, authenticated;
grant select on public.testimonials to anon, authenticated;
grant select, delete, update on public.testimonials to service_role;

-- Enable RLS
alter table public.testimonials enable row level security;

-- Add RLS policy for reading approved testimonials
create policy "Anyone can read approved testimonials"
    on public.testimonials
    for select
    to anon, authenticated
    using (status = 'approved');

-- Storage
insert into
  storage.buckets (id, name, PUBLIC)
values
  ('testimonials', 'testimonials', true);
