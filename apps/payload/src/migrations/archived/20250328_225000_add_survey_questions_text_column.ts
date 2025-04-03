import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add text column to survey_questions table that maps to question column
    ALTER TABLE "payload"."survey_questions"
    ADD COLUMN IF NOT EXISTS "text" varchar GENERATED ALWAYS AS ("question") STORED;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove text column from survey_questions table
    ALTER TABLE "payload"."survey_questions"
    DROP COLUMN IF EXISTS "text";
  `)
}
