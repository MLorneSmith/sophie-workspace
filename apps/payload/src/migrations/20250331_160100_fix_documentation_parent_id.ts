import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add parent_id column to documentation table
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation' 
        AND column_name = 'parent_id'
      ) THEN
        ALTER TABLE "payload"."documentation"
        ADD COLUMN "parent_id" uuid;
        
        -- Copy data from parent to parent_id
        UPDATE "payload"."documentation"
        SET "parent_id" = "parent"
        WHERE "parent" IS NOT NULL;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove parent_id column from documentation table
    ALTER TABLE IF EXISTS "payload"."documentation" 
    DROP COLUMN IF EXISTS "parent_id";
  `)
}
