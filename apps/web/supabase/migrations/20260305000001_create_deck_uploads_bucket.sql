-- Create deck_uploads bucket for presentation deck files
-- Stores uploaded PPTX/PDF files for AI processing

insert into
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'deck_uploads',
    'deck_uploads',
    false,
    52428800,
    ARRAY [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf'
    ]
  )
on conflict (id) do nothing;

-- Storage policies

-- Allow authenticated users to upload deck files
-- Path convention: {userId}/{presentationId}/{uuid}.{ext}
create policy "Authenticated users can upload deck files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'deck_uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to read their own deck files
create policy "Users can read their own deck files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'deck_uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own deck files
create policy "Users can delete their own deck files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'deck_uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
