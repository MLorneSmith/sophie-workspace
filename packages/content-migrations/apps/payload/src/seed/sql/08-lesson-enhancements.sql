-- Generated SQL for lesson enhancements
-- Generated at 2025-04-09T15:43:44.462Z

-- Start a transaction
BEGIN;

-- Process lesson: Our Process
UPDATE payload.course_lessons
SET 
  bunny_video_id = '70b1f616-8e55-4c58-8898-c5cefa05417b',
  bunny_library_id = '264486',
  todo_complete_quiz = TRUE,
  todo_watch_content = 'None',
  todo_read_content = 'None',
  todo_course_project = 'None'
WHERE slug = 'our-process';

-- Add downloads for lesson: Our Process
DO $$
DECLARE
  lesson_id UUID;
  download_id UUID := gen_random_uuid();
BEGIN
  SELECT id INTO lesson_id FROM payload.course_lessons WHERE slug = 'our-process' LIMIT 1;
  
  IF lesson_id IS NOT NULL THEN
    -- Insert download
    INSERT INTO payload.downloads (
      id,
      filename,
      url,
      description,
      lesson_id,
      created_at,
      updated_at
    ) VALUES (
      download_id,
      '201 Our Process.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf',
      'Our Process Slides',
      lesson_id,
      NOW(),
      NOW()
    );
    
    -- Create relationship
    INSERT INTO payload.course_lessons_downloads (
      id,
      lesson_id,
      download_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      lesson_id,
      download_id,
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Process lesson: The Who
UPDATE payload.course_lessons
SET 
  todo_complete_quiz = TRUE,
  todo_watch_content = 'Video on stakeholders',
  todo_read_content = 'Stakeholder analysis guide',
  todo_course_project = 'Create a stakeholder map'
WHERE slug = 'the-who';

-- Add downloads for lesson: The Who
DO $$
DECLARE
  lesson_id UUID;
  download_id UUID := gen_random_uuid();
BEGIN
  SELECT id INTO lesson_id FROM payload.course_lessons WHERE slug = 'the-who' LIMIT 1;
  
  IF lesson_id IS NOT NULL THEN
    -- Insert download
    INSERT INTO payload.downloads (
      id,
      filename,
      url,
      description,
      lesson_id,
      created_at,
      updated_at
    ) VALUES (
      download_id,
      '202 The Who.pdf',
      'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf',
      'The Who Slides',
      lesson_id,
      NOW(),
      NOW()
    );
    
    -- Create relationship
    INSERT INTO payload.course_lessons_downloads (
      id,
      lesson_id,
      download_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      lesson_id,
      download_id,
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Add course_lessons_rels entries for downloads (bidirectional relationship)
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  d.lesson_id,
  'downloads',
  d.id,
  NOW(),
  NOW()
FROM payload.downloads d
WHERE d.lesson_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_lessons_rels r
  WHERE r._parent_id = d.lesson_id
  AND r.field = 'downloads'
  AND r.value = d.id
);

-- Commit the transaction
COMMIT;