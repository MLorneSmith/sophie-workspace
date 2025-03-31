import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add parent_id column to users table if it doesn't exist
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'users' 
        AND column_name = 'parent_id'
      ) THEN
        ALTER TABLE "payload"."users" ADD COLUMN "parent_id" uuid DEFAULT NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Do nothing in down migration to avoid data loss
  `)
}
