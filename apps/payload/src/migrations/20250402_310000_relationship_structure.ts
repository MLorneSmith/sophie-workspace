import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Relationship Structure Migration
 *
 * This migration ensures all relationship tables have the correct structure
 * and all required columns exist (id, _parent_id, field, value).
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running relationship structure migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Ensure course_lessons_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."course_lessons_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."course_lessons"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Ensure survey_questions_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."survey_questions_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "surveys_id" uuid REFERENCES "payload"."surveys"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Ensure surveys_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."surveys_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."surveys"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Ensure quiz_questions_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Ensure course_quizzes_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."course_quizzes_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."course_quizzes"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Verify relationship tables were created
    const relsTablesResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name IN ('course_lessons_rels', 'survey_questions_rels', 'surveys_rels', 'quiz_questions_rels', 'course_quizzes_rels');
    `)

    console.log(`Verified ${relsTablesResult.rows.length} relationship tables were created`)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Relationship structure migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in relationship structure migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for relationship structure')

  try {
    // Note: We're not dropping the relationship tables as they are essential for the application
    // and dropping them could cause data loss.
    console.log('Relationship structure down migration completed successfully')
  } catch (error) {
    console.error('Error in relationship structure down migration:', error)
    throw error
  }
}
