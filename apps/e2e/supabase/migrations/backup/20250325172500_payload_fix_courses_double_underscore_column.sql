-- Fix the courses__rels table by adding the course_lessons_id column if it doesn't exist
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = 'courses__rels'
        AND column_name = 'course_lessons_id'
    ) THEN
        -- Add the column
        ALTER TABLE payload.courses__rels ADD COLUMN course_lessons_id integer;
        
        -- Create an index on the column
        CREATE INDEX IF NOT EXISTS courses__rels_course_lessons_id_idx ON payload.courses__rels USING btree (course_lessons_id);
    END IF;
END $$;
