-- Payload CMS Relationship Architecture Fix Script
-- This script uses strict UUID typing and transaction isolation to ensure both
-- main table and relationship table entries are properly updated

-- Set higher transaction isolation level to prevent interference
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 1. Fix missing course IDs in main table with proper UUID casting
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE payload.course_quizzes
    SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid
    WHERE id IN (SELECT id FROM payload.course_quizzes FOR UPDATE)
    AND (course_id_id IS NULL OR course_id_id::text = '');
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % rows in course_quizzes table', affected_rows;
END $$;

-- 2. Add course relationships in relationship table with specific data typing
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    INSERT INTO payload.course_quizzes_rels 
        (id, _parent_id, field, value, courses_id, created_at, updated_at)
    SELECT
        gen_random_uuid()::uuid as id,
        cq.id::uuid as _parent_id,
        'course_id' as field,
        '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as value,
        '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as courses_id,
        NOW() as created_at,
        NOW() as updated_at
    FROM payload.course_quizzes cq
    WHERE NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
    )
    ON CONFLICT (_parent_id, field, value) DO NOTHING;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Inserted % rows into course_quizzes_rels table', affected_rows;
END $$;

-- 3. Ensure course_id_id and relationship table entries are consistent
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    -- Check for inconsistencies
    SELECT COUNT(*) INTO inconsistent_count
    FROM payload.course_quizzes cq
    WHERE cq.course_id_id IS NULL
    AND EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
    );
    
    IF inconsistent_count > 0 THEN
        RAISE NOTICE 'Found % quizzes with relationship entries but NULL course_id_id', inconsistent_count;
        
        -- Fix inconsistencies by updating course_id_id where relationship exists
        UPDATE payload.course_quizzes cq
        SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid
        WHERE cq.course_id_id IS NULL
        AND EXISTS (
            SELECT 1 FROM payload.course_quizzes_rels rel
            WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
        );
    END IF;
    
    -- Check for reverse inconsistencies
    SELECT COUNT(*) INTO inconsistent_count
    FROM payload.course_quizzes cq
    WHERE cq.course_id_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
    );
    
    IF inconsistent_count > 0 THEN
        RAISE NOTICE 'Found % quizzes with course_id_id but no relationship entries', inconsistent_count;
        
        -- Fix inconsistencies by creating relationship entries where course_id_id exists
        INSERT INTO payload.course_quizzes_rels 
            (id, _parent_id, field, value, courses_id, created_at, updated_at)
        SELECT
            gen_random_uuid()::uuid as id,
            cq.id::uuid as _parent_id,
            'course_id' as field,
            cq.course_id_id as value,
            cq.course_id_id as courses_id,
            NOW() as created_at,
            NOW() as updated_at
        FROM payload.course_quizzes cq
        WHERE cq.course_id_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM payload.course_quizzes_rels rel
            WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
        )
        ON CONFLICT (_parent_id, field, value) DO NOTHING;
    END IF;
END $$;

-- 4. Create quiz-question relationships (bidirectional) if missing
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    INSERT INTO payload.course_quizzes_rels 
        (id, _parent_id, field, value, quiz_questions_id, created_at, updated_at)
    SELECT
        gen_random_uuid()::uuid as id,
        qq.quiz_id::uuid as _parent_id,
        'questions' as field,
        qq.id::uuid as value,
        qq.id::uuid as quiz_questions_id,
        NOW() as created_at,
        NOW() as updated_at
    FROM payload.quiz_questions qq
    WHERE quiz_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = qq.quiz_id
        AND rel.field = 'questions'
        AND rel.value = qq.id::text
    )
    ON CONFLICT (_parent_id, field, value) DO NOTHING;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Inserted % quiz-question relationships', affected_rows;
END $$;

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
