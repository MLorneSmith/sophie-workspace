import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Schema Creation Migration
 *
 * This migration creates the payload schema and the payload_migrations table.
 * The payload_migrations table is required for Payload to track which migrations have been run.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running schema creation migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create the payload schema if it doesn't exist
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS payload;
    `)

    // Set search path to include payload schema
    await db.execute(sql`
      SET search_path TO payload, public;
    `)

    // Create the payload_migrations table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.payload_migrations (
        id SERIAL PRIMARY KEY NOT NULL,
        name VARCHAR,
        batch NUMERIC,
        updated_at TIMESTAMP(3) WITH TIME ZONE DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP(3) WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      
      -- Create indexes for payload_migrations
      CREATE INDEX IF NOT EXISTS payload_migrations_updated_at_idx ON payload.payload_migrations USING btree (updated_at);
      CREATE INDEX IF NOT EXISTS payload_migrations_created_at_idx ON payload.payload_migrations USING btree (created_at);
    `)

    // Verify schema was created
    const schemaResult = await db.execute(sql`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name = 'payload';
    `)

    if (schemaResult.rows.length === 0) {
      throw new Error('Schema creation failed: payload schema not found')
    }

    // Verify payload_migrations table was created
    const tableResult = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'payload' AND table_name = 'payload_migrations';
    `)

    if (tableResult.rows.length === 0) {
      throw new Error('Schema creation failed: payload_migrations table not found')
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Schema creation migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in schema creation migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for schema creation')

  try {
    // Note: We're not dropping the schema as it might contain data from other migrations
    // that haven't been rolled back yet.
    console.log('Schema creation down migration completed successfully')
  } catch (error) {
    console.error('Error in schema creation down migration:', error)
    throw error
  }
}
