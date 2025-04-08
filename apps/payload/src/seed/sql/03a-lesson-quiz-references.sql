-- Add quiz references to lessons after both lessons and quizzes have been created
-- This file should be run after both lessons and quizzes seed files

-- Start a transaction
BEGIN;

-- Update the Standard Graphs lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = 'c11dbb26-7561-4d12-88c8-141c653a43fd',
  quiz_id_id = 'c11dbb26-7561-4d12-88c8-141c653a43fd'
WHERE 
  slug = 'basic-graphs';

-- Create relationship entry for the lesson to the quiz if it doesn't exist
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
  id,
  'quiz_id',
  'c11dbb26-7561-4d12-88c8-141c653a43fd',
  NOW(),
  NOW()
FROM 
  payload.course_lessons
WHERE 
  slug = 'basic-graphs'
  AND NOT EXISTS (
    SELECT 1 FROM payload.course_lessons_rels 
    WHERE _parent_id = payload.course_lessons.id 
    AND field = 'quiz_id' 
    AND value = 'c11dbb26-7561-4d12-88c8-141c653a43fd'
  );

-- Update the Tables vs. Graphs lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = 'f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f',
  quiz_id_id = 'f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f'
WHERE 
  slug = 'tables-vs-graphs';

-- Create relationship entry for the lesson to the quiz if it doesn't exist
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
  id,
  'quiz_id',
  'f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f',
  NOW(),
  NOW()
FROM 
  payload.course_lessons
WHERE 
  slug = 'tables-vs-graphs'
  AND NOT EXISTS (
    SELECT 1 FROM payload.course_lessons_rels 
    WHERE _parent_id = payload.course_lessons.id 
    AND field = 'quiz_id' 
    AND value = 'f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f'
  );

-- Update the The Why: Building the Introduction lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = 'b75e29c7-1d9f-4f41-8c91-a72847d13747',
  quiz_id_id = 'b75e29c7-1d9f-4f41-8c91-a72847d13747'
WHERE 
  slug = 'the-why-introductions';

-- Create relationship entry for the lesson to the quiz if it doesn't exist
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
  id,
  'quiz_id',
  'b75e29c7-1d9f-4f41-8c91-a72847d13747',
  NOW(),
  NOW()
FROM 
  payload.course_lessons
WHERE 
  slug = 'the-why-introductions'
  AND NOT EXISTS (
    SELECT 1 FROM payload.course_lessons_rels 
    WHERE _parent_id = payload.course_lessons.id 
    AND field = 'quiz_id' 
    AND value = 'b75e29c7-1d9f-4f41-8c91-a72847d13747'
  );

-- Update the The Why: Next Steps lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = 'e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3',
  quiz_id_id = 'e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3'
WHERE 
  slug = 'the-why-next-steps';

-- Create relationship entry for the lesson to the quiz if it doesn't exist
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
  id,
  'quiz_id',
  'e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3',
  NOW(),
  NOW()
FROM 
  payload.course_lessons
WHERE 
  slug = 'the-why-next-steps'
  AND NOT EXISTS (
    SELECT 1 FROM payload.course_lessons_rels 
    WHERE _parent_id = payload.course_lessons.id 
    AND field = 'quiz_id' 
    AND value = 'e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3'
  );

-- Update the Preparation and Practice lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = 'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4',
  quiz_id_id = 'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4'
WHERE 
  slug = 'preparation-practice';

-- Create relationship entry for the lesson to the quiz if it doesn't exist
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
  id,
  'quiz_id',
  'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4',
  NOW(),
  NOW()
FROM 
  payload.course_lessons
WHERE 
  slug = 'preparation-practice'
  AND NOT EXISTS (
    SELECT 1 FROM payload.course_lessons_rels 
    WHERE _parent_id = payload.course_lessons.id 
    AND field = 'quiz_id' 
    AND value = 'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4'
  );

-- Update all lessons to set estimated_duration from lessonLength if it's 0
UPDATE payload.course_lessons
SET estimated_duration = lesson_number
WHERE estimated_duration = 0 OR estimated_duration IS NULL;

-- Commit the transaction
COMMIT;
