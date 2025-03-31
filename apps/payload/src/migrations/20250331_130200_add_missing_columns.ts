import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Add explanation column to quiz_questions table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'explanation'
      ) THEN
        ALTER TABLE "payload"."quiz_questions"
        ADD COLUMN "explanation" text;
      END IF;
    END $$;

    -- Add order column to quiz_questions table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'order'
      ) THEN
        ALTER TABLE "payload"."quiz_questions"
        ADD COLUMN "order" numeric DEFAULT 0;
      END IF;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Remove explanation column from quiz_questions table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'explanation'
      ) THEN
        ALTER TABLE "payload"."quiz_questions"
        DROP COLUMN "explanation";
      END IF;
    END $$;

    -- Remove order column from quiz_questions table
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'quiz_questions' 
        AND column_name = 'order'
      ) THEN
        ALTER TABLE "payload"."quiz_questions"
        DROP COLUMN "order";
      END IF;
    END $$;
  `)
}
