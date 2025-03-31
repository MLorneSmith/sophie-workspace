import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Fix startMessage in surveys table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'start_message'
      ) THEN
        ALTER TABLE "payload"."surveys"
        ADD COLUMN "start_message" jsonb;
        
        -- Only try to copy data if the startMessage column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'surveys' 
          AND column_name = 'startMessage'
        ) THEN
          UPDATE "payload"."surveys"
          SET "start_message" = "startMessage"
          WHERE "startMessage" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix passingScore in course_quizzes table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes' 
        AND column_name = 'passing_score'
      ) THEN
        ALTER TABLE "payload"."course_quizzes"
        ADD COLUMN "passing_score" integer DEFAULT 70;
        
        -- Only try to copy data if the passingScore column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes' 
          AND column_name = 'passingScore'
        ) THEN
          UPDATE "payload"."course_quizzes"
          SET "passing_score" = "passingScore"
          WHERE "passingScore" IS NOT NULL;
        END IF;
      END IF;
    END $$;

    -- Fix isCorrect in quiz_questions_options table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions_options' 
        AND column_name = 'is_correct'
      ) THEN
        ALTER TABLE "payload"."quiz_questions_options"
        ADD COLUMN "is_correct" boolean DEFAULT false;
        
        -- Only try to copy data if the isCorrect column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_options' 
          AND column_name = 'isCorrect'
        ) THEN
          UPDATE "payload"."quiz_questions_options"
          SET "is_correct" = "isCorrect"
          WHERE "isCorrect" IS NOT NULL;
        END IF;
      END IF;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Remove start_message from surveys table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'surveys' 
        AND column_name = 'start_message'
      ) THEN
        ALTER TABLE "payload"."surveys"
        DROP COLUMN "start_message";
      END IF;
    END $$;

    -- Remove passing_score from course_quizzes table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_quizzes' 
        AND column_name = 'passing_score'
      ) THEN
        ALTER TABLE "payload"."course_quizzes"
        DROP COLUMN "passing_score";
      END IF;
    END $$;

    -- Remove is_correct from quiz_questions_options table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions_options' 
        AND column_name = 'is_correct'
      ) THEN
        ALTER TABLE "payload"."quiz_questions_options"
        DROP COLUMN "is_correct";
      END IF;
    END $$;
  `)
}
