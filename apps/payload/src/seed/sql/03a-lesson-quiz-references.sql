-- Add quiz references to lessons after both lessons and quizzes have been created
-- This file should be run after both lessons and quizzes seed files

-- Start a transaction
BEGIN;

-- Update the Standard Graphs lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = 'bdecdb2b-a734-4872-a606-7f61d6fbe2e2',
  quiz_id_id = 'bdecdb2b-a734-4872-a606-7f61d6fbe2e2'
WHERE 
  slug = 'basic-graphs'
  AND quiz_id = '0c8004e3-7591-453f-ac8a-97e1c1e327db';

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
  'bdecdb2b-a734-4872-a606-7f61d6fbe2e2',
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
    AND value = 'bdecdb2b-a734-4872-a606-7f61d6fbe2e2'
  );

-- Update the Tables vs. Graphs lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = '44519696-f2b3-4c63-b8d1-7dc282cac423',
  quiz_id_id = '44519696-f2b3-4c63-b8d1-7dc282cac423'
WHERE 
  slug = 'tables-vs-graphs'
  AND (quiz_id IS NULL OR quiz_id = '7ec7d42e-f6cf-4806-b1d8-4957035ca1c8');

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
  '44519696-f2b3-4c63-b8d1-7dc282cac423',
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
    AND value = '44519696-f2b3-4c63-b8d1-7dc282cac423'
  );

-- Update the The Why: Building the Introduction lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = '54d3a05c-05db-448f-aeb9-3373d0095693',
  quiz_id_id = '54d3a05c-05db-448f-aeb9-3373d0095693'
WHERE 
  slug = 'the-why-introductions'
  AND (quiz_id IS NULL OR quiz_id = '12cbd62c-ea8e-44a1-80f3-8f67303595db');

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
  '54d3a05c-05db-448f-aeb9-3373d0095693',
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
    AND value = '54d3a05c-05db-448f-aeb9-3373d0095693'
  );

-- Update the The Why: Next Steps lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = 'd6ab211f-1c80-4c9b-a482-5f7fb465707e',
  quiz_id_id = 'd6ab211f-1c80-4c9b-a482-5f7fb465707e'
WHERE 
  slug = 'the-why-next-steps'
  AND (quiz_id IS NULL OR quiz_id = 'aee35255-1aea-4401-a47b-a4a0e87eb0b3');

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
  'd6ab211f-1c80-4c9b-a482-5f7fb465707e',
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
    AND value = 'd6ab211f-1c80-4c9b-a482-5f7fb465707e'
  );

-- Update the Preparation and Practice lesson to reference the correct quiz
UPDATE payload.course_lessons
SET 
  quiz_id = '10492f85-3157-479c-a9af-c189f6113973',
  quiz_id_id = '10492f85-3157-479c-a9af-c189f6113973'
WHERE 
  slug = 'preparation-practice'
  AND (quiz_id IS NULL OR quiz_id = '8dffe59e-809e-4764-9909-d1e224566f4c');

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
  '10492f85-3157-479c-a9af-c189f6113973',
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
    AND value = '10492f85-3157-479c-a9af-c189f6113973'
  );

-- Update all lessons to set estimated_duration from lessonLength if it's 0
UPDATE payload.course_lessons
SET estimated_duration = lesson_number
WHERE estimated_duration = 0 OR estimated_duration IS NULL;

-- Commit the transaction
COMMIT;
