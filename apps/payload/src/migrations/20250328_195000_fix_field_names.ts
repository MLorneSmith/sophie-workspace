import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add fields with correct names to surveys table
    ALTER TABLE "payload"."surveys"
    ADD COLUMN IF NOT EXISTS "start_message" jsonb,
    ADD COLUMN IF NOT EXISTS "end_message" jsonb,
    ADD COLUMN IF NOT EXISTS "show_progress_bar" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "summary_content" jsonb,
    ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
    
    -- Add fields with correct names to course_lessons table
    ALTER TABLE "payload"."course_lessons"
    ADD COLUMN IF NOT EXISTS "lesson_number" numeric,
    ADD COLUMN IF NOT EXISTS "estimated_duration" numeric,
    ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
    
    -- Add fields with correct names to documentation table
    ALTER TABLE "payload"."documentation"
    ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
    
    -- Add fields with correct names to posts table
    ALTER TABLE "payload"."posts"
    ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove added columns from surveys table
    ALTER TABLE "payload"."surveys"
    DROP COLUMN IF EXISTS "start_message",
    DROP COLUMN IF EXISTS "end_message",
    DROP COLUMN IF EXISTS "show_progress_bar",
    DROP COLUMN IF EXISTS "summary_content",
    DROP COLUMN IF EXISTS "published_at";
    
    -- Remove added columns from course_lessons table
    ALTER TABLE "payload"."course_lessons"
    DROP COLUMN IF EXISTS "lesson_number",
    DROP COLUMN IF EXISTS "estimated_duration",
    DROP COLUMN IF EXISTS "published_at";
    
    -- Remove added columns from documentation table
    ALTER TABLE "payload"."documentation"
    DROP COLUMN IF EXISTS "published_at";
    
    -- Remove added columns from posts table
    ALTER TABLE "payload"."posts"
    DROP COLUMN IF EXISTS "published_at";
  `)
}
