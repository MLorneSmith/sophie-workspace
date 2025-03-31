import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add missing fields to posts table
    ALTER TABLE "payload"."posts"
    ADD COLUMN IF NOT EXISTS "description" text;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove added columns from posts table
    ALTER TABLE "payload"."posts"
    DROP COLUMN IF EXISTS "description";
  `)
}
