import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add published_at column to documentation table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation' 
        AND column_name = 'published_at'
      ) THEN
        ALTER TABLE "payload"."documentation"
        ADD COLUMN "published_at" timestamp with time zone;
      END IF;
    END $$;

    -- Add published_at column to courses table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'published_at'
      ) THEN
        ALTER TABLE "payload"."courses"
        ADD COLUMN "published_at" timestamp with time zone;
      END IF;
    END $$;

    -- Fix quiz_id column in course_lessons table
    DO $$
    BEGIN
      -- Check if quiz_id_id column exists
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'quiz_id_id'
      ) THEN
        -- If quiz_id_id exists, drop it and rename quiz_id to quiz_id_id
        ALTER TABLE "payload"."course_lessons"
        DROP COLUMN "quiz_id_id";
      END IF;
      
      -- Ensure quiz_id column exists
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'quiz_id'
      ) THEN
        -- If quiz_id doesn't exist, create it
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "quiz_id" uuid;
      END IF;
      
      -- Update foreign key constraint if needed
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'course_lessons_quiz_id_fkey'
        AND table_schema = 'payload'
        AND table_name = 'course_lessons'
      ) THEN
        -- Add foreign key constraint
        ALTER TABLE "payload"."course_lessons"
        ADD CONSTRAINT "course_lessons_quiz_id_fkey"
        FOREIGN KEY ("quiz_id") REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove published_at column from documentation table
    ALTER TABLE IF EXISTS "payload"."documentation" 
    DROP COLUMN IF EXISTS "published_at";
    
    -- Remove published_at column from courses table
    ALTER TABLE IF EXISTS "payload"."courses" 
    DROP COLUMN IF EXISTS "published_at";
    
    -- Remove foreign key constraint if it exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'course_lessons_quiz_id_fkey'
        AND table_schema = 'payload'
        AND table_name = 'course_lessons'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        DROP CONSTRAINT "course_lessons_quiz_id_fkey";
      END IF;
    END $$;
  `)
}
