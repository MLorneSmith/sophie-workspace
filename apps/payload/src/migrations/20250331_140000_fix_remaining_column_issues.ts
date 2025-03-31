import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Fix documentation_breadcrumbs._parent_id
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation_breadcrumbs' 
        AND column_name = '_parent_id'
      ) THEN
        ALTER TABLE "payload"."documentation_breadcrumbs"
        ADD COLUMN "_parent_id" uuid;
        
        -- Copy data from parent to _parent_id
        UPDATE "payload"."documentation_breadcrumbs"
        SET "_parent_id" = "parent"
        WHERE "parent" IS NOT NULL;
      END IF;
    END $$;

    -- Fix courses.estimated_duration
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'estimated_duration'
      ) THEN
        ALTER TABLE "payload"."courses"
        ADD COLUMN "estimated_duration" numeric;
        
        -- Copy data from estimatedDuration to estimated_duration
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'courses' 
          AND column_name = 'estimatedDuration'
        ) THEN
          UPDATE "payload"."courses"
          SET "estimated_duration" = "estimatedDuration"
          WHERE "estimatedDuration" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix course_lessons.estimated_duration
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'estimated_duration'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "estimated_duration" numeric;
        
        -- Copy data from estimatedDuration to estimated_duration
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons' 
          AND column_name = 'estimatedDuration'
        ) THEN
          UPDATE "payload"."course_lessons"
          SET "estimated_duration" = "estimatedDuration"
          WHERE "estimatedDuration" IS NOT NULL;
        END IF;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove _parent_id column from documentation_breadcrumbs
    ALTER TABLE IF EXISTS "payload"."documentation_breadcrumbs" 
    DROP COLUMN IF EXISTS "_parent_id";
    
    -- Remove estimated_duration column from courses
    ALTER TABLE IF EXISTS "payload"."courses" 
    DROP COLUMN IF EXISTS "estimated_duration";
    
    -- Remove estimated_duration column from course_lessons
    ALTER TABLE IF EXISTS "payload"."course_lessons" 
    DROP COLUMN IF EXISTS "estimated_duration";
  `)
}
