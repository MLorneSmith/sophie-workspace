import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Minimal Quiz-Question Relationship Fix
 *
 * This migration implements a minimal fix for the quiz-question relationship issues:
 * - Adds required columns and schema structure
 * - Creates a verification function to analyze relationship consistency
 * - Sets up monitoring for UUID tables
 *
 * This approach avoids type casting issues by not attempting to update or synchronize data,
 * which will be handled by separate repair scripts.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running minimal quiz relationship fix')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // 1. Ensure questions array column exists in course_quizzes
    console.log('Ensuring questions array column exists in course_quizzes')
    await db.execute(sql`
      ALTER TABLE payload.course_quizzes 
      ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;
    `)

    // 2. Initialize empty questions array for quizzes without one
    console.log('Initializing empty questions array for quizzes without one')
    await db.execute(sql`
      UPDATE payload.course_quizzes
      SET questions = '[]'::jsonb
      WHERE questions IS NULL OR jsonb_typeof(questions) != 'array';
    `)

    // 3. Ensure course_quizzes_rels has required columns
    console.log('Ensuring course_quizzes_rels has required columns')
    await db.execute(sql`
      ALTER TABLE payload.course_quizzes_rels
      ADD COLUMN IF NOT EXISTS quiz_questions_id TEXT,
      ADD COLUMN IF NOT EXISTS value TEXT,
      ADD COLUMN IF NOT EXISTS id TEXT,
      ADD COLUMN IF NOT EXISTS path TEXT,
      ADD COLUMN IF NOT EXISTS parent_id TEXT;
    `)

    // 4. Create table to track relationships for repair scripts
    console.log('Creating relationship tracking table')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.quiz_question_relationships (
        quiz_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (quiz_id, question_id)
      );
    `)

    // 5. Create verification function for relationship integrity
    console.log('Creating verification function')
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.verify_quiz_question_relationships()
      RETURNS TABLE(
        quiz_id text,
        quiz_title text,
        array_count integer,
        rel_count integer,
        is_consistent boolean,
        missing_questions text[]
      ) AS $$
      BEGIN
        -- Use temporary tables to avoid type casting issues
        CREATE TEMP TABLE temp_array_questions AS
        SELECT 
          id::text as quiz_id,
          title::text as quiz_title,
          jsonb_array_length(
            CASE WHEN jsonb_typeof(questions) = 'array' 
              THEN questions 
              ELSE '[]'::jsonb 
            END
          ) as array_count
        FROM payload.course_quizzes;

        CREATE TEMP TABLE temp_rel_questions AS
        SELECT 
          _parent_id as quiz_id,
          COUNT(DISTINCT quiz_questions_id) as rel_count
        FROM payload.course_quizzes_rels
        WHERE field = 'questions'
          AND quiz_questions_id IS NOT NULL
        GROUP BY _parent_id;

        RETURN QUERY
        SELECT 
          aq.quiz_id,
          COALESCE(aq.quiz_title, 'Unnamed Quiz'),
          aq.array_count,
          COALESCE(rq.rel_count, 0) as rel_count,
          aq.array_count = COALESCE(rq.rel_count, 0) as is_consistent,
          ARRAY[]::text[] as missing_questions
        FROM temp_array_questions aq
        LEFT JOIN temp_rel_questions rq ON rq.quiz_id = aq.quiz_id
        WHERE aq.array_count > 0 OR COALESCE(rq.rel_count, 0) > 0;
        
        -- Clean up temporary tables
        DROP TABLE temp_array_questions;
        DROP TABLE temp_rel_questions;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // 6. Create monitoring table for UUID tables
    console.log('Creating monitoring table')
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.uuid_table_monitor (
        id SERIAL PRIMARY KEY,
        table_name TEXT NOT NULL,
        monitored_at TIMESTAMP NOT NULL DEFAULT NOW(),
        action TEXT NOT NULL
      );
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Minimal quiz relationship fix completed successfully')
  } catch (error) {
    // Rollback transaction on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in minimal quiz relationship fix:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    console.log('Reverting minimal quiz relationship fix')

    // Drop verification function
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.verify_quiz_question_relationships();
    `)

    // We don't drop the tables as they might be beneficial

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully reverted minimal quiz relationship fix')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error reverting minimal quiz relationship fix:', error)
    throw error
  }
}
