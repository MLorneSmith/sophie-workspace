import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Installing UUID table tracking system')

  try {
    // Begin transaction
    await db.execute(sql`BEGIN`)

    // Create monitoring table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.uuid_table_monitor (
        id SERIAL PRIMARY KEY,
        table_name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        monitoring_status TEXT NOT NULL
      )
    `)

    // Create helpful UUID table scan view
    await db.execute(sql`
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
    `)

    // Create UUID table fix function (normal function, not event trigger)
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.fix_uuid_table(table_name TEXT)
      RETURNS VOID
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Add standard columns if they don't exist
        EXECUTE format('
          ALTER TABLE payload.%I 
          ADD COLUMN IF NOT EXISTS id text,
          ADD COLUMN IF NOT EXISTS parent_id text,
          ADD COLUMN IF NOT EXISTS path text,
          ADD COLUMN IF NOT EXISTS private_id text,
          ADD COLUMN IF NOT EXISTS "order" integer,
          ADD COLUMN IF NOT EXISTS course_id text,
          ADD COLUMN IF NOT EXISTS course_lessons_id text,
          ADD COLUMN IF NOT EXISTS course_quizzes_id text
        ', table_name);
        
        -- Log the operation
        INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
        VALUES (table_name, now(), 'manually_fixed');
      END;
      $$;
    `)

    // Log initialization in monitor table
    await db.execute(sql`
      INSERT INTO payload.uuid_table_monitor(table_name, created_at, monitoring_status)
      VALUES ('monitor_system', NOW(), 'initialized_by_migration')
    `)

    // Create a batch repair function that can be called to repair all UUID tables at once
    await db.execute(sql`
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
    `)

    // Commit transaction
    await db.execute(sql`COMMIT`)

    console.log('UUID table tracking system installed successfully')
  } catch (error) {
    // Rollback transaction on error
    await db.execute(sql`ROLLBACK`)
    console.error('Error installing UUID table tracking system:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Removing UUID table tracking system')

  try {
    // Drop monitoring functions
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.fix_all_uuid_tables();
      DROP FUNCTION IF EXISTS payload.fix_uuid_table(TEXT);
      DROP VIEW IF EXISTS payload.uuid_tables_scan;
    `)

    // Don't drop the monitoring table to preserve history
    console.log('UUID table functions and views removed')
    console.log('Monitoring table preserved for historical records')

    console.log('UUID table tracking system removed successfully')
  } catch (error) {
    console.error('Error removing UUID table tracking system:', error)
    throw error
  }
}
