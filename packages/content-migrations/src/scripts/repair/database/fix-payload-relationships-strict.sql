-- Payload CMS Relationship Architecture Fix Script
-- This script uses strict UUID typing and transaction isolation to ensure both
-- main table and relationship table entries are properly updated

-- Set higher transaction isolation level to prevent interference
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 1. Fix missing course IDs in main table with proper UUID casting
DO $$
DECLARE
    main_course_id UUID; -- Declare variable for course ID
    affected_rows INTEGER;
BEGIN
    -- Fetch the actual ID of the main course
    SELECT id INTO main_course_id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1;

    -- Use the fetched ID in the UPDATE statement
    UPDATE payload.course_quizzes
    SET course_id_id = main_course_id -- Use variable
    WHERE id IN (SELECT id FROM payload.course_quizzes FOR UPDATE)
    AND (course_id_id IS NULL OR course_id_id::text = '');

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % rows in course_quizzes table', affected_rows;
END $$;

-- 2. Add course relationships in relationship table with specific data typing
DO $$
DECLARE
    main_course_id UUID; -- Declare variable for course ID (needed again in this block)
    affected_rows INTEGER;
BEGIN
    -- Fetch the actual ID of the main course again within this block's scope
    SELECT id INTO main_course_id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1;

    INSERT INTO payload.course_quizzes_rels
        (id, _parent_id, field, courses_id, created_at, updated_at) -- Removed 'value' column from insert target
    SELECT
        gen_random_uuid()::uuid as id,
        cq.id::uuid as _parent_id,
        'course_id' as field,
        -- '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as value, -- Removed hardcoded value
        main_course_id as courses_id, -- Use variable
        NOW() as created_at,
        NOW() as updated_at
    FROM payload.course_quizzes cq
    WHERE NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels rel
        WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
    );
    -- Removed ON CONFLICT as 'value' is no longer part of the potential conflict target

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Inserted % rows into course_quizzes_rels table for course_id field', affected_rows;
END $$;

-- 3. Ensure course_id_id and relationship table entries are consistent
DO $$
DECLARE
    main_course_id UUID; -- Declare variable for course ID (needed again in this block)
    inconsistent_count INTEGER;
BEGIN
    -- Fetch the actual ID of the main course again within this block's scope
    SELECT id INTO main_course_id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1;

    -- Check for inconsistencies (Quiz has rel entry but NULL course_id_id)
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
        SET course_id_id = main_course_id -- Use variable
        WHERE cq.course_id_id IS NULL
        AND EXISTS (
            SELECT 1 FROM payload.course_quizzes_rels rel
            WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
        );
    END IF;

    -- Check for reverse inconsistencies (Quiz has course_id_id but no rel entry)
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
            (id, _parent_id, field, courses_id, created_at, updated_at) -- Removed 'value'
        SELECT
            gen_random_uuid()::uuid as id,
            cq.id::uuid as _parent_id,
            'course_id' as field,
            -- cq.course_id_id as value, -- Removed value
            cq.course_id_id as courses_id,
            NOW() as created_at,
            NOW() as updated_at
        FROM payload.course_quizzes cq
        WHERE cq.course_id_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM payload.course_quizzes_rels rel
            WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
        );
        -- Removed ON CONFLICT
    END IF;
END $$;

-- Set path for existing quiz-question relationships
UPDATE payload.course_quizzes_rels
SET "path" = 'questions'
WHERE quiz_questions_id IS NOT NULL AND ("path" IS NULL OR "path" != 'questions');

RAISE NOTICE 'Updated path column for % quiz-question relationships', (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE quiz_questions_id IS NOT NULL AND "path" = 'questions');

-- Step 4 (Quiz-Question Relationships) REMOVED as it's handled by fix:quiz-jsonb-sync

-- Commit the transaction
COMMIT;

-- 5. Verification queries to check the result (not part of transaction) - Renumbered from 5 to 4
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
