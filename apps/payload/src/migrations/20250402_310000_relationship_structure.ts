import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Relationship Structure Migration
 *
 * This migration ensures all relationship tables have the correct structure
 * and all required columns exist (id, _parent_id, field, value).
 *
 * This is a rationalized version that includes all relationship tables and fields
 * that were previously spread across multiple migrations.
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
        "order" integer,
        "_order" integer,
        "path" varchar,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create indexes for course_lessons_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "course_lessons_rels_updated_at_idx" ON "payload"."course_lessons_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "course_lessons_rels_created_at_idx" ON "payload"."course_lessons_rels" USING btree ("created_at");
    `)

    // Ensure survey_questions_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."survey_questions_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "surveys_id" uuid REFERENCES "payload"."surveys"("id") ON DELETE CASCADE,
        "order" integer,
        "_order" integer,
        "path" varchar,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create indexes for survey_questions_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "survey_questions_rels_updated_at_idx" ON "payload"."survey_questions_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "survey_questions_rels_created_at_idx" ON "payload"."survey_questions_rels" USING btree ("created_at");
    `)

    // Ensure surveys_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."surveys_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."surveys"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "parent_id" uuid,
        "order" integer,
        "_order" integer,
        "path" varchar,
        "survey_questions_id" uuid REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create indexes for surveys_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "surveys_rels_updated_at_idx" ON "payload"."surveys_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "surveys_rels_created_at_idx" ON "payload"."surveys_rels" USING btree ("created_at");
    `)

    // Ensure quiz_questions_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "order" integer,
        "_order" integer,
        "path" varchar,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create indexes for quiz_questions_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "quiz_questions_rels_updated_at_idx" ON "payload"."quiz_questions_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "quiz_questions_rels_created_at_idx" ON "payload"."quiz_questions_rels" USING btree ("created_at");
    `)

    // Ensure course_quizzes_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."course_quizzes_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "_parent_id" uuid NOT NULL REFERENCES "payload"."course_quizzes"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "parent_id" uuid,
        "order" integer,
        "_order" integer,
        "path" varchar,
        "quiz_questions_id" uuid REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create indexes for course_quizzes_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "course_quizzes_rels_updated_at_idx" ON "payload"."course_quizzes_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "course_quizzes_rels_created_at_idx" ON "payload"."course_quizzes_rels" USING btree ("created_at");
    `)

    // Ensure documentation_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_rels" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "path" varchar,
        "documentation_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE CASCADE,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for documentation_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "documentation_rels_updated_at_idx" ON "payload"."documentation_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "documentation_rels_created_at_idx" ON "payload"."documentation_rels" USING btree ("created_at");
    `)

    // Ensure posts_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts_rels" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid REFERENCES "payload"."posts"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "path" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for posts_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "posts_rels_updated_at_idx" ON "payload"."posts_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "posts_rels_created_at_idx" ON "payload"."posts_rels" USING btree ("created_at");
    `)

    // Ensure courses_rels table exists with proper structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."courses_rels" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid REFERENCES "payload"."courses"("id") ON DELETE CASCADE,
        "field" VARCHAR(255),
        "value" uuid,
        "parent_id" uuid,
        "path" varchar,
        "course_lessons_id" uuid REFERENCES "payload"."course_lessons"("id") ON DELETE CASCADE,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for courses_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "courses_rels_updated_at_idx" ON "payload"."courses_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "courses_rels_created_at_idx" ON "payload"."courses_rels" USING btree ("created_at");
    `)

    // Verify relationship tables were created
    const relsTablesResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name IN ('course_lessons_rels', 'survey_questions_rels', 'surveys_rels', 
                         'quiz_questions_rels', 'course_quizzes_rels', 'documentation_rels',
                         'posts_rels', 'courses_rels');
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
    // Drop relationship tables in reverse order to avoid foreign key constraints
    await db.execute(sql`
      DROP TABLE IF EXISTS "payload"."courses_rels";
      DROP TABLE IF EXISTS "payload"."posts_rels";
      DROP TABLE IF EXISTS "payload"."documentation_rels";
      DROP TABLE IF EXISTS "payload"."course_quizzes_rels";
      DROP TABLE IF EXISTS "payload"."quiz_questions_rels";
      DROP TABLE IF EXISTS "payload"."surveys_rels";
      DROP TABLE IF EXISTS "payload"."survey_questions_rels";
      DROP TABLE IF EXISTS "payload"."course_lessons_rels";
    `)

    console.log('Relationship structure down migration completed successfully')
  } catch (error) {
    console.error('Error in relationship structure down migration:', error)
    throw error
  }
}
