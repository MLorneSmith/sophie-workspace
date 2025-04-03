import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add Missing Tables Migration
 *
 * This migration adds all the missing tables and columns required by Payload CMS.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running add missing tables migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create media table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."media" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "alt" varchar NOT NULL,
        "filename" varchar,
        "mime_type" varchar,
        "filesize" numeric,
        "width" numeric,
        "height" numeric,
        "url" varchar,
        "thumbnail_u_r_l" varchar,
        "focal_x" numeric,
        "focal_y" numeric,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for media
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "payload"."media" USING btree ("filename");
    `)

    // Create documentation table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "status" varchar DEFAULT 'draft',
        "content" jsonb,
        "parent" uuid,
        "description" text,
        "order" numeric DEFAULT 0,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create documentation_rels table for relationships
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_rels" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid,
        "path" varchar,
        "documentation_id" uuid,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create documentation_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_categories" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "parent_id" uuid,
        "_parent_id" uuid,
        "category" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for documentation_categories
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "documentation_categories_updated_at_idx" ON "payload"."documentation_categories" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "documentation_categories_created_at_idx" ON "payload"."documentation_categories" USING btree ("created_at");
    `)

    // Add foreign key constraint for documentation_categories
    await db.execute(sql`
      ALTER TABLE "payload"."documentation_categories" 
      ADD CONSTRAINT "documentation_categories_parent_id_fkey" 
      FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    `)

    // Create documentation_tags table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_tags" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "parent_id" uuid,
        "_parent_id" uuid,
        "tag" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for documentation_tags
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "documentation_tags_updated_at_idx" ON "payload"."documentation_tags" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "documentation_tags_created_at_idx" ON "payload"."documentation_tags" USING btree ("created_at");
    `)

    // Add foreign key constraint for documentation_tags
    await db.execute(sql`
      ALTER TABLE "payload"."documentation_tags" 
      ADD CONSTRAINT "documentation_tags_parent_id_fkey" 
      FOREIGN KEY ("parent_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    `)

    // Create posts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "status" varchar DEFAULT 'draft',
        "content" jsonb,
        "image_id" uuid,
        "featured_image_id" uuid,
        "featured_image_id_id" uuid,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create posts_rels table for relationships
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts_rels" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid,
        "path" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create posts_categories table for the categories array field
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts_categories" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid,
        "category" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create posts_tags table for the tags array field
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts_tags" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid,
        "tag" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create courses_rels table for relationships
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."courses_rels" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid,
        "parent_id" uuid,
        "path" varchar,
        "course_lessons_id" uuid,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create survey_questions_options table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."survey_questions_options" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "_order" integer,
        "order" integer,
        "_parent_id" uuid,
        "option" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create quiz_questions_options table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_options" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "_order" integer,
        "order" integer,
        "_parent_id" uuid,
        "text" varchar,
        "is_correct" boolean DEFAULT false,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Fix surveys_rels table
    await db.execute(sql`
      ALTER TABLE "payload"."surveys_rels"
      ADD COLUMN IF NOT EXISTS "parent_id" uuid,
      ADD COLUMN IF NOT EXISTS "order" integer;
    `)

    // Fix course_quizzes_rels table
    await db.execute(sql`
      ALTER TABLE "payload"."course_quizzes_rels"
      ADD COLUMN IF NOT EXISTS "parent_id" uuid,
      ADD COLUMN IF NOT EXISTS "order" integer;
    `)

    // Add text column to survey_questions
    await db.execute(sql`
      -- Add text column to survey_questions table that maps to question column
      ALTER TABLE "payload"."survey_questions"
      ADD COLUMN IF NOT EXISTS "text" varchar GENERATED ALWAYS AS ("question") STORED;
    `)

    // Add _order columns to tables with order columns
    await db.execute(sql`
      -- For each table with an order column, add an _order column that maps to it
      DO $$
      DECLARE
        tbl_name text;
      BEGIN
        FOR tbl_name IN 
          SELECT t.table_name 
          FROM information_schema.tables t
          WHERE t.table_schema = 'payload' 
          AND t.table_type = 'BASE TABLE'
        LOOP
          -- Check if the table has an order column but no _order column
          IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = tbl_name 
            AND column_name = 'order'
          ) AND NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = tbl_name 
            AND column_name = '_order'
          ) THEN
            EXECUTE format('
              ALTER TABLE "payload".%I
              ADD COLUMN "_order" integer GENERATED ALWAYS AS ("order") STORED;
            ', tbl_name);
          END IF;
        END LOOP;
      END $$;
    `)

    // Add foreign key constraints
    await db.execute(sql`
      -- Add foreign key constraints for posts
      ALTER TABLE "payload"."posts" 
      ADD CONSTRAINT "posts_image_id_fkey" 
      FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;

      ALTER TABLE "payload"."posts" 
      ADD CONSTRAINT "posts_featured_image_id_fkey" 
      FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;

      ALTER TABLE "payload"."posts" 
      ADD CONSTRAINT "posts_featured_image_id_id_fkey" 
      FOREIGN KEY ("featured_image_id_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;

      -- Add foreign key constraints for posts_categories
      ALTER TABLE "payload"."posts_categories" 
      ADD CONSTRAINT "posts_categories_parent_id_fkey" 
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."posts"("id") ON DELETE CASCADE;

      -- Add foreign key constraints for posts_tags
      ALTER TABLE "payload"."posts_tags" 
      ADD CONSTRAINT "posts_tags_parent_id_fkey" 
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."posts"("id") ON DELETE CASCADE;

      -- Add foreign key constraints for documentation
      ALTER TABLE "payload"."documentation_rels" 
      ADD CONSTRAINT "documentation_rels_documentation_id_fkey" 
      FOREIGN KEY ("documentation_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;

      ALTER TABLE "payload"."documentation_rels" 
      ADD CONSTRAINT "documentation_rels_parent_id_fkey" 
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;

      -- Add foreign key constraints for courses
      ALTER TABLE "payload"."courses_rels" 
      ADD CONSTRAINT "courses_rels_course_lessons_id_fkey" 
      FOREIGN KEY ("course_lessons_id") REFERENCES "payload"."course_lessons"("id") ON DELETE CASCADE;

      ALTER TABLE "payload"."courses_rels" 
      ADD CONSTRAINT "courses_rels_parent_id_fkey" 
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."courses"("id") ON DELETE CASCADE;

      -- Add foreign key constraints for survey_questions_options
      ALTER TABLE "payload"."survey_questions_options" 
      ADD CONSTRAINT "survey_questions_options_parent_id_fkey" 
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE;

      -- Add foreign key constraints for quiz_questions_options
      ALTER TABLE "payload"."quiz_questions_options" 
      ADD CONSTRAINT "quiz_questions_options_parent_id_fkey" 
      FOREIGN KEY ("_parent_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE;
    `)

    // Create indexes
    await db.execute(sql`
      -- Create indexes for documentation
      CREATE INDEX IF NOT EXISTS "documentation_updated_at_idx" ON "payload"."documentation" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "documentation_created_at_idx" ON "payload"."documentation" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "documentation_slug_idx" ON "payload"."documentation" USING btree ("slug");

      -- Create indexes for posts
      CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "payload"."posts" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "payload"."posts" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "payload"."posts" USING btree ("slug");

      -- Create indexes for posts_categories
      CREATE INDEX IF NOT EXISTS "posts_categories_updated_at_idx" ON "payload"."posts_categories" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "posts_categories_created_at_idx" ON "payload"."posts_categories" USING btree ("created_at");

      -- Create indexes for posts_tags
      CREATE INDEX IF NOT EXISTS "posts_tags_updated_at_idx" ON "payload"."posts_tags" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "posts_tags_created_at_idx" ON "payload"."posts_tags" USING btree ("created_at");

      -- Create indexes for survey_questions_options
      CREATE INDEX IF NOT EXISTS "survey_questions_options_updated_at_idx" ON "payload"."survey_questions_options" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "survey_questions_options_created_at_idx" ON "payload"."survey_questions_options" USING btree ("created_at");

      -- Create indexes for quiz_questions_options
      CREATE INDEX IF NOT EXISTS "quiz_questions_options_updated_at_idx" ON "payload"."quiz_questions_options" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "quiz_questions_options_created_at_idx" ON "payload"."quiz_questions_options" USING btree ("created_at");
    `)

    // Verify tables were created
    const tablesResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name IN ('media', 'documentation', 'documentation_rels', 'posts', 'posts_rels', 
                         'posts_categories', 'posts_tags', 'courses_rels', 'survey_questions_options', 
                         'quiz_questions_options', 'documentation_categories', 'documentation_tags');
    `)

    console.log(`Verified ${tablesResult.rows.length} tables were created`)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Add missing tables migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in add missing tables migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for add missing tables')

  try {
    // Drop foreign key constraints first
    await db.execute(sql`
      -- Drop foreign key constraints for posts
      ALTER TABLE IF EXISTS "payload"."posts" DROP CONSTRAINT IF EXISTS "posts_image_id_fkey";
      ALTER TABLE IF EXISTS "payload"."posts" DROP CONSTRAINT IF EXISTS "posts_featured_image_id_fkey";
      ALTER TABLE IF EXISTS "payload"."posts" DROP CONSTRAINT IF EXISTS "posts_featured_image_id_id_fkey";

      -- Drop foreign key constraints for posts_categories
      ALTER TABLE IF EXISTS "payload"."posts_categories" DROP CONSTRAINT IF EXISTS "posts_categories_parent_id_fkey";

      -- Drop foreign key constraints for posts_tags
      ALTER TABLE IF EXISTS "payload"."posts_tags" DROP CONSTRAINT IF EXISTS "posts_tags_parent_id_fkey";

      -- Drop foreign key constraints for documentation
      ALTER TABLE IF EXISTS "payload"."documentation_rels" DROP CONSTRAINT IF EXISTS "documentation_rels_documentation_id_fkey";
      ALTER TABLE IF EXISTS "payload"."documentation_rels" DROP CONSTRAINT IF EXISTS "documentation_rels_parent_id_fkey";

      -- Drop foreign key constraints for documentation_categories
      ALTER TABLE IF EXISTS "payload"."documentation_categories" DROP CONSTRAINT IF EXISTS "documentation_categories_parent_id_fkey";

      -- Drop foreign key constraints for documentation_tags
      ALTER TABLE IF EXISTS "payload"."documentation_tags" DROP CONSTRAINT IF EXISTS "documentation_tags_parent_id_fkey";

      -- Drop foreign key constraints for courses
      ALTER TABLE IF EXISTS "payload"."courses_rels" DROP CONSTRAINT IF EXISTS "courses_rels_course_lessons_id_fkey";
      ALTER TABLE IF EXISTS "payload"."courses_rels" DROP CONSTRAINT IF EXISTS "courses_rels_parent_id_fkey";

      -- Drop foreign key constraints for survey_questions_options
      ALTER TABLE IF EXISTS "payload"."survey_questions_options" DROP CONSTRAINT IF EXISTS "survey_questions_options_parent_id_fkey";

      -- Drop foreign key constraints for quiz_questions_options
      ALTER TABLE IF EXISTS "payload"."quiz_questions_options" DROP CONSTRAINT IF EXISTS "quiz_questions_options_parent_id_fkey";
    `)

    // Drop tables
    await db.execute(sql`
      DROP TABLE IF EXISTS "payload"."quiz_questions_options";
      DROP TABLE IF EXISTS "payload"."survey_questions_options";
      DROP TABLE IF EXISTS "payload"."posts_categories";
      DROP TABLE IF EXISTS "payload"."posts_tags";
      DROP TABLE IF EXISTS "payload"."posts_rels";
      DROP TABLE IF EXISTS "payload"."posts";
      DROP TABLE IF EXISTS "payload"."documentation_tags";
      DROP TABLE IF EXISTS "payload"."documentation_categories";
      DROP TABLE IF EXISTS "payload"."documentation_rels";
      DROP TABLE IF EXISTS "payload"."documentation";
      DROP TABLE IF EXISTS "payload"."courses_rels";
      DROP TABLE IF EXISTS "payload"."media";
    `)

    // Remove added columns
    await db.execute(sql`
      ALTER TABLE "payload"."surveys_rels" DROP COLUMN IF EXISTS "parent_id";
      ALTER TABLE "payload"."surveys_rels" DROP COLUMN IF EXISTS "order";
      ALTER TABLE "payload"."course_quizzes_rels" DROP COLUMN IF EXISTS "parent_id";
      ALTER TABLE "payload"."course_quizzes_rels" DROP COLUMN IF EXISTS "order";
      ALTER TABLE "payload"."survey_questions" DROP COLUMN IF EXISTS "text";
    `)

    console.log('Add missing tables down migration completed successfully')
  } catch (error) {
    console.error('Error in add missing tables down migration:', error)
    throw error
  }
}
