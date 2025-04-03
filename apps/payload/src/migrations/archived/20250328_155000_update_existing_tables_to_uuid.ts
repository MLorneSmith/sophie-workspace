import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create temporary tables with UUID IDs
    CREATE TABLE IF NOT EXISTS "payload"."users_temp" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "email" varchar NOT NULL,
      "reset_password_token" varchar,
      "reset_password_expiration" timestamp(3) with time zone,
      "salt" varchar,
      "hash" varchar,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "payload"."media_temp" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "alt" varchar NOT NULL,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "focal_x" numeric,
      "focal_y" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "payload"."payload_preferences_temp" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "user" uuid,
      "key" varchar,
      "value" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "payload"."payload_preferences_rels_temp" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "parent_id" uuid,
      "path" varchar,
      "users_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents_temp" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "collection" varchar,
      "document_id" varchar,
      "lock_expiration" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents_rels_temp" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "order" integer,
      "parent_id" uuid,
      "path" varchar,
      "users_id" uuid,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS "payload"."payload_migrations_temp" (
      "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
      "name" varchar,
      "batch" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Copy data from existing tables to temporary tables
    -- Note: We're generating new UUIDs for all records
    INSERT INTO "payload"."users_temp" (
      "email", "reset_password_token", "reset_password_expiration", 
      "salt", "hash", "login_attempts", "lock_until", 
      "updated_at", "created_at"
    )
    SELECT 
      "email", "reset_password_token", "reset_password_expiration", 
      "salt", "hash", "login_attempts", "lock_until", 
      "updated_at", "created_at"
    FROM "payload"."users";
    
    INSERT INTO "payload"."media_temp" (
      "alt", "filename", "mime_type", "filesize", "width", "height", 
      "url", "thumbnail_u_r_l", "focal_x", "focal_y", 
      "updated_at", "created_at"
    )
    SELECT 
      "alt", "filename", "mime_type", "filesize", "width", "height", 
      "url", "thumbnail_u_r_l", "focal_x", "focal_y", 
      "updated_at", "created_at"
    FROM "payload"."media";
    
    -- Copy payload_preferences data
    INSERT INTO "payload"."payload_preferences_temp" (
      "key", "value", "updated_at", "created_at"
    )
    SELECT 
      "key", "value", "updated_at", "created_at"
    FROM "payload"."payload_preferences";
    
    -- Copy payload_migrations data
    INSERT INTO "payload"."payload_migrations_temp" (
      "name", "batch", "updated_at", "created_at"
    )
    SELECT 
      "name", "batch", "updated_at", "created_at"
    FROM "payload"."payload_migrations";
    
    -- Copy payload_locked_documents data
    INSERT INTO "payload"."payload_locked_documents_temp" (
      "collection", "document_id", "lock_expiration", "updated_at", "created_at"
    )
    SELECT 
      "collection", "document_id", "lock_expiration", "updated_at", "created_at"
    FROM "payload"."payload_locked_documents";
    
    -- Drop constraints from existing tables
    ALTER TABLE IF EXISTS "payload"."payload_preferences" DROP CONSTRAINT IF EXISTS "payload_preferences_user_fkey";
    ALTER TABLE IF EXISTS "payload"."payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_users_id_fkey";
    ALTER TABLE IF EXISTS "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_users_id_fkey";
    
    -- Drop existing tables
    DROP TABLE IF EXISTS "payload"."payload_preferences";
    DROP TABLE IF EXISTS "payload"."payload_preferences_rels";
    DROP TABLE IF EXISTS "payload"."payload_locked_documents";
    DROP TABLE IF EXISTS "payload"."payload_locked_documents_rels";
    DROP TABLE IF EXISTS "payload"."media";
    DROP TABLE IF EXISTS "payload"."users";
    DROP TABLE IF EXISTS "payload"."payload_migrations";
    
    -- Rename temporary tables to original names
    ALTER TABLE "payload"."users_temp" RENAME TO "users";
    ALTER TABLE "payload"."media_temp" RENAME TO "media";
    ALTER TABLE "payload"."payload_preferences_temp" RENAME TO "payload_preferences";
    ALTER TABLE "payload"."payload_preferences_rels_temp" RENAME TO "payload_preferences_rels";
    ALTER TABLE "payload"."payload_locked_documents_temp" RENAME TO "payload_locked_documents";
    ALTER TABLE "payload"."payload_locked_documents_rels_temp" RENAME TO "payload_locked_documents_rels";
    ALTER TABLE "payload"."payload_migrations_temp" RENAME TO "payload_migrations";
    
    -- Create indexes for users
    CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "payload"."users" USING btree ("email");
    
    -- Create indexes for media
    CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "payload"."media" USING btree ("filename");
    
    -- Create indexes for payload_preferences
    CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
    
    -- Create indexes for payload_preferences_rels
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_updated_at_idx" ON "payload"."payload_preferences_rels" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_created_at_idx" ON "payload"."payload_preferences_rels" USING btree ("created_at");
    
    -- Create indexes for payload_locked_documents
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
    
    -- Create indexes for payload_locked_documents_rels
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_updated_at_idx" ON "payload"."payload_locked_documents_rels" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_created_at_idx" ON "payload"."payload_locked_documents_rels" USING btree ("created_at");
    
    -- Create indexes for payload_migrations
    CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
    
    -- Add foreign key constraints
    ALTER TABLE "payload"."payload_preferences" 
    ADD CONSTRAINT "payload_preferences_user_fkey" 
    FOREIGN KEY ("user") REFERENCES "payload"."users"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."payload_preferences_rels" 
    ADD CONSTRAINT "payload_preferences_rels_users_id_fkey" 
    FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE CASCADE;
    
    ALTER TABLE "payload"."payload_locked_documents_rels" 
    ADD CONSTRAINT "payload_locked_documents_rels_users_id_fkey" 
    FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE CASCADE;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- This migration is not reversible as it changes the ID type from integer to UUID
    -- and generates new UUIDs for all records. Reverting would require the original IDs,
    -- which are lost in the migration.
    
    -- If you need to revert, you should restore from a backup taken before this migration.
  `)
}
