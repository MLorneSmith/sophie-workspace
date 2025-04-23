-- Consolidated Quiz Course ID Fix
-- This script combines features from fix-course-ids-final.sql and fix-quiz-course-ids
-- It handles both sides of the dual-storage relationship architecture in Payload CMS

-- Start transaction with serializable isolation
BEGIN;

-- Set main variables
DO $$
DECLARE
    main_course_id TEXT;
    main_course_id_uuid UUID;
    affected_rows INTEGER;
BEGIN
    -- Get the course ID from the courses table directly
    SELECT id INTO main_course_id_uuid 
    FROM payload.courses 
    WHERE slug = 'decks-for-decision-makers' 
    LIMIT 1;
    
    main_course_id := main_course_id_uuid::text;
    
    RAISE NOTICE 'Using course ID: %', main_course_id;
    
    -- First update the main table with explicit CAST
    UPDATE payload.course_quizzes AS cq
    SET course_id_id = main_course_id
    WHERE (cq.course_id_id IS NULL OR cq.course_id_id = '')
    AND cq.id IN (SELECT id FROM payload.course_quizzes FOR UPDATE SKIP LOCKED);
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % quizzes with course_id_id', affected_rows;
    
    -- Remove any existing relationships for courses to ensure clean state
    DELETE FROM payload.course_quizzes_rels 
    WHERE field = 'course_id';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Deleted % existing course relationship entries', affected_rows;
    
    -- Add fresh relationship entries
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
    
    -- Force consistent IDs across all fields
    UPDATE payload.course_quizzes_rels
    SET courses_id = value
    WHERE field = 'course_id' AND courses_id IS NULL;
    
    -- Add safeguard trigger to prevent course_id_id from being reset to NULL
    -- This helps protect against Payload hooks that might unintentionally clear the field
    CREATE OR REPLACE FUNCTION prevent_course_id_reset()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.course_id_id IS NOT NULL AND NEW.course_id_id IS NULL THEN
        RAISE NOTICE 'Preventing course_id_id from being reset to NULL for quiz ID: %', OLD.id;
        NEW.course_id_id := OLD.course_id_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS prevent_course_id_reset_trigger ON payload.course_quizzes;
    
    CREATE TRIGGER prevent_course_id_reset_trigger
    BEFORE UPDATE ON payload.course_quizzes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_course_id_reset();
    
    RAISE NOTICE 'Added safeguard trigger to prevent course ID resets';
END $$;

-- Detailed verification query that shows each quiz status
SELECT 
    cq.id, 
    cq.title, 
    cq.course_id_id,
    CASE WHEN cq.course_id_id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_direct_id,
    COUNT(rel.id) as rel_count,
    CASE WHEN COUNT(rel.id) > 0 THEN 'YES' ELSE 'NO' END as has_relationship,
    CASE 
        WHEN cq.course_id_id IS NOT NULL AND COUNT(rel.id) > 0 THEN 'VALID'
        ELSE 'INVALID'
    END as status
FROM 
    payload.course_quizzes cq
LEFT JOIN 
    payload.course_quizzes_rels rel 
        ON rel._parent_id = cq.id 
        AND rel.field = 'course_id'
GROUP BY 
    cq.id, cq.title, cq.course_id_id
ORDER BY 
    cq.title;

-- Summary verification query
SELECT 
    COUNT(*) as total_quizzes,
    SUM(CASE WHEN course_id_id IS NOT NULL THEN 1 ELSE 0 END) as quizzes_with_direct_id,
    (SELECT COUNT(DISTINCT _parent_id) FROM payload.course_quizzes_rels WHERE field = 'course_id') as quizzes_with_relationships
FROM 
    payload.course_quizzes;

COMMIT;
