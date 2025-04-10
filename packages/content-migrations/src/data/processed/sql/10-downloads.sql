-- Seed file for downloads with predefined IDs
-- Generated based on the download-id-map.ts

-- Insert downloads with predefined IDs
INSERT INTO payload.downloads (id, title, description, type, created_at, updated_at)
VALUES
  ('9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1', 'Slide Templates', 'PowerPoint slide templates for presentations', 'pptx_template', NOW(), NOW()),
  ('c4f87e56-91a2-4bf3-8a45-d9e8c3b71208', 'Presentation Checklist', 'Checklist for preparing presentations', 'reference', NOW(), NOW()),
  ('a23d87f1-6e54-4c7b-9f12-d8e56c2a1b45', 'Storyboard Template', 'Template for creating presentation storyboards', 'worksheet', NOW(), NOW()),
  ('d7e389a2-5f10-4b8c-9a21-3e78f9c61d28', 'Our Process Slides', 'Slides for the "Our Process" lesson', 'pptx_template', NOW(), NOW()),
  ('e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456', 'The Who Slides', 'Slides for "The Who" lesson', 'pptx_template', NOW(), NOW()),
  ('a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593', 'Introduction Slides', 'Slides for the Introduction lesson', 'pptx_template', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  updated_at = NOW();

-- Link downloads to lessons (examples)
-- "Our Process" lesson with download
INSERT INTO payload.course_lessons_downloads (id, course_lessons_id, downloads_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  cl.id,
  'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28'::uuid,
  NOW(),
  NOW()
FROM payload.course_lessons cl
WHERE cl.title = 'Our Process'
ON CONFLICT (course_lessons_id, downloads_id) DO NOTHING;

-- "The Who" lesson with download
INSERT INTO payload.course_lessons_downloads (id, course_lessons_id, downloads_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  cl.id,
  'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456'::uuid,
  NOW(),
  NOW()
FROM payload.course_lessons cl
WHERE cl.title = 'The Who'
ON CONFLICT (course_lessons_id, downloads_id) DO NOTHING;

-- "The Why: Building the Introduction" lesson with download
INSERT INTO payload.course_lessons_downloads (id, course_lessons_id, downloads_id, created_at, updated_at)
SELECT
  gen_random_uuid(),
  cl.id,
  'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593'::uuid,
  NOW(),
  NOW()
FROM payload.course_lessons cl
WHERE cl.title = 'The Why: Building the Introduction'
ON CONFLICT (course_lessons_id, downloads_id) DO NOTHING;
