-- Direct Quiz Fix SQL Script
-- This script directly addresses issues with quiz relationships

-- 1. First update all course_quizzes to have the correct course_id_id
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'
WHERE course_id_id IS NULL;

-- 2. Make sure the relationships are updated in the rels table
-- First delete any existing incorrect relationships
DELETE FROM payload.course_quizzes_rels
WHERE field = 'course_id';

-- Then add the correct relationships
INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at, courses_id)
SELECT 
  gen_random_uuid() as id,
  cq.id as _parent_id,
  'course_id' as field,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8' as value,
  NOW() as created_at,
  NOW() as updated_at,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8' as courses_id
FROM payload.course_quizzes cq
WHERE NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel 
  WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
);

-- 3. Update the questions array in course_quizzes based on quiz_questions
-- First get all quiz questions
WITH quiz_questions_by_quiz AS (
  SELECT 
    quiz_id,
    ARRAY_AGG(id) as question_ids
  FROM payload.quiz_questions
  WHERE quiz_id IS NOT NULL
  GROUP BY quiz_id
)
-- Then update each quiz with its questions array
UPDATE payload.course_quizzes cq
SET questions = qq.question_ids
FROM quiz_questions_by_quiz qq
WHERE cq.id = qq.quiz_id;

-- 4. Make sure all question relationships are in the rels table
-- First delete any duplicates to clean up
DELETE FROM payload.course_quizzes_rels
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY _parent_id, field, value
      ORDER BY id
    ) as row_num
    FROM payload.course_quizzes_rels
    WHERE field = 'questions'
  ) as dup
  WHERE row_num > 1
);

-- Now ensure all quiz-question relationships exist in course_quizzes_rels
INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at, quiz_questions_id)
SELECT 
  gen_random_uuid() as id,
  qq.quiz_id as _parent_id,
  'questions' as field,
  qq.id as value,
  NOW() as created_at,
  NOW() as updated_at,
  qq.id as quiz_questions_id
FROM payload.quiz_questions qq
WHERE quiz_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = qq.quiz_id 
  AND rel.field = 'questions' 
  AND rel.value = qq.id::text
);

-- 5. Make sure all lesson-quiz relationships are properly set
-- Fix any issues where quiz_id and quiz_id_id don't match
UPDATE payload.course_lessons 
SET quiz_id_id = quiz_id
WHERE quiz_id IS NOT NULL AND (quiz_id_id IS NULL OR quiz_id_id != quiz_id);

-- Fix relationships in course_lessons_rels
INSERT INTO payload.course_lessons_rels (id, _parent_id, field, value, created_at, updated_at, course_quizzes_id)
SELECT 
  gen_random_uuid() as id,
  cl.id as _parent_id,
  'quiz_id' as field,
  cl.quiz_id as value,
  NOW() as created_at,
  NOW() as updated_at,
  cl.quiz_id as course_quizzes_id
FROM payload.course_lessons cl
WHERE cl.quiz_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_lessons_rels rel
  WHERE rel._parent_id = cl.id 
  AND rel.field = 'quiz_id' 
  AND rel.value = cl.quiz_id::text
);

-- 6. Add the reverse relationships (lessons field in course_quizzes)
WITH quizzes_with_lessons AS (
  SELECT 
    cl.quiz_id,
    ARRAY_AGG(cl.id) as lesson_ids
  FROM payload.course_lessons cl
  WHERE cl.quiz_id IS NOT NULL
  GROUP BY cl.quiz_id
)
-- Then ensure relationships exist in rels table
INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at, course_lessons_id)
SELECT 
  gen_random_uuid() as id,
  qwl.quiz_id as _parent_id,
  'lessons' as field,
  lesson_id as value,
  NOW() as created_at,
  NOW() as updated_at,
  lesson_id as course_lessons_id
FROM quizzes_with_lessons qwl, unnest(qwl.lesson_ids) as lesson_id
WHERE NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = qwl.quiz_id 
  AND rel.field = 'lessons' 
  AND rel.value = lesson_id::text
);

-- 7. Verify the fix was successful
-- Count of quizzes with course_id
SELECT COUNT(*) as quizzes_with_course_id 
FROM payload.course_quizzes 
WHERE course_id_id IS NOT NULL;

-- Count of quiz questions with quiz_id
SELECT COUNT(*) as questions_with_quiz 
FROM payload.quiz_questions 
WHERE quiz_id IS NOT NULL;

-- Count of quizzes with questions array populated
SELECT COUNT(*) as quizzes_with_questions 
FROM payload.course_quizzes 
WHERE questions IS NOT NULL AND array_length(questions, 1) > 0;

-- Count of relationship entries in course_quizzes_rels for questions
SELECT COUNT(*) as question_relationships 
FROM payload.course_quizzes_rels 
WHERE field = 'questions';
