import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add Missing Columns Migration
 *
 * This migration adds all the missing columns required by Payload CMS.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running add missing columns migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create documentation_breadcrumbs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_breadcrumbs" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid,
        "doc" uuid,
        "doc_id" uuid,
        "label" varchar,
        "url" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for documentation_breadcrumbs
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_updated_at_idx" ON "payload"."documentation_breadcrumbs" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "documentation_breadcrumbs_created_at_idx" ON "payload"."documentation_breadcrumbs" USING btree ("created_at");
    `)

    // Add foreign key constraint for documentation_breadcrumbs
    await db.execute(sql`
      ALTER TABLE "payload"."documentation_breadcrumbs" 
      ADD CONSTRAINT "documentation_breadcrumbs_parent_id_fkey" 
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;

      ALTER TABLE "payload"."documentation_breadcrumbs" 
      ADD CONSTRAINT "documentation_breadcrumbs_doc_id_fkey" 
      FOREIGN KEY ("doc_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    `)

    // Add columns to documentation table
    await db.execute(sql`
      ALTER TABLE "payload"."documentation"
      ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
      
      ALTER TABLE "payload"."documentation"
      ADD COLUMN IF NOT EXISTS "parent_id" uuid;
    `)

    // Add columns to posts table
    await db.execute(sql`
      ALTER TABLE "payload"."posts"
      ADD COLUMN IF NOT EXISTS "description" text;
      
      ALTER TABLE "payload"."posts"
      ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
      
      ALTER TABLE "payload"."posts"
      ADD COLUMN IF NOT EXISTS "image_id_id" uuid;
    `)

    // Add columns to surveys table
    await db.execute(sql`
      ALTER TABLE "payload"."surveys"
      ADD COLUMN IF NOT EXISTS "start_message" text;
      
      ALTER TABLE "payload"."surveys"
      ADD COLUMN IF NOT EXISTS "end_message" text;
      
      ALTER TABLE "payload"."surveys"
      ADD COLUMN IF NOT EXISTS "show_progress_bar" boolean DEFAULT true;
      
      ALTER TABLE "payload"."surveys"
      ADD COLUMN IF NOT EXISTS "summary_content" jsonb;
      
      ALTER TABLE "payload"."surveys"
      ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'draft';
      
      ALTER TABLE "payload"."surveys"
      ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
    `)

    // Add columns to surveys_rels table
    await db.execute(sql`
      ALTER TABLE "payload"."surveys_rels"
      ADD COLUMN IF NOT EXISTS "path" varchar;
      
      ALTER TABLE "payload"."surveys_rels"
      ADD COLUMN IF NOT EXISTS "survey_questions_id" uuid;
    `)

    // Add columns to survey_questions table
    await db.execute(sql`
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "type" varchar DEFAULT 'text';
      
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "description" text;
      
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "required" boolean DEFAULT false;
      
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "category" varchar;
      
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "questionspin" integer;
      
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "position" integer;
    `)

    // Add featured_image_id_id column to course_lessons table
    await db.execute(sql`
      ALTER TABLE "payload"."course_lessons"
      ADD COLUMN IF NOT EXISTS "featured_image_id_id" uuid;
    `)

    // Add featured_image_id_id column to courses table
    await db.execute(sql`
      ALTER TABLE "payload"."courses"
      ADD COLUMN IF NOT EXISTS "featured_image_id_id" uuid;
    `)

    // Add columns to course_quizzes_rels table
    await db.execute(sql`
      ALTER TABLE "payload"."course_quizzes_rels"
      ADD COLUMN IF NOT EXISTS "path" varchar;
      
      ALTER TABLE "payload"."course_quizzes_rels"
      ADD COLUMN IF NOT EXISTS "quiz_questions_id" uuid;
    `)

    // Add foreign key constraints for relationship tables
    await db.execute(sql`
      -- Add foreign key constraint for posts.image_id_id
      ALTER TABLE "payload"."posts" 
      ADD CONSTRAINT "posts_image_id_id_fkey" 
      FOREIGN KEY ("image_id_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;

      -- Add foreign key constraint for surveys_rels.survey_questions_id
      ALTER TABLE "payload"."surveys_rels" 
      ADD CONSTRAINT "surveys_rels_survey_questions_id_fkey" 
      FOREIGN KEY ("survey_questions_id") REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE;

      -- Add foreign key constraint for course_quizzes_rels.quiz_questions_id
      ALTER TABLE "payload"."course_quizzes_rels" 
      ADD CONSTRAINT "course_quizzes_rels_quiz_questions_id_fkey" 
      FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE;
      
      -- Add foreign key constraint for courses.featured_image_id_id
      ALTER TABLE "payload"."courses" 
      ADD CONSTRAINT "courses_featured_image_id_id_fkey" 
      FOREIGN KEY ("featured_image_id_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;
      
      -- Add foreign key constraint for course_lessons.featured_image_id_id
      ALTER TABLE "payload"."course_lessons" 
      ADD CONSTRAINT "course_lessons_featured_image_id_id_fkey" 
      FOREIGN KEY ("featured_image_id_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Add missing columns migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in add missing columns migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for add missing columns')

  try {
    // Drop foreign key constraints first
    await db.execute(sql`
      -- Drop foreign key constraints for documentation_breadcrumbs
      ALTER TABLE IF EXISTS "payload"."documentation_breadcrumbs" DROP CONSTRAINT IF EXISTS "documentation_breadcrumbs_parent_id_fkey";
      ALTER TABLE IF EXISTS "payload"."documentation_breadcrumbs" DROP CONSTRAINT IF EXISTS "documentation_breadcrumbs_doc_id_fkey";
      
      -- Drop foreign key constraints for relationship tables
      ALTER TABLE IF EXISTS "payload"."posts" DROP CONSTRAINT IF EXISTS "posts_image_id_id_fkey";
      ALTER TABLE IF EXISTS "payload"."surveys_rels" DROP CONSTRAINT IF EXISTS "surveys_rels_survey_questions_id_fkey";
      ALTER TABLE IF EXISTS "payload"."course_quizzes_rels" DROP CONSTRAINT IF EXISTS "course_quizzes_rels_quiz_questions_id_fkey";
      ALTER TABLE IF EXISTS "payload"."courses" DROP CONSTRAINT IF EXISTS "courses_featured_image_id_id_fkey";
      ALTER TABLE IF EXISTS "payload"."course_lessons" DROP CONSTRAINT IF EXISTS "course_lessons_featured_image_id_id_fkey";
    `)

    // Drop documentation_breadcrumbs table
    await db.execute(sql`
      DROP TABLE IF EXISTS "payload"."documentation_breadcrumbs";
    `)

    // Remove added columns
    await db.execute(sql`
      ALTER TABLE "payload"."documentation" DROP COLUMN IF EXISTS "published_at";
      ALTER TABLE "payload"."documentation" DROP COLUMN IF EXISTS "parent_id";
      ALTER TABLE "payload"."posts" DROP COLUMN IF EXISTS "description";
      ALTER TABLE "payload"."posts" DROP COLUMN IF EXISTS "published_at";
      ALTER TABLE "payload"."posts" DROP COLUMN IF EXISTS "image_id_id";
      ALTER TABLE "payload"."surveys" DROP COLUMN IF EXISTS "start_message";
      ALTER TABLE "payload"."surveys" DROP COLUMN IF EXISTS "end_message";
      ALTER TABLE "payload"."surveys" DROP COLUMN IF EXISTS "show_progress_bar";
      ALTER TABLE "payload"."surveys" DROP COLUMN IF EXISTS "summary_content";
      ALTER TABLE "payload"."surveys" DROP COLUMN IF EXISTS "status";
      ALTER TABLE "payload"."surveys" DROP COLUMN IF EXISTS "published_at";
      ALTER TABLE "payload"."surveys_rels" DROP COLUMN IF EXISTS "path";
      ALTER TABLE "payload"."surveys_rels" DROP COLUMN IF EXISTS "survey_questions_id";
      ALTER TABLE "payload"."survey_questions" DROP COLUMN IF EXISTS "type";
      ALTER TABLE "payload"."survey_questions" DROP COLUMN IF EXISTS "description";
      ALTER TABLE "payload"."survey_questions" DROP COLUMN IF EXISTS "required";
      ALTER TABLE "payload"."survey_questions" DROP COLUMN IF EXISTS "category";
      ALTER TABLE "payload"."survey_questions" DROP COLUMN IF EXISTS "questionspin";
      ALTER TABLE "payload"."survey_questions" DROP COLUMN IF EXISTS "position";
      ALTER TABLE "payload"."course_lessons" DROP COLUMN IF EXISTS "featured_image_id_id";
      ALTER TABLE "payload"."courses" DROP COLUMN IF EXISTS "featured_image_id_id";
      ALTER TABLE "payload"."course_quizzes_rels" DROP COLUMN IF EXISTS "path";
      ALTER TABLE "payload"."course_quizzes_rels" DROP COLUMN IF EXISTS "quiz_questions_id";
    `)

    console.log('Add missing columns down migration completed successfully')
  } catch (error) {
    console.error('Error in add missing columns down migration:', error)
    throw error
  }
}
