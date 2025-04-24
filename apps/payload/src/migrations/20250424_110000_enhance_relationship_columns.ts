import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to enhance relationship columns management')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    await db.execute(sql`
    CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns()
    RETURNS void AS $$
    DECLARE
      rel_table TEXT;
    BEGIN
      -- Loop through all relationship tables
      FOR rel_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name LIKE '%_rels'
        AND table_type = 'BASE TABLE'
      LOOP
        -- Try to convert columns if they exist but with wrong type
        BEGIN
          EXECUTE format('
            ALTER TABLE payload.%I 
            ALTER COLUMN courses_id TYPE UUID USING courses_id::uuid,
            ALTER COLUMN course_lessons_id TYPE UUID USING course_lessons_id::uuid,
            ALTER COLUMN course_quizzes_id TYPE UUID USING course_quizzes_id::uuid
          ', rel_table);
        EXCEPTION WHEN OTHERS THEN
          -- If conversion fails, try adding the columns
          BEGIN
            EXECUTE format('
              ALTER TABLE payload.%I 
              ADD COLUMN IF NOT EXISTS courses_id UUID,
              ADD COLUMN IF NOT EXISTS course_lessons_id UUID,
              ADD COLUMN IF NOT EXISTS course_quizzes_id UUID
            ', rel_table);
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error ensuring columns for table %: %', rel_table, SQLERRM;
          END;
        END;
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Execute the function
    SELECT payload.ensure_relationship_columns();
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Enhanced relationship columns management')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error enhancing relationship columns management:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back relationship columns management enhancement')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    await db.execute(sql`
    DROP FUNCTION IF EXISTS payload.ensure_relationship_columns();
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Removed relationship columns management function')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error removing relationship columns management function:', error)
    throw error
  }
}
