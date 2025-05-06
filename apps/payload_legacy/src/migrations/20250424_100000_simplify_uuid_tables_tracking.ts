import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to simplify UUID tables tracking function')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Simplify the function to only use the correct schema
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.safe_insert_into_uuid_tables_tracking(p_table_name TEXT) RETURNS void AS $$
      BEGIN
        -- Insert using only the correct schema
        EXECUTE format('
          INSERT INTO payload.dynamic_uuid_tables (table_name, primary_key, created_at, needs_path_column)
          VALUES (%L, ''parent_id'', NOW(), TRUE)
          ON CONFLICT (table_name)
          DO UPDATE SET created_at = NOW(), needs_path_column = TRUE', 
          p_table_name);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error tracking UUID table %: %', p_table_name, SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully simplified UUID tables tracking function')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error simplifying UUID tables tracking function:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // No need for down migration as we're just simplifying the function
  console.log('This migration has no down path as it only simplifies an existing function')
}
