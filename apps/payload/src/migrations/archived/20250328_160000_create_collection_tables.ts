import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create documentation table
    CREATE TABLE IF NOT EXISTS "payload"."documentation" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "status" payload.enum_documentation_status DEFAULT 'draft',
      "content" jsonb,
      "parent" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create documentation_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."documentation_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "documentation_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create posts table
    CREATE TABLE IF NOT EXISTS "payload"."posts" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "status" payload.enum_posts_status DEFAULT 'draft',
      "content" jsonb,
      "image_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create posts_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."posts_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create surveys table
    CREATE TABLE IF NOT EXISTS "payload"."surveys" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "status" payload.enum_surveys_status DEFAULT 'draft',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create surveys_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."surveys_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "survey_questions_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create survey_questions table
    CREATE TABLE IF NOT EXISTS "payload"."survey_questions" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "question" varchar NOT NULL,
      "type" payload.enum_survey_questions_type DEFAULT 'multiple_choice',
      "questionspin" payload.enum_survey_questions_questionspin,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create survey_questions_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."survey_questions_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create courses table
    CREATE TABLE IF NOT EXISTS "payload"."courses" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "status" payload.enum_courses_status DEFAULT 'draft',
      "description" text,
      "featured_image_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create courses_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."courses_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "course_lessons_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create course_lessons table
    CREATE TABLE IF NOT EXISTS "payload"."course_lessons" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "content" jsonb,
      "course_id" uuid,
      "quiz_id" uuid,
      "featured_image_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create course_lessons_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."course_lessons_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create course_quizzes table
    CREATE TABLE IF NOT EXISTS "payload"."course_quizzes" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" text,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create course_quizzes_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."course_quizzes_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "quiz_questions_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create quiz_questions table
    CREATE TABLE IF NOT EXISTS "payload"."quiz_questions" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "question" varchar NOT NULL,
      "type" payload.enum_quiz_questions_type DEFAULT 'multiple_choice',
      "quiz_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create quiz_questions_rels table for relationships
    CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_rels" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "_parent_id" uuid,
      "path" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create quiz_questions_options table for the options array field
    CREATE TABLE IF NOT EXISTS "payload"."quiz_questions_options" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "_order" integer,
      "_parent_id" uuid,
      "text" varchar,
      "is_correct" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for quiz_questions_options
    CREATE INDEX IF NOT EXISTS "quiz_questions_options_updated_at_idx" ON "payload"."quiz_questions_options" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "quiz_questions_options_created_at_idx" ON "payload"."quiz_questions_options" USING btree ("created_at");
    
    -- Create indexes for documentation
    CREATE INDEX IF NOT EXISTS "documentation_updated_at_idx" ON "payload"."documentation" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "documentation_created_at_idx" ON "payload"."documentation" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "documentation_slug_idx" ON "payload"."documentation" USING btree ("slug");
    
    -- Create indexes for posts
    CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "payload"."posts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "payload"."posts" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "payload"."posts" USING btree ("slug");
    
    -- Create indexes for surveys
    CREATE INDEX IF NOT EXISTS "surveys_updated_at_idx" ON "payload"."surveys" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "surveys_created_at_idx" ON "payload"."surveys" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "surveys_slug_idx" ON "payload"."surveys" USING btree ("slug");
    
    -- Create indexes for survey_questions
    CREATE INDEX IF NOT EXISTS "survey_questions_updated_at_idx" ON "payload"."survey_questions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "survey_questions_created_at_idx" ON "payload"."survey_questions" USING btree ("created_at");
    
    -- Create indexes for courses
    CREATE INDEX IF NOT EXISTS "courses_updated_at_idx" ON "payload"."courses" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "courses_created_at_idx" ON "payload"."courses" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "courses_slug_idx" ON "payload"."courses" USING btree ("slug");
    
    -- Create indexes for course_lessons
    CREATE INDEX IF NOT EXISTS "course_lessons_updated_at_idx" ON "payload"."course_lessons" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "course_lessons_created_at_idx" ON "payload"."course_lessons" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "course_lessons_slug_idx" ON "payload"."course_lessons" USING btree ("slug");
    
    -- Create indexes for course_quizzes
    CREATE INDEX IF NOT EXISTS "course_quizzes_updated_at_idx" ON "payload"."course_quizzes" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "course_quizzes_created_at_idx" ON "payload"."course_quizzes" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "course_quizzes_slug_idx" ON "payload"."course_quizzes" USING btree ("slug");
    
    -- Create indexes for quiz_questions
    CREATE INDEX IF NOT EXISTS "quiz_questions_updated_at_idx" ON "payload"."quiz_questions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "quiz_questions_created_at_idx" ON "payload"."quiz_questions" USING btree ("created_at");
    
    -- Add foreign key constraints
    ALTER TABLE "payload"."posts" 
    ADD CONSTRAINT "posts_image_id_fkey" 
    FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;
    
    ALTER TABLE "payload"."courses" 
    ADD CONSTRAINT "courses_featured_image_id_fkey" 
    FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;
    
    ALTER TABLE "payload"."course_lessons" 
    ADD CONSTRAINT "course_lessons_course_id_fkey" 
    FOREIGN KEY ("course_id") REFERENCES "payload"."courses"("id") ON DELETE SET NULL;
    
    ALTER TABLE "payload"."course_lessons" 
    ADD CONSTRAINT "course_lessons_quiz_id_fkey" 
    FOREIGN KEY ("quiz_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
    
    ALTER TABLE "payload"."course_lessons" 
    ADD CONSTRAINT "course_lessons_featured_image_id_fkey" 
    FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE SET NULL;
    
    ALTER TABLE "payload"."quiz_questions" 
    ADD CONSTRAINT "quiz_questions_quiz_id_fkey" 
    FOREIGN KEY ("quiz_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
    
    -- Add relationship constraints
    ALTER TABLE "payload"."documentation_rels" 
    ADD CONSTRAINT "documentation_rels_documentation_id_fkey" 
    FOREIGN KEY ("documentation_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."documentation_rels" 
    ADD CONSTRAINT "documentation_rels_parent_id_fkey" 
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."documentation"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."surveys_rels" 
    ADD CONSTRAINT "surveys_rels_survey_questions_id_fkey" 
    FOREIGN KEY ("survey_questions_id") REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."surveys_rels" 
    ADD CONSTRAINT "surveys_rels_parent_id_fkey" 
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."surveys"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."courses_rels" 
    ADD CONSTRAINT "courses_rels_course_lessons_id_fkey" 
    FOREIGN KEY ("course_lessons_id") REFERENCES "payload"."course_lessons"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."courses_rels" 
    ADD CONSTRAINT "courses_rels_parent_id_fkey" 
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."courses"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."course_quizzes_rels" 
    ADD CONSTRAINT "course_quizzes_rels_quiz_questions_id_fkey" 
    FOREIGN KEY ("quiz_questions_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."course_quizzes_rels" 
    ADD CONSTRAINT "course_quizzes_rels_parent_id_fkey" 
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."quiz_questions_rels" 
    ADD CONSTRAINT "quiz_questions_rels_parent_id_fkey" 
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."quiz_questions_options" 
    ADD CONSTRAINT "quiz_questions_options_parent_id_fkey" 
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."quiz_questions"("id") ON DELETE CASCADE;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop relationship constraints first
    ALTER TABLE IF EXISTS "payload"."documentation_rels" DROP CONSTRAINT IF EXISTS "documentation_rels_documentation_id_fkey";
    ALTER TABLE IF EXISTS "payload"."documentation_rels" DROP CONSTRAINT IF EXISTS "documentation_rels_parent_id_fkey";
    ALTER TABLE IF EXISTS "payload"."surveys_rels" DROP CONSTRAINT IF EXISTS "surveys_rels_survey_questions_id_fkey";
    ALTER TABLE IF EXISTS "payload"."surveys_rels" DROP CONSTRAINT IF EXISTS "surveys_rels_parent_id_fkey";
    ALTER TABLE IF EXISTS "payload"."courses_rels" DROP CONSTRAINT IF EXISTS "courses_rels_course_lessons_id_fkey";
    ALTER TABLE IF EXISTS "payload"."courses_rels" DROP CONSTRAINT IF EXISTS "courses_rels_parent_id_fkey";
    ALTER TABLE IF EXISTS "payload"."course_quizzes_rels" DROP CONSTRAINT IF EXISTS "course_quizzes_rels_quiz_questions_id_fkey";
    ALTER TABLE IF EXISTS "payload"."course_quizzes_rels" DROP CONSTRAINT IF EXISTS "course_quizzes_rels_parent_id_fkey";
    ALTER TABLE IF EXISTS "payload"."quiz_questions_rels" DROP CONSTRAINT IF EXISTS "quiz_questions_rels_parent_id_fkey";
    ALTER TABLE IF EXISTS "payload"."quiz_questions_options" DROP CONSTRAINT IF EXISTS "quiz_questions_options_parent_id_fkey";
    
    -- Drop foreign key constraints
    ALTER TABLE IF EXISTS "payload"."posts" DROP CONSTRAINT IF EXISTS "posts_image_id_fkey";
    ALTER TABLE IF EXISTS "payload"."courses" DROP CONSTRAINT IF EXISTS "courses_featured_image_id_fkey";
    ALTER TABLE IF EXISTS "payload"."course_lessons" DROP CONSTRAINT IF EXISTS "course_lessons_course_id_fkey";
    ALTER TABLE IF EXISTS "payload"."course_lessons" DROP CONSTRAINT IF EXISTS "course_lessons_quiz_id_fkey";
    ALTER TABLE IF EXISTS "payload"."course_lessons" DROP CONSTRAINT IF EXISTS "course_lessons_featured_image_id_fkey";
    ALTER TABLE IF EXISTS "payload"."quiz_questions" DROP CONSTRAINT IF EXISTS "quiz_questions_quiz_id_fkey";
    
    -- Drop tables in reverse order to avoid foreign key constraint issues
    DROP TABLE IF EXISTS "payload"."quiz_questions_options";
    DROP TABLE IF EXISTS "payload"."quiz_questions_rels";
    DROP TABLE IF EXISTS "payload"."quiz_questions";
    DROP TABLE IF EXISTS "payload"."course_quizzes_rels";
    DROP TABLE IF EXISTS "payload"."course_quizzes";
    DROP TABLE IF EXISTS "payload"."course_lessons_rels";
    DROP TABLE IF EXISTS "payload"."course_lessons";
    DROP TABLE IF EXISTS "payload"."courses_rels";
    DROP TABLE IF EXISTS "payload"."courses";
    DROP TABLE IF EXISTS "payload"."survey_questions_rels";
    DROP TABLE IF EXISTS "payload"."survey_questions";
    DROP TABLE IF EXISTS "payload"."surveys_rels";
    DROP TABLE IF EXISTS "payload"."surveys";
    DROP TABLE IF EXISTS "payload"."posts_rels";
    DROP TABLE IF EXISTS "payload"."posts";
    DROP TABLE IF EXISTS "payload"."documentation_rels";
    DROP TABLE IF EXISTS "payload"."documentation";
  `)
}
