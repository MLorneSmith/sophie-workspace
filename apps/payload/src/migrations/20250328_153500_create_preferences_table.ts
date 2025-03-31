import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create payload_preferences table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "payload"."payload_preferences" (
      "id" serial PRIMARY KEY NOT NULL,
      "user" integer,
      "key" varchar,
      "value" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for payload_preferences
    CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
    
    -- Create payload_preferences_rels table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "payload"."payload_preferences_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer,
      "path" varchar,
      "users_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for payload_preferences_rels
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_updated_at_idx" ON "payload"."payload_preferences_rels" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_preferences_rels_created_at_idx" ON "payload"."payload_preferences_rels" USING btree ("created_at");
    
    -- Create payload_locked_documents table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents" (
      "id" serial PRIMARY KEY NOT NULL,
      "collection" varchar,
      "document_id" varchar,
      "lock_expiration" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for payload_locked_documents
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
    
    -- Create payload_locked_documents_rels table if it doesn't exist
    CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer,
      "path" varchar,
      "users_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create indexes for payload_locked_documents_rels
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_updated_at_idx" ON "payload"."payload_locked_documents_rels" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_created_at_idx" ON "payload"."payload_locked_documents_rels" USING btree ("created_at");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "payload"."payload_preferences" CASCADE;
    DROP TABLE "payload"."payload_preferences_rels" CASCADE;
    DROP TABLE "payload"."payload_locked_documents" CASCADE;
    DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  `)
}
