import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create survey_questions_options table for the options array field in SurveyQuestions collection
    CREATE TABLE IF NOT EXISTS "payload"."survey_questions_options" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "_order" integer,
      "_parent_id" uuid,
      "option" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for survey_questions_options
    CREATE INDEX IF NOT EXISTS "survey_questions_options_updated_at_idx" ON "payload"."survey_questions_options" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "survey_questions_options_created_at_idx" ON "payload"."survey_questions_options" USING btree ("created_at");
    
    -- Add foreign key constraint
    ALTER TABLE "payload"."survey_questions_options" 
    ADD CONSTRAINT "survey_questions_options_parent_id_fkey" 
    FOREIGN KEY ("_parent_id") REFERENCES "payload"."survey_questions"("id") ON DELETE CASCADE;
    
    -- Add missing fields to survey_questions table
    ALTER TABLE "payload"."survey_questions"
    ADD COLUMN IF NOT EXISTS "description" text,
    ADD COLUMN IF NOT EXISTS "required" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "category" varchar,
    ADD COLUMN IF NOT EXISTS "position" numeric DEFAULT 0;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop foreign key constraints
    ALTER TABLE IF EXISTS "payload"."survey_questions_options" DROP CONSTRAINT IF EXISTS "survey_questions_options_parent_id_fkey";
    
    -- Drop tables
    DROP TABLE IF EXISTS "payload"."survey_questions_options";
    
    -- Remove added columns from survey_questions
    ALTER TABLE "payload"."survey_questions"
    DROP COLUMN IF EXISTS "description",
    DROP COLUMN IF EXISTS "required",
    DROP COLUMN IF EXISTS "category",
    DROP COLUMN IF EXISTS "position";
  `)
}
