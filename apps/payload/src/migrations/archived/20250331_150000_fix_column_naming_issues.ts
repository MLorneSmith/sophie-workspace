import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Fix documentation_breadcrumbs.doc_id
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation_breadcrumbs' 
        AND column_name = 'doc_id'
      ) THEN
        ALTER TABLE "payload"."documentation_breadcrumbs"
        ADD COLUMN "doc_id" uuid;
        
        -- Copy data from doc to doc_id
        UPDATE "payload"."documentation_breadcrumbs"
        SET "doc_id" = "doc"
        WHERE "doc" IS NOT NULL;
      END IF;
    END $$;

    -- Fix courses.show_progress_bar
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'show_progress_bar'
      ) THEN
        ALTER TABLE "payload"."courses"
        ADD COLUMN "show_progress_bar" boolean DEFAULT true;
      END IF;
    END $$;

    -- Fix course_lessons.course_id_id
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'course_id_id'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "course_id_id" uuid;
        
        -- Copy data from course_id to course_id_id
        UPDATE "payload"."course_lessons"
        SET "course_id_id" = "course_id"
        WHERE "course_id" IS NOT NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove doc_id column from documentation_breadcrumbs
    ALTER TABLE IF EXISTS "payload"."documentation_breadcrumbs" 
    DROP COLUMN IF EXISTS "doc_id";
    
    -- Remove show_progress_bar column from courses
    ALTER TABLE IF EXISTS "payload"."courses" 
    DROP COLUMN IF EXISTS "show_progress_bar";
    
    -- Remove course_id_id column from course_lessons
    ALTER TABLE IF EXISTS "payload"."course_lessons" 
    DROP COLUMN IF EXISTS "course_id_id";
  `)
}
