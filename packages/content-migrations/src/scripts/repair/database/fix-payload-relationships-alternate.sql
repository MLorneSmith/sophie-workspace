-- Alternative Payload CMS Relationship Architecture Fix Script
-- This version handles the case where the unique constraint might not exist

-- Set higher transaction isolation level to prevent interference
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 1. Fix missing course IDs in main table with proper UUID casting
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid
WHERE (course_id_id IS NULL OR course_id_id::text = '');

-- 2. Add course relationships in relationship table with specific data typing
-- First, find all quizzes that need a relationship entry
WITH quizzes_needing_relationship AS (
    SELECT 
        cq.id
    FROM payload.course_quizzes cq
    WHERE NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
    )
)
-- Then insert only for those quizzes - no ON CONFLICT needed
INSERT INTO payload.course_quizzes_rels 
    (id, _parent_id, field, value, courses_id, created_at, updated_at)
SELECT
    gen_random_uuid()::uuid as id,
    qnr.id::uuid as _parent_id,
    'course_id' as field,
    '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as value,
    '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as courses_id,
    NOW() as created_at,
    NOW() as updated_at
FROM quizzes_needing_relationship qnr;

-- 3. Ensure course_id_id and relationship table entries are consistent
-- Fix quizzes with relationship entries but NULL course_id_id
UPDATE payload.course_quizzes cq
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid
WHERE cq.course_id_id IS NULL
AND EXISTS (
    SELECT 1 FROM payload.course_quizzes_rels rel
    WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
);

-- Fix quizzes with course_id_id but no relationship entries
WITH quizzes_missing_relationship AS (
    SELECT 
        cq.id,
        cq.course_id_id
    FROM payload.course_quizzes cq
    WHERE cq.course_id_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
    )
)
INSERT INTO payload.course_quizzes_rels 
    (id, _parent_id, field, value, courses_id, created_at, updated_at)
SELECT
    gen_random_uuid()::uuid as id,
    qmr.id::uuid as _parent_id,
    'course_id' as field,
    qmr.course_id_id::uuid as value,
    qmr.course_id_id::uuid as courses_id,
    NOW() as created_at,
    NOW() as updated_at
FROM quizzes_missing_relationship qmr;

-- 4. We skip the quiz-question relationship creation since
-- the quiz_questions table doesn't have a quiz_id column.
-- The relationships are handled through the course_quizzes_rels table.

-- Commit the transaction
COMMIT;

-- 5. Verification queries to check the result (not part of transaction)
-- Count of quizzes with course_id_id properly set
SELECT COUNT(*) as quizzes_with_course_id
FROM payload.course_quizzes
WHERE course_id_id IS NOT NULL;

-- Count of course relationships in relationship table
SELECT COUNT(*) as course_relationships
FROM payload.course_quizzes_rels
WHERE field = 'course_id';

-- Count of question relationships in relationship table
SELECT COUNT(*) as question_relationships
FROM payload.course_quizzes_rels
WHERE field = 'questions';

-- Check for inconsistencies between both storage locations
SELECT COUNT(*) as inconsistent_quizzes
FROM payload.course_quizzes cq
WHERE (cq.course_id_id IS NULL AND EXISTS (
    SELECT 1 FROM payload.course_quizzes_rels rel
    WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
)) OR (cq.course_id_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM payload.course_quizzes_rels rel
    WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
));
