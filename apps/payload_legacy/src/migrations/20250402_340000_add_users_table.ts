import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add Users Table Migration
 *
 * This migration adds the users table required by Payload CMS.
 * Based on the structure from archived migrations.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running add users table migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create the users table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "reset_password_token" varchar,
        "reset_password_expiration" timestamp(3) with time zone,
        "salt" varchar,
        "hash" varchar,
        "login_attempts" numeric DEFAULT 0,
        "lock_until" timestamp(3) with time zone,
        "first_name" varchar,
        "last_name" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create the payload_preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."payload_preferences" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user" uuid REFERENCES "payload"."users"("id") ON DELETE CASCADE,
        "key" varchar,
        "value" jsonb,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create the payload_preferences_rels table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."payload_preferences_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order" integer,
        "parent_id" uuid,
        "path" varchar,
        "users_id" uuid REFERENCES "payload"."users"("id") ON DELETE CASCADE,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create the payload_locked_documents table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "collection" varchar,
        "document_id" varchar,
        "lock_expiration" timestamp(3) with time zone,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create the payload_locked_documents_rels table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payload"."payload_locked_documents_rels" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "order" integer,
        "parent_id" uuid,
        "path" varchar,
        "users_id" uuid REFERENCES "payload"."users"("id") ON DELETE CASCADE,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    `)

    // Create indexes for users
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "payload"."users" USING btree ("email");
    `)

    // Create indexes for payload_preferences
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
    `)

    // Create indexes for payload_preferences_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payload_preferences_rels_updated_at_idx" ON "payload"."payload_preferences_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "payload_preferences_rels_created_at_idx" ON "payload"."payload_preferences_rels" USING btree ("created_at");
    `)

    // Create indexes for payload_locked_documents
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
    `)

    // Create indexes for payload_locked_documents_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_updated_at_idx" ON "payload"."payload_locked_documents_rels" USING btree ("updated_at");
      CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_created_at_idx" ON "payload"."payload_locked_documents_rels" USING btree ("created_at");
    `)

    // Verify tables were created
    const tablesResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name IN ('users', 'payload_preferences', 'payload_preferences_rels', 'payload_locked_documents', 'payload_locked_documents_rels');
    `)

    console.log(`Verified ${tablesResult.rows.length} tables were created`)

    // Note: Admin user will be created in a separate migration using Payload's API
    // to ensure proper password hashing

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Add users table migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in add users table migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for add users table')

  try {
    // Drop tables in reverse order to avoid foreign key constraints
    await db.execute(sql`
      DROP TABLE IF EXISTS "payload"."payload_locked_documents_rels";
      DROP TABLE IF EXISTS "payload"."payload_locked_documents";
      DROP TABLE IF EXISTS "payload"."payload_preferences_rels";
      DROP TABLE IF EXISTS "payload"."payload_preferences";
      DROP TABLE IF EXISTS "payload"."users";
    `)

    console.log('Add users table down migration completed successfully')
  } catch (error) {
    console.error('Error in add users table down migration:', error)
    throw error
  }
}
