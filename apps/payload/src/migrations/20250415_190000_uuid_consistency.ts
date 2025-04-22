import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * UUID Consistency Migration
 *
 * This migration adds a helper function for safe UUID comparison and
 * ensures the downloads table uses UUID type consistently.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running UUID consistency migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Create safe UUID comparison function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.safe_id_compare(id1 anyelement, id2 anyelement)
      RETURNS boolean AS $$
      BEGIN
        IF id1 IS NULL OR id2 IS NULL THEN
          RETURN FALSE;
        END IF;
        BEGIN
          RETURN CASE
            WHEN pg_typeof(id1) = 'uuid'::regtype AND pg_typeof(id2) = 'text'::regtype
              THEN id1 = id2::uuid
            WHEN pg_typeof(id1) = 'text'::regtype AND pg_typeof(id2) = 'uuid'::regtype
              THEN id1::uuid = id2
            ELSE id1::text = id2::text
          END;
        EXCEPTION WHEN others THEN
          -- Fallback to text comparison if UUID casting fails
          RETURN id1::text = id2::text;
        END;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `)

    // Convert downloads table id column to UUID if it exists
    // Check if the table exists first
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads'
      );
    `)

    if (tableExists.rows[0].exists) {
      await db.execute(sql`
        ALTER TABLE payload.downloads
        ALTER COLUMN id TYPE uuid USING id::uuid;
      `)
      console.log('Downloads table id column converted to UUID type')
    } else {
      console.log('Downloads table not found, skipping column type conversion')
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('UUID consistency migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in UUID consistency migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for UUID consistency')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Drop the function we created
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.safe_id_compare;
    `)

    // Note: We're not converting the downloads table back to TEXT as it would be complex
    // and potentially lose data. In a down migration scenario, the table would likely
    // get recreated anyway.

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('UUID consistency down migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in UUID consistency down migration:', error)
    throw error
  }
}
