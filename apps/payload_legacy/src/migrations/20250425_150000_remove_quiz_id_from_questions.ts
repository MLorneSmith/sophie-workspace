import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration 20250425_150000_remove_quiz_id_from_questions.ts
 *
 * Migration to implement unidirectional relationship from CourseQuizzes → QuizQuestions
 * - Removes quiz_id field from quiz_questions collection for unidirectional relationship model
 * - This migration should run BEFORE quiz format fixes
 *
 * Note: Relationship preservation is handled by the content migration script:
 * packages/content-migrations/src/scripts/repair/fix-unidirectional-quiz-relationships.ts
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  try {
    console.log('Starting migration to implement unidirectional relationship model')
    console.log(
      'NOTE: This only updates the schema, relationship preservation is handled separately',
    )

    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Remove the direct quiz_id and quiz_id_id columns from quiz_questions
    await db.execute(sql`
      ALTER TABLE payload.quiz_questions 
      DROP COLUMN IF EXISTS quiz_id,
      DROP COLUMN IF EXISTS quiz_id_id;
    `)

    // Remove related relationship entries from quiz_questions_rels
    await db.execute(sql`
      DELETE FROM payload.quiz_questions_rels 
      WHERE field = 'quiz_id';
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)

    console.log('Successfully removed quiz_id fields from quiz_questions table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in migration:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Add back the quiz_id field - data will need to be restored separately
    await db.execute(sql`
      ALTER TABLE payload.quiz_questions 
      ADD COLUMN IF NOT EXISTS quiz_id TEXT,
      ADD COLUMN IF NOT EXISTS quiz_id_id TEXT;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)

    console.log('Restored quiz_id fields to quiz_questions table (empty)')
    console.log('WARNING: Relationship data will need to be restored separately')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in down migration:', error)
    throw error
  }
}
