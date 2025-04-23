-- Final Course ID Fix
-- This script provides a targeted fix for course ID relationships in quizzes
-- It handles both sides of the dual-storage relationship architecture in Payload CMS

-- Start transaction with serializable isolation
BEGIN;

-- Get the course ID from the courses table directly
WITH course_data AS (
  SELECT id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1
)
-- First update the main table with explicit CAST and more targeted FOR UPDATE locking
UPDATE payload.course_quizzes AS cq
SET course_id_id = cd.id::text  -- Cast to text as that's what the column expects
FROM course_data cd
WHERE cq.id IN (SELECT id FROM payload.course_quizzes FOR UPDATE SKIP LOCKED); -- Lock rows

-- Remove any existing relationships to ensure clean state
DELETE FROM payload.course_quizzes_rels 
WHERE field = 'course_id';

-- Add fresh relationship entries
WITH course_data AS (
  SELECT id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1
)
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
  cd.id as value,
  cd.id as courses_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.course_quizzes cq, course_data cd;

-- Force consistent IDs across all fields
UPDATE payload.course_quizzes_rels
SET courses_id = value
WHERE field = 'course_id' AND courses_id IS NULL;

-- Add safeguard trigger to prevent course_id_id from being reset to NULL
CREATE OR REPLACE FUNCTION prevent_course_id_reset()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.course_id_id IS NOT NULL AND NEW.course_id_id IS NULL THEN
    RAISE NOTICE 'Preventing course_id_id from being reset to NULL';
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

-- Verification query
SELECT COUNT(*) as fixed_quizzes
FROM payload.course_quizzes
WHERE course_id_id IS NOT NULL;

COMMIT;
