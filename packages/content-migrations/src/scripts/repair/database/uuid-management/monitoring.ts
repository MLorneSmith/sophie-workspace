/**
 * UUID Table Runtime Monitoring
 * Creates PostgreSQL functions to manage UUID tables
 */
import pg from 'pg';

import { REQUIRED_COLUMNS } from './columns.js';

/**
 * Create monitoring system for UUID table management
 * Sets up PostgreSQL functions to help manage required columns for UUID tables
 *
 * @param client PostgreSQL client (should be in an active transaction)
 * @returns True if monitoring system was created successfully
 */
export async function createMonitoringSystem(
  client: pg.Client,
): Promise<boolean> {
  try {
    // Create tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS payload.uuid_table_monitor (
        id SERIAL PRIMARY KEY,
        table_name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        monitoring_status TEXT NOT NULL
      )
    `);

    // Create helpful UUID table scan view
    await client.query(`
      CREATE OR REPLACE VIEW payload.uuid_tables_scan AS 
      SELECT 
        t.table_name,
        COALESCE(
          (SELECT 'exists' FROM information_schema.columns c WHERE c.table_schema = 'payload' AND c.table_name = t.table_name AND c.column_name = 'id'), 
          'missing'
        ) as id_column,
        COALESCE(
          (SELECT 'exists' FROM information_schema.columns c WHERE c.table_schema = 'payload' AND c.table_name = t.table_name AND c.column_name = 'parent_id'), 
          'missing'
        ) as parent_id_column,
        COALESCE(
          (SELECT 'exists' FROM information_schema.columns c WHERE c.table_schema = 'payload' AND c.table_name = t.table_name AND c.column_name = 'path'), 
          'missing'
        ) as path_column,
        COALESCE(
          (SELECT 'exists' FROM information_schema.columns c WHERE c.table_schema = 'payload' AND c.table_name = t.table_name AND c.column_name = 'private_id'), 
          'missing'
        ) as private_id_column
      FROM (
        SELECT tablename as table_name
        FROM pg_tables
        WHERE schemaname = 'payload' AND (
          tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$' OR
          tablename LIKE '%\_rels' OR
          tablename IN ('downloads_rels', 'course_quizzes_rels', 'quiz_questions_rels')
        )
      ) t
    `);

    // Create UUID table fix function (normal function, not event trigger)
    const columnDefs = REQUIRED_COLUMNS.map(
      (col) =>
        `ADD COLUMN IF NOT EXISTS "${col.name}" ${col.dataType}${
          col.isNullable ? '' : ' NOT NULL'
        }`,
    ).join(',\n');

    await client.query(`
      CREATE OR REPLACE FUNCTION payload.fix_uuid_table(table_name TEXT)
      RETURNS VOID
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Add standard columns if they don't exist
        EXECUTE format('
          ALTER TABLE payload.%I 
          ${columnDefs}
        ', table_name);
        
        -- Log the operation
        INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
        VALUES (table_name, now(), 'manually_fixed');
      END;
      $$;
    `);

    // Create a batch repair function that can be called to repair all UUID tables at once
    await client.query(`
      CREATE OR REPLACE FUNCTION payload.fix_all_uuid_tables()
      RETURNS INTEGER
      LANGUAGE plpgsql
      AS $$
      DECLARE
        table_rec RECORD;
        fixed_count INTEGER := 0;
      BEGIN
        FOR table_rec IN 
          SELECT tablename AS table_name
          FROM pg_tables
          WHERE schemaname = 'payload' AND (
            tablename ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$' OR
            tablename LIKE '%\_rels' OR
            tablename IN ('downloads_rels', 'course_quizzes_rels', 'quiz_questions_rels')
          )
        LOOP
          PERFORM payload.fix_uuid_table(table_rec.table_name);
          fixed_count := fixed_count + 1;
        END LOOP;
        
        RETURN fixed_count;
      END;
      $$;
    `);

    // Log initialization in tracking table
    await client.query(`
      INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
      VALUES ('monitor_system', now(), 'initialized');
    `);

    // Execute the batch repair to fix all existing tables
    await client.query(`SELECT payload.fix_all_uuid_tables();`);

    return true;
  } catch (error) {
    console.error('Error creating UUID table management system:', error);
    return false;
  }
}

/**
 * Run the UUID table repair process (alternative to event triggers)
 * This can be called during migrations or as a scheduled task
 *
 * @param client PostgreSQL client
 * @returns Number of tables fixed
 */
export async function runUuidTableRepair(client: pg.Client): Promise<number> {
  try {
    // Check if the function exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'fix_all_uuid_tables' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'payload')
      ) as exists;
    `);

    // If function doesn't exist, create the monitoring system first
    if (!checkResult.rows[0].exists) {
      const created = await createMonitoringSystem(client);
      if (!created) {
        throw new Error('Failed to create monitoring system');
      }
    }

    // Run the repair
    const result = await client.query(
      `SELECT payload.fix_all_uuid_tables() as fixed_count;`,
    );
    return result.rows[0].fixed_count;
  } catch (error) {
    console.error('Error running UUID table repair:', error);
    return 0;
  }
}
