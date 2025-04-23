-- Consolidated Course-Quiz Relationship Fix
-- Handles both course-quiz and quiz-question relationships
-- Uses high transaction isolation and comprehensive error handling

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Set variables and execute main logic in a DO block for better error handling
DO $$
DECLARE
    main_course_id TEXT;
    main_course_id_uuid UUID;
    affected_rows INTEGER;
    quiz_count INTEGER;
    question_count INTEGER;
BEGIN
    -- Get course ID from the database or use hardcoded fallback
    SELECT id INTO main_course_id_uuid 
    FROM payload.courses 
    WHERE slug = 'decks-for-decision-makers' 
    LIMIT 1;
    
    IF main_course_id_uuid IS NULL THEN
        -- Fallback to hardcoded ID if not found
        main_course_id_uuid := '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid;
        RAISE NOTICE 'Using hardcoded course ID as fallback: %', main_course_id_uuid;
    ELSE
        RAISE NOTICE 'Found course ID in database: %', main_course_id_uuid;
    END IF;
    
    main_course_id := main_course_id_uuid::text;
    
    -- Get initial counts for reporting
    SELECT COUNT(*) INTO quiz_count FROM payload.course_quizzes;
    SELECT COUNT(*) INTO question_count FROM payload.quiz_questions;
    RAISE NOTICE 'Found % quizzes and % questions to process', quiz_count, question_count;
    
    -- PART 1: FIX COURSE-QUIZ RELATIONSHIPS
    
    -- Step 1: Update course_id_id in course_quizzes table (direct field storage)
    UPDATE payload.course_quizzes
    SET course_id_id = main_course_id
    WHERE (course_id_id IS NULL OR course_id_id = '')
    AND id IN (SELECT id FROM payload.course_quizzes FOR UPDATE SKIP LOCKED);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % quizzes with course_id_id', affected_rows;

    -- Step 2: Delete any existing course relationship entries to ensure clean state
    DELETE FROM payload.course_quizzes_rels
    WHERE field = 'course_id';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Removed % existing course relationship entries', affected_rows;

    -- Step 3: Create course relationship entries in course_quizzes_rels table
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
    
    -- PART 2: FIX QUIZ-QUESTION RELATIONSHIPS (UNIDIRECTIONAL MODEL)
    
    -- Step 4: Identify all quiz-question relationships
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
    
    -- Step 5: Create missing quiz-question relationship entries
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
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Created % quiz-question relationship entries', affected_rows;
    
    -- PART 3: VERIFICATION
    
    RAISE NOTICE 'Verification results:';
    
    -- Verify course_id_id in course_quizzes table
    RAISE NOTICE '  Quizzes without course_id_id: %', (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL);
    
    -- Verify course relationships in course_quizzes_rels table
    RAISE NOTICE '  Course relationship entries: %', (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id');
    
    -- Verify quiz-question relationships
    RAISE NOTICE '  Total questions: %', question_count;
    RAISE NOTICE '  Questions with quiz_id: %', (SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id IS NOT NULL);
    RAISE NOTICE '  Quizzes with questions (relationship table): %', (SELECT COUNT(DISTINCT _parent_id) FROM payload.course_quizzes_rels WHERE field = 'questions');
    RAISE NOTICE '  Total quiz-question relationships: %', (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions');
    
    -- Verify overall consistency
    WITH stats AS (
        SELECT
            (SELECT COUNT(*) FROM payload.course_quizzes) as total_quizzes,
            (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NOT NULL) as quizzes_with_course_id,
            (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id') as course_rel_count,
            (SELECT COUNT(*) FROM payload.quiz_questions) as total_questions,
            (SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id IS NOT NULL) as questions_with_quiz_id,
            (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as question_rel_count
    )
    SELECT
        total_quizzes,
        quizzes_with_course_id,
        course_rel_count,
        CASE WHEN quizzes_with_course_id = total_quizzes AND course_rel_count = total_quizzes 
             THEN 'VALID' ELSE 'INVALID' END as course_relationships_status,
        total_questions,
        questions_with_quiz_id,
        question_rel_count,
        CASE WHEN questions_with_quiz_id = question_rel_count
             THEN 'VALID' ELSE 'INVALID' END as question_relationships_status
    INTO STRICT affected_rows
    FROM stats;
    
    -- Add safeguard trigger to prevent quiz_id from being reset to NULL in questions
    CREATE OR REPLACE FUNCTION prevent_quiz_id_reset()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.quiz_id IS NOT NULL AND NEW.quiz_id IS NULL THEN
        RAISE NOTICE 'Preventing quiz_id from being reset to NULL for question ID: %', OLD.id;
        NEW.quiz_id := OLD.quiz_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS prevent_quiz_id_reset_trigger ON payload.quiz_questions;
    
    CREATE TRIGGER prevent_quiz_id_reset_trigger
    BEFORE UPDATE ON payload.quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_quiz_id_reset();
    
    RAISE NOTICE 'Added safeguard trigger to prevent quiz ID resets in questions';
END $$;

-- Detailed course-quiz relationship status
SELECT 
    cq.id, 
    cq.title, 
    cq.course_id_id,
    CASE WHEN cq.course_id_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_direct_id,
    COUNT(cr.id) as course_rel_count,
    CASE WHEN COUNT(cr.id) > 0 THEN 'YES' ELSE 'NO' END as has_relationship,
    CASE 
        WHEN cq.course_id_id IS NOT NULL AND COUNT(cr.id) > 0 THEN 'VALID'
        ELSE 'INVALID'
    END as status
FROM 
    payload.course_quizzes cq
LEFT JOIN 
    payload.course_quizzes_rels cr
        ON cr._parent_id = cq.id 
        AND cr.field = 'course_id'
GROUP BY 
    cq.id, cq.title, cq.course_id_id
ORDER BY 
    cq.title;

-- Detailed quiz-question relationship status
SELECT 
    cq.id, 
    cq.title,
    COUNT(DISTINCT qq.id) as direct_question_count,
    COUNT(DISTINCT qr.value) as rel_question_count,
    CASE 
        WHEN COUNT(DISTINCT qq.id) = COUNT(DISTINCT qr.value) AND COUNT(DISTINCT qq.id) > 0 THEN 'VALID'
        WHEN COUNT(DISTINCT qq.id) = 0 AND COUNT(DISTINCT qr.value) = 0 THEN 'EMPTY'
        ELSE 'INVALID'
    END as status
FROM 
    payload.course_quizzes cq
LEFT JOIN 
    payload.quiz_questions qq
        ON qq.quiz_id = cq.id
LEFT JOIN 
    payload.course_quizzes_rels qr
        ON qr._parent_id = cq.id 
        AND qr.field = 'questions'
GROUP BY 
    cq.id, cq.title
ORDER BY 
    cq.title;

-- Summary verification query
SELECT 
    (SELECT COUNT(*) FROM payload.course_quizzes) as total_quizzes,
    (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NOT NULL) as quizzes_with_course_id,
    (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id') as course_relationship_entries,
    (SELECT COUNT(*) FROM payload.quiz_questions) as total_questions,
    (SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id IS NOT NULL) as questions_with_quiz_id,
    (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as question_relationship_entries,
    (SELECT COUNT(DISTINCT _parent_id) FROM payload.course_quizzes_rels WHERE field = 'questions') as quizzes_with_questions;

COMMIT;
