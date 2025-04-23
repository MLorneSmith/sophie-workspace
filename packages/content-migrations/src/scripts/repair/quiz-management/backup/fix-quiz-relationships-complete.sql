-- Comprehensive Quiz Relationship Fix
-- Fixes all issues with quiz relationships in a single transaction:
-- 1. Sets course_id_id on all quizzes with proper type casting
-- 2. Creates course relationship entries in course_quizzes_rels
-- 3. Creates bidirectional quiz-question relationships in course_quizzes_rels

-- Use serializable isolation to prevent concurrent interference
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 1. Fix course_id_id in main table with proper TEXT type casting
-- Also use FOR UPDATE to lock rows during modification
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::text
WHERE id IN (SELECT id FROM payload.course_quizzes FOR UPDATE)
AND (course_id_id IS NULL OR course_id_id = '');

-- 2. Create course relationship entries in relationship table
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  courses_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  cq.id as _parent_id,
  'course_id' as field,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as value,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as courses_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.course_quizzes cq
WHERE NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = cq.id
  AND rel.field = 'course_id'
)
AND cq.id IN (SELECT id FROM payload.course_quizzes FOR UPDATE);

-- 3. Create quiz-question bidirectional relationships
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  quiz_questions_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  qq.quiz_id as _parent_id,
  'questions' as field,
  qq.id as value,
  qq.id as quiz_questions_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.quiz_questions qq
WHERE qq.quiz_id IS NOT NULL
AND qq.quiz_id IN (SELECT id FROM payload.course_quizzes FOR UPDATE)
AND NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = qq.quiz_id
  AND rel.field = 'questions'
  AND rel.value = qq.id
);

-- 4. Verification queries to confirm changes
SELECT COUNT(*) as quizzes_with_course_id
FROM payload.course_quizzes
WHERE course_id_id IS NOT NULL;

SELECT COUNT(*) as course_relationships
FROM payload.course_quizzes_rels
WHERE field = 'course_id';

SELECT COUNT(*) as question_relationships
FROM payload.course_quizzes_rels
WHERE field = 'questions';

-- Commit all changes
COMMIT;
