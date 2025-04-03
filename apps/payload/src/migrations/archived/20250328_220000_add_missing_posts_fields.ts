import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add missing fields to posts table
    ALTER TABLE "payload"."posts"
    ADD COLUMN IF NOT EXISTS "description" text;

    -- Add published_at column to posts table
    ALTER TABLE "payload"."posts"
    ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove added columns from posts table
    ALTER TABLE "payload"."posts"
    DROP COLUMN IF EXISTS "description";
    
    -- Remove published_at column from posts table
    ALTER TABLE "payload"."posts"
    DROP COLUMN IF EXISTS "published_at";
  `)
}
