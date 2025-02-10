create type public.testimonial_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.testimonials (
    id uuid default uuid_generate_v4() primary key,
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
    constraint valid_video_url check (video_url ~ '^https?://.*$'),
    constraint customer_avatar_url check (customer_avatar_url ~ '^https?://.*$')
);

-- add indexes
create index idx_testimonials_status on public.testimonials(status);
create index idx_testimonials_source on public.testimonials(rating);

revoke all on public.testimonials from public;

grant select on public.testimonials to authenticated;
grant select, delete, update on public.testimonials to service_role;

-- Enable RLS
alter table public.testimonials enable row level security;

-- Storage
insert into
  storage.buckets (id, name, PUBLIC)
values
  ('testimonials', 'testimonials', true);