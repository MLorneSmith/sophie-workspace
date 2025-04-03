import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add missing fields to course_lessons table
    ALTER TABLE "payload"."course_lessons"
    ADD COLUMN IF NOT EXISTS "description" text,
    ADD COLUMN IF NOT EXISTS "lessonNumber" numeric,
    ADD COLUMN IF NOT EXISTS "estimatedDuration" numeric,
    ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
    
    -- Add missing fields to surveys table
    ALTER TABLE "payload"."surveys"
    ADD COLUMN IF NOT EXISTS "description" text,
    ADD COLUMN IF NOT EXISTS "startMessage" jsonb,
    ADD COLUMN IF NOT EXISTS "endMessage" jsonb,
    ADD COLUMN IF NOT EXISTS "showProgressBar" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "summaryContent" jsonb,
    ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove added columns from course_lessons
    ALTER TABLE "payload"."course_lessons"
    DROP COLUMN IF EXISTS "description",
    DROP COLUMN IF EXISTS "lessonNumber",
    DROP COLUMN IF EXISTS "estimatedDuration",
    DROP COLUMN IF EXISTS "published_at";
    
    -- Remove added columns from surveys
    ALTER TABLE "payload"."surveys"
    DROP COLUMN IF EXISTS "description",
    DROP COLUMN IF EXISTS "startMessage",
    DROP COLUMN IF EXISTS "endMessage",
    DROP COLUMN IF EXISTS "showProgressBar",
    DROP COLUMN IF EXISTS "summaryContent",
    DROP COLUMN IF EXISTS "published_at";
  `)
}
