import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Base Schema Migration
 *
 * This migration ensures all collection tables have the correct structure
 * and all required columns exist with the proper data types and constraints.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running base schema migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create the main collection tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."courses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT,
        "slug" TEXT UNIQUE,
        "description" TEXT,
        "show_progress_bar" BOOLEAN DEFAULT TRUE,
        "estimated_duration" INTEGER,
        "status" TEXT,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "intro_content" JSONB,
        "completion_content" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."course_lessons" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT,
        "slug" TEXT UNIQUE,
        "description" TEXT,
        "content" TEXT,
        "lesson_number" INTEGER,
        "estimated_duration" INTEGER,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."course_quizzes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT,
        "slug" TEXT UNIQUE,
        "description" TEXT,
        "passing_score" INTEGER,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."quiz_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "question" TEXT,
        "options" JSONB,
        "correct_answer" TEXT,
        "type" TEXT,
        "explanation" TEXT,
        "order" INTEGER,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."surveys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT,
        "slug" TEXT UNIQUE,
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."survey_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "question" TEXT,
        "options" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Ensure course_lessons table has quiz_id column
    await db.execute(sql`
      ALTER TABLE "payload"."course_lessons"
      ADD COLUMN IF NOT EXISTS "quiz_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
    `)

    // Ensure course_lessons table has course_id column
    await db.execute(sql`
      ALTER TABLE "payload"."course_lessons"
      ADD COLUMN IF NOT EXISTS "course_id" uuid REFERENCES "payload"."courses"("id") ON DELETE CASCADE;
    `)

    // Ensure course_lessons table has course_id_id column
    await db.execute(sql`
      ALTER TABLE "payload"."course_lessons"
      ADD COLUMN IF NOT EXISTS "course_id_id" uuid REFERENCES "payload"."courses"("id") ON DELETE CASCADE;
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

    // Verify tables were created
    const tablesResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name IN ('courses', 'course_lessons', 'course_quizzes', 'quiz_questions', 'surveys', 'survey_questions');
    `)

    console.log(`Verified ${tablesResult.rows.length} tables were created`)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Base schema migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
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
