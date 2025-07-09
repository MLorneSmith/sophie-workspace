-- Create certificates bucket
insert into
  storage.buckets (id, name, PUBLIC)
values
  ('certificates', 'certificates', true);

-- Add appropriate storage policies
create policy "Anyone can read certificates"
  on storage.objects for select
  using (bucket_id = 'certificates');

create policy "Authenticated users can upload certificates"
  on storage.objects for insert
  with check (bucket_id = 'certificates' and auth.role() = 'authenticated');
