-- Highly focused fix for course-quiz relationships
-- Uses high transaction isolation and explicit error handling

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Set variables for better readability and maintenance
DO $$
DECLARE
    main_course_id TEXT := '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';
    main_course_id_uuid UUID := '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid;
    affected_rows INTEGER;
BEGIN

    -- Step 1: Update course_id_id in course_quizzes table (direct field storage)
    UPDATE payload.course_quizzes
    SET course_id_id = main_course_id
    WHERE course_id_id IS NULL OR course_id_id = '';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % quizzes with course_id_id', affected_rows;

    -- Step 2: Delete any existing course relationship entries to ensure clean state
    DELETE FROM payload.course_quizzes_rels
    WHERE field = 'course_id';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Removed % existing course relationship entries', affected_rows;

    -- Step 3: Create course relationship entries in course_quizzes_rels table (relationship table storage)
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
        main_course_id_uuid as value,
        main_course_id_uuid as courses_id,
        NOW() as created_at,
        NOW() as updated_at
    FROM payload.course_quizzes cq;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Created % course relationship entries', affected_rows;

    -- Step 4: Verify results to ensure consistency
    RAISE NOTICE 'Verification results:';
    
    -- Verify course_id_id in course_quizzes table
    PERFORM COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL;
    RAISE NOTICE '  Quizzes without course_id_id: %', COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL;
    
    -- Verify course relationships in course_quizzes_rels table
    PERFORM COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id';
    RAISE NOTICE '  Course relationship entries: %', COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id';
    
    -- Verify mismatch between direct field and relationship entries
    WITH direct_counts AS (
        SELECT COUNT(*) as direct_count FROM payload.course_quizzes WHERE course_id_id IS NOT NULL
    ),
    rel_counts AS (
        SELECT COUNT(*) as rel_count FROM payload.course_quizzes_rels WHERE field = 'course_id'
    )
    SELECT 
        direct_count, 
        rel_count,
        CASE WHEN direct_count = rel_count THEN 'Consistent' ELSE 'Inconsistent' END as status
    FROM direct_counts, rel_counts;
END $$;

COMMIT;
