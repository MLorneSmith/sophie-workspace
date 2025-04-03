import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Base Schema Migration
 *
 * This migration ensures all collection tables have the correct structure
 * and all required columns exist with the proper data types and constraints.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running base schema migration')

  try {
    // Create the payload schema if it doesn't exist
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS payload;
    `)

    // Ensure course_lessons table has quiz_id column
    await db.execute(sql`
      ALTER TABLE "payload"."course_lessons"
      ADD COLUMN IF NOT EXISTS "quiz_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
    `)

    // Ensure survey_questions table has surveys_id column
    await db.execute(sql`
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "surveys_id" uuid REFERENCES "payload"."surveys"("id") ON DELETE SET NULL;
    `)

    // Ensure quiz_questions table has quiz_id column
    await db.execute(sql`
      ALTER TABLE "payload"."quiz_questions"
      ADD COLUMN IF NOT EXISTS "quiz_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
    `)

    // Ensure quiz_questions table has quiz_id_id column
    await db.execute(sql`
      ALTER TABLE "payload"."quiz_questions"
      ADD COLUMN IF NOT EXISTS "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
    `)

    console.log('Base schema migration completed successfully')
  } catch (error) {
    console.error('Error in base schema migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for base schema')

  try {
    // Remove quiz_id_id column from quiz_questions table
    await db.execute(sql`
      ALTER TABLE "payload"."quiz_questions"
      DROP COLUMN IF EXISTS "quiz_id_id";
    `)

    // Note: We're not removing the other columns as they are essential for the application
    // and removing them could cause data loss.

    console.log('Base schema down migration completed successfully')
  } catch (error) {
    console.error('Error in base schema down migration:', error)
    throw error
  }
}
