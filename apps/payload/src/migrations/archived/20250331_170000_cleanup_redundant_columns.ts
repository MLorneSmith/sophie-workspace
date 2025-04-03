import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Remove redundant quiz_id column from course_lessons table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'quiz_id'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        DROP COLUMN "quiz_id";
      END IF;
    END $$;

    -- Remove redundant parent column from documentation table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation' 
        AND column_name = 'parent'
      ) THEN
        ALTER TABLE "payload"."documentation"
        DROP COLUMN "parent";
      END IF;
    END $$;

    -- Remove redundant camelCase columns from various tables
    DO $$
    BEGIN
      -- Remove lessonNumber from course_lessons (since we have lesson_number)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'lessonNumber'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        DROP COLUMN "lessonNumber";
      END IF;

      -- Remove estimatedDuration from course_lessons (since we have estimated_duration)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'estimatedDuration'
      ) THEN
        ALTER TABLE "payload"."course_lessons"
        DROP COLUMN "estimatedDuration";
      END IF;

      -- Remove estimatedDuration from courses (since we have estimated_duration)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'estimatedDuration'
      ) THEN
        ALTER TABLE "payload"."courses"
        DROP COLUMN "estimatedDuration";
      END IF;

      -- Remove introContent from courses (since we have intro_content)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'introContent'
      ) THEN
        ALTER TABLE "payload"."courses"
        DROP COLUMN "introContent";
      END IF;

      -- Remove completionContent from courses (since we have completion_content)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'courses' 
        AND column_name = 'completionContent'
      ) THEN
        ALTER TABLE "payload"."courses"
        DROP COLUMN "completionContent";
      END IF;

      -- Remove isCorrect from quiz_questions_options (since we have is_correct)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions_options' 
        AND column_name = 'isCorrect'
      ) THEN
        ALTER TABLE "payload"."quiz_questions_options"
        DROP COLUMN "isCorrect";
      END IF;

      -- Remove startMessage from surveys (since we have start_message)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'startMessage'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "startMessage";
      END IF;

      -- Remove endMessage from surveys (since we have end_message)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'endMessage'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "endMessage";
      END IF;

      -- Remove summaryContent from surveys (since we have summary_content)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'summaryContent'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "summaryContent";
      END IF;

      -- Remove showProgressBar from surveys (since we have show_progress_bar)
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'showProgressBar'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "showProgressBar";
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Note: This down migration doesn't restore the columns because it would be complex
  // to restore the data. In a real-world scenario, you might want to implement a more
  // comprehensive down migration that restores both the columns and their data.
  await db.execute(sql`
    -- This down migration is intentionally left empty as restoring the columns
    -- would require also restoring their data, which is complex and potentially risky.
    -- If you need to restore these columns, it's recommended to restore from a backup
    -- or create a new migration that adds the columns back with appropriate default values.
  `)
}
