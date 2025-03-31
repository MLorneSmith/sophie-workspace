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

    -- Add quiz_id_id column to course_lessons table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'quiz_id_id'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "quiz_id_id" uuid;
        
        -- Copy data from quiz_id to quiz_id_id
        UPDATE "payload"."course_lessons"
        SET "quiz_id_id" = "quiz_id"
        WHERE "quiz_id" IS NOT NULL;
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
    
    -- Remove quiz_id_id column from course_lessons table
    ALTER TABLE IF EXISTS "payload"."course_lessons" 
    DROP COLUMN IF EXISTS "quiz_id_id";
  `)
}
