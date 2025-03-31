import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Add _parent_id column to documentation_tags table if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation_tags' 
        AND column_name = '_parent_id'
      ) THEN
        ALTER TABLE "payload"."documentation_tags"
        ADD COLUMN "_parent_id" uuid;
        
        -- Copy data from parent_id to _parent_id
        UPDATE "payload"."documentation_tags"
        SET "_parent_id" = "parent_id"
        WHERE "parent_id" IS NOT NULL;
      END IF;
    END $$;
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(/* sql */ `
    -- Remove _parent_id column from documentation_tags table if it exists
    DO $$
    BEGIN
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'documentation_tags' 
        AND column_name = '_parent_id'
      ) THEN
        ALTER TABLE "payload"."documentation_tags"
        DROP COLUMN "_parent_id";
      END IF;
    END $$;
  `)
}
