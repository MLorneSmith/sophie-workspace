-- Use serializable isolation to prevent concurrent interference
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 1. Fix course_id_id in the main table (direct field storage)
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::text
WHERE (course_id_id IS NULL OR course_id_id = '')
AND id IN (SELECT id FROM payload.course_quizzes FOR UPDATE);

-- 2. Create course relationship entries (relationship table storage)
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

-- 3. Identify all quiz-question relationships
WITH quiz_questions_data AS (
  -- Get all known quiz questions
  SELECT
    qq.id as question_id,
    -- Direct reference from the question to quiz if it exists
    qq.quiz_id as direct_quiz_id,
    -- If no direct reference, try to find from relationship tables if they exist
    (
      SELECT _parent_id
      FROM payload.quiz_questions_rels
      WHERE value = qq.id AND field = 'questions'
      LIMIT 1
    ) as rel_quiz_id
  FROM payload.quiz_questions qq
)

-- 4. Create missing quiz-question relationship entries
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
  COALESCE(qd.direct_quiz_id, qd.rel_quiz_id) as _parent_id,
  'questions' as field,
  qd.question_id as value,
  qd.question_id as quiz_questions_id,
  NOW() as created_at,
  NOW() as updated_at
FROM quiz_questions_data qd
WHERE
  -- Only process questions with a valid quiz reference
  (qd.direct_quiz_id IS NOT NULL OR qd.rel_quiz_id IS NOT NULL)
  -- Only create relationship if it doesn't already exist
  AND NOT EXISTS (
    SELECT 1 FROM payload.course_quizzes_rels rel
    WHERE rel._parent_id = COALESCE(qd.direct_quiz_id, qd.rel_quiz_id)
    AND rel.field = 'questions'
    AND rel.value = qd.question_id
  );

-- 5. Verify the results
SELECT
  (SELECT COUNT(*) FROM payload.course_quizzes) as total_quizzes,
  (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NOT NULL) as quizzes_with_course,
  (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id') as course_relationships,
  (SELECT COUNT(*) FROM payload.quiz_questions) as total_questions,
  (SELECT COUNT(DISTINCT _parent_id) FROM payload.course_quizzes_rels WHERE field = 'questions') as quizzes_with_questions,
  (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as question_relationships;

COMMIT;
