/**
 * Utility functions for handling relationship columns in SQL generation
 */
/**
 * Generates SQL to create a relationship table with all required columns
 * @param tableName The name of the relationship table (without schema)
 * @returns SQL string to create the relationship table with all required columns
 */
export function generateRelationshipTableSql(tableName) {
    return `
CREATE TABLE IF NOT EXISTS payload.${tableName} (
  id UUID PRIMARY KEY,
  _parent_id UUID NOT NULL,
  field TEXT,
  value UUID,
  parent_id UUID,
  downloads_id UUID,
  posts_id UUID,
  documentation_id UUID,
  surveys_id UUID,
  survey_questions_id UUID,
  courses_id UUID,
  course_lessons_id UUID,
  course_quizzes_id UUID,
  quiz_questions_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;
}
/**
 * Generates SQL to add missing relationship columns to an existing table
 * @param tableName The name of the relationship table (without schema)
 * @returns SQL string to add missing relationship columns
 */
export function generateAddRelationshipColumnsSql(tableName) {
    return `
-- Add missing relationship columns to ${tableName}
DO $$
BEGIN
  -- Add parent_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN parent_id UUID;
  END IF;

  -- Add downloads_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'downloads_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN downloads_id UUID;
  END IF;

  -- Add documentation_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'documentation_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN documentation_id UUID;
  END IF;

  -- Add surveys_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'surveys_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN surveys_id UUID;
  END IF;

  -- Add survey_questions_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'survey_questions_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN survey_questions_id UUID;
  END IF;

  -- Add courses_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'courses_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN courses_id UUID;
  END IF;

  -- Add course_lessons_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'course_lessons_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN course_lessons_id UUID;
  END IF;

  -- Add course_quizzes_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'course_quizzes_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN course_quizzes_id UUID;
  END IF;

  -- Add quiz_questions_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'quiz_questions_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN quiz_questions_id UUID;
  END IF;

  -- Add posts_id if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'payload'
    AND table_name = '${tableName}'
    AND column_name = 'posts_id'
  ) THEN
    ALTER TABLE payload.${tableName} ADD COLUMN posts_id UUID;
  END IF;
END
$$;
`;
}
