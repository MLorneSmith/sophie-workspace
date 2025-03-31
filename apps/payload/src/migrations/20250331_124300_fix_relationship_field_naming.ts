import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Fix quiz_id in quiz_questions table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'quiz_id_id'
      ) THEN
        ALTER TABLE "payload"."quiz_questions"
        ADD COLUMN "quiz_id_id" uuid;
        
        -- Only try to copy data if the quiz_id column exists
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions' 
          AND column_name = 'quiz_id'
        ) THEN
          UPDATE "payload"."quiz_questions"
          SET "quiz_id_id" = "quiz_id"
          WHERE "quiz_id" IS NOT NULL;
        END IF;
      END IF;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Remove quiz_id_id from quiz_questions table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'quiz_id_id'
      ) THEN
        ALTER TABLE "payload"."quiz_questions"
        DROP COLUMN "quiz_id_id";
      END IF;
    END $$;
  `)
}
