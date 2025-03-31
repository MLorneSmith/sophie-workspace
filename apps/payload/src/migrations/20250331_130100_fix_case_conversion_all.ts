import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Fix endMessage in surveys table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'end_message'
      ) THEN
        ALTER TABLE "payload"."surveys"
        ADD COLUMN "end_message" jsonb;
        
        -- Copy data from endMessage to end_message
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys' 
          AND column_name = 'endMessage'
        ) THEN
          UPDATE "payload"."surveys"
          SET "end_message" = "endMessage"
          WHERE "endMessage" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix introContent in courses table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'intro_content'
      ) THEN
        ALTER TABLE "payload"."courses"
        ADD COLUMN "intro_content" jsonb;
        
        -- Copy data from introContent to intro_content
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'courses' 
          AND column_name = 'introContent'
        ) THEN
          UPDATE "payload"."courses"
          SET "intro_content" = "introContent"
          WHERE "introContent" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix completionContent in courses table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'completion_content'
      ) THEN
        ALTER TABLE "payload"."courses"
        ADD COLUMN "completion_content" jsonb;
        
        -- Copy data from completionContent to completion_content
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'courses' 
          AND column_name = 'completionContent'
        ) THEN
          UPDATE "payload"."courses"
          SET "completion_content" = "completionContent"
          WHERE "completionContent" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix lessonNumber in course_lessons table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'lesson_number'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        ADD COLUMN "lesson_number" numeric;
        
        -- Copy data from lessonNumber to lesson_number
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons' 
          AND column_name = 'lessonNumber'
        ) THEN
          UPDATE "payload"."course_lessons"
          SET "lesson_number" = "lessonNumber"
          WHERE "lessonNumber" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix summaryContent in surveys table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'summary_content'
      ) THEN
        ALTER TABLE "payload"."surveys"
        ADD COLUMN "summary_content" jsonb;
        
        -- Copy data from summaryContent to summary_content
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys' 
          AND column_name = 'summaryContent'
        ) THEN
          UPDATE "payload"."surveys"
          SET "summary_content" = "summaryContent"
          WHERE "summaryContent" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix showProgressBar in surveys table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'show_progress_bar'
      ) THEN
        ALTER TABLE "payload"."surveys"
        ADD COLUMN "show_progress_bar" boolean DEFAULT true;
        
        -- Copy data from showProgressBar to show_progress_bar
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys' 
          AND column_name = 'showProgressBar'
        ) THEN
          UPDATE "payload"."surveys"
          SET "show_progress_bar" = "showProgressBar"
          WHERE "showProgressBar" IS NOT NULL;
        END IF;
      END IF;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Remove end_message from surveys table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'end_message'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "end_message";
      END IF;
    END $$;

    -- Remove intro_content from courses table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'intro_content'
      ) THEN
        ALTER TABLE "payload"."courses"
        DROP COLUMN "intro_content";
      END IF;
    END $$;

    -- Remove completion_content from courses table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'completion_content'
      ) THEN
        ALTER TABLE "payload"."courses"
        DROP COLUMN "completion_content";
      END IF;
    END $$;

    -- Remove lesson_number from course_lessons table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'lesson_number'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        DROP COLUMN "lesson_number";
      END IF;
    END $$;

    -- Remove summary_content from surveys table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'summary_content'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "summary_content";
      END IF;
    END $$;

    -- Remove show_progress_bar from surveys table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'show_progress_bar'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "show_progress_bar";
      END IF;
    END $$;
  `)
}
