import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Base Schema Migration
 *
 * This migration ensures all collection tables have the correct structure
 * and all required columns exist with the proper data types and constraints.
 *
 * This is a rationalized version that includes all tables and fields that were
 * previously spread across multiple migrations.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running base schema migration')

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

    // Add relationship ID columns to payload_locked_documents table if they don't exist
    await db.execute(sql`
      DO $$
      BEGIN
        -- Add media_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'media_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "media_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL;
        END IF;

        -- Add documentation_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'documentation_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "documentation_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE SET NULL;
        END IF;

        -- Add posts_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'posts_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "posts_id" uuid REFERENCES "payload"."posts"("id") ON DELETE SET NULL;
        END IF;

        -- Add surveys_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'surveys_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "surveys_id" uuid REFERENCES "payload"."surveys"("id") ON DELETE SET NULL;
        END IF;

        -- Add survey_questions_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'survey_questions_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "survey_questions_id" uuid REFERENCES "payload"."survey_questions"("id") ON DELETE SET NULL;
        END IF;

        -- Add courses_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'courses_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "courses_id" uuid REFERENCES "payload"."courses"("id") ON DELETE SET NULL;
        END IF;

        -- Add course_lessons_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'course_lessons_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "course_lessons_id" uuid REFERENCES "payload"."course_lessons"("id") ON DELETE SET NULL;
        END IF;

        -- Add course_quizzes_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'course_quizzes_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "course_quizzes_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
        END IF;

        -- Add quiz_questions_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'quiz_questions_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "quiz_questions_id" uuid REFERENCES "payload"."quiz_questions"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `)

    // Add relationship ID columns to payload_locked_documents_rels table if they don't exist
    await db.execute(sql`
      DO $$
      BEGIN
        -- Add media_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'media_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "media_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL;
        END IF;

        -- Add documentation_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'documentation_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "documentation_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE SET NULL;
        END IF;

        -- Add posts_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'posts_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "posts_id" uuid REFERENCES "payload"."posts"("id") ON DELETE SET NULL;
        END IF;

        -- Add surveys_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'surveys_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "surveys_id" uuid REFERENCES "payload"."surveys"("id") ON DELETE SET NULL;
        END IF;

        -- Add survey_questions_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'survey_questions_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "survey_questions_id" uuid REFERENCES "payload"."survey_questions"("id") ON DELETE SET NULL;
        END IF;

        -- Add courses_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'courses_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "courses_id" uuid REFERENCES "payload"."courses"("id") ON DELETE SET NULL;
        END IF;

        -- Add course_lessons_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'course_lessons_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "course_lessons_id" uuid REFERENCES "payload"."course_lessons"("id") ON DELETE SET NULL;
        END IF;

        -- Add course_quizzes_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'course_quizzes_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "course_quizzes_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
        END IF;

        -- Add quiz_questions_id column
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents_rels' 
          AND column_name = 'quiz_questions_id'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents_rels"
          ADD COLUMN "quiz_questions_id" uuid REFERENCES "payload"."quiz_questions"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `)

    // Create indexes for media
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "payload"."media" USING btree ("filename");
    `)

    // Create the main collection tables if they don't exist
    // Create courses table first
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
        "featured_image_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "featured_image_id_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create course_quizzes table before course_lessons
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."course_quizzes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT,
        "slug" TEXT UNIQUE,
        "description" TEXT,
        "passing_score" INTEGER,
        "media_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Now create course_lessons table with references to both courses and course_quizzes
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
        "quiz_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,
        "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,
        "course_id" uuid REFERENCES "payload"."courses"("id") ON DELETE CASCADE,
        "course_id_id" uuid REFERENCES "payload"."courses"("id") ON DELETE CASCADE,
        "featured_image_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "featured_image_id_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "media_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create quiz_questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."quiz_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "question" TEXT,
        "options" JSONB,
        "correct_answer" TEXT,
        "type" TEXT,
        "explanation" TEXT,
        "order" INTEGER,
        "_order" INTEGER GENERATED ALWAYS AS ("order") STORED,
        "quiz_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,
        "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL,
        "media_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create quiz_questions_options table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_options" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "_order" integer,
        "order" integer,
        "_parent_id" uuid REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE,
        "text" varchar,
        "is_correct" boolean DEFAULT false,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for quiz_questions_options
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "quiz_questions_options_updated_at_idx" ON "payload"."quiz_questions_options" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "quiz_questions_options_created_at_idx" ON "payload"."quiz_questions_options" USING btree ("created_at");
    `)

    // Create surveys table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."surveys" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" TEXT,
        "slug" TEXT UNIQUE,
        "description" TEXT,
        "start_message" text,
        "end_message" text,
        "show_progress_bar" boolean DEFAULT true,
        "summary_content" jsonb,
        "status" varchar DEFAULT 'draft',
        "published_at" timestamp(3) with time zone,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create survey_questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."survey_questions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "question" TEXT,
        "options" JSONB,
        "text" varchar GENERATED ALWAYS AS ("question") STORED,
        "type" varchar DEFAULT 'text',
        "description" text,
        "required" boolean DEFAULT false,
        "category" varchar,
        "questionspin" integer,
        "position" integer,
        "order" INTEGER,
        "_order" INTEGER GENERATED ALWAYS AS ("order") STORED,
        "surveys_id" uuid REFERENCES "payload"."surveys"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Create survey_questions_options table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."survey_questions_options" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "_order" integer,
        "order" integer,
        "_parent_id" uuid REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE,
        "option" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for survey_questions_options
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "survey_questions_options_updated_at_idx" ON "payload"."survey_questions_options" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "survey_questions_options_created_at_idx" ON "payload"."survey_questions_options" USING btree ("created_at");
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
        "parent_id" uuid,
        "description" text,
        "order" numeric DEFAULT 0,
        "_order" numeric GENERATED ALWAYS AS ("order") STORED,
        "published_at" timestamp(3) with time zone,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for documentation
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "documentation_updated_at_idx" ON "payload"."documentation" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "documentation_created_at_idx" ON "payload"."documentation" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "documentation_slug_idx" ON "payload"."documentation" USING btree ("slug");
    `)

    // Create documentation_breadcrumbs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_breadcrumbs" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE CASCADE,
        "doc" uuid,
        "doc_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE CASCADE,
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

    // Create documentation_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_categories" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "parent_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE CASCADE,
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

    // Create documentation_tags table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."documentation_tags" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "parent_id" uuid REFERENCES "payload"."documentation"("id") ON DELETE CASCADE,
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

    // Create posts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "slug" varchar NOT NULL,
        "status" varchar DEFAULT 'draft',
        "content" jsonb,
        "description" text,
        "image_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "image_id_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "featured_image_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "featured_image_id_id" uuid REFERENCES "payload"."media"("id") ON DELETE SET NULL,
        "published_at" timestamp(3) with time zone,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for posts
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "payload"."posts" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "payload"."posts" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "payload"."posts" USING btree ("slug");
    `)

    // Create posts_categories table for the categories array field
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts_categories" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid REFERENCES "payload"."posts"("id") ON DELETE CASCADE,
        "category" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for posts_categories
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "posts_categories_updated_at_idx" ON "payload"."posts_categories" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "posts_categories_created_at_idx" ON "payload"."posts_categories" USING btree ("created_at");
    `)

    // Create posts_tags table for the tags array field
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."posts_tags" (
        "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
        "order" integer,
        "_order" integer,
        "_parent_id" uuid REFERENCES "payload"."posts"("id") ON DELETE CASCADE,
        "tag" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for posts_tags
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "posts_tags_updated_at_idx" ON "payload"."posts_tags" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "posts_tags_created_at_idx" ON "payload"."posts_tags" USING btree ("created_at");
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

    // Verify tables were created
    const tablesResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name IN ('courses', 'course_lessons', 'course_quizzes', 'quiz_questions', 'surveys', 'survey_questions',
                         'media', 'documentation', 'posts', 'quiz_questions_options', 'survey_questions_options',
                         'documentation_categories', 'documentation_tags', 'documentation_breadcrumbs',
                         'posts_categories', 'posts_tags');
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
    // Drop tables in reverse order to avoid foreign key constraints
    await db.execute(sql`
      -- Drop posts related tables
      DROP TABLE IF EXISTS "payload"."posts_tags";
      DROP TABLE IF EXISTS "payload"."posts_categories";
      DROP TABLE IF EXISTS "payload"."posts";

      -- Drop documentation related tables
      DROP TABLE IF EXISTS "payload"."documentation_breadcrumbs";
      DROP TABLE IF EXISTS "payload"."documentation_tags";
      DROP TABLE IF EXISTS "payload"."documentation_categories";
      DROP TABLE IF EXISTS "payload"."documentation";

      -- Drop survey related tables
      DROP TABLE IF EXISTS "payload"."survey_questions_options";
      DROP TABLE IF EXISTS "payload"."survey_questions";
      DROP TABLE IF EXISTS "payload"."surveys";

      -- Drop quiz related tables
      DROP TABLE IF EXISTS "payload"."quiz_questions_options";
      DROP TABLE IF EXISTS "payload"."quiz_questions";
      DROP TABLE IF EXISTS "payload"."course_lessons";
      DROP TABLE IF EXISTS "payload"."course_quizzes";

      -- Drop course related tables
      DROP TABLE IF EXISTS "payload"."courses";

      -- Drop media table
      DROP TABLE IF EXISTS "payload"."media";
    `)

    console.log('Base schema down migration completed successfully')
  } catch (error) {
    console.error('Error in base schema down migration:', error)
    throw error
  }
}
