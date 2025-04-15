import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to fix missing columns in various tables
 *
 * This migration addresses additional column errors:
 * 1. column courses.content does not exist
 * 2. column course_quizzes.course_id_id does not exist
 * 3. column downloads__rels.order does not exist
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix for missing columns in various tables')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // 1. Fix courses.content column
    await db.execute(sql`
      ALTER TABLE payload.courses ADD COLUMN IF NOT EXISTS content JSONB;
    `)

    // 2. Fix course_quizzes.course_id_id column
    await db.execute(sql`
      ALTER TABLE payload.course_quizzes ADD COLUMN IF NOT EXISTS course_id_id TEXT;
    `)

    // 3. Fix downloads__rels.order column with individual statements
    await db.execute(sql`
      ALTER TABLE payload.documentation__downloads ADD COLUMN IF NOT EXISTS "order" INTEGER;
    `)
    await db.execute(sql`
      ALTER TABLE payload.posts__downloads ADD COLUMN IF NOT EXISTS "order" INTEGER;
    `)
    await db.execute(sql`
      ALTER TABLE payload.surveys__downloads ADD COLUMN IF NOT EXISTS "order" INTEGER;
    `)
    await db.execute(sql`
      ALTER TABLE payload.courses__downloads ADD COLUMN IF NOT EXISTS "order" INTEGER;
    `)
    await db.execute(sql`
      ALTER TABLE payload.course_lessons__downloads ADD COLUMN IF NOT EXISTS "order" INTEGER;
    `)
    await db.execute(sql`
      ALTER TABLE payload.course_quizzes__downloads ADD COLUMN IF NOT EXISTS "order" INTEGER;
    `)
    await db.execute(sql`
      ALTER TABLE payload.downloads_rels ADD COLUMN IF NOT EXISTS "order" INTEGER;
    `)

    // 4. Add path and order columns to all UUID tables
    await db.execute(
      sql.raw(`
      DO $$
      DECLARE
        uuid_table text;
      BEGIN
        FOR uuid_table IN 
          SELECT t.table_name
          FROM information_schema.tables t
          WHERE t.table_schema = 'payload'
          AND (
            t.table_name ~ '^[0-9a-f]{8}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{4}[-_][0-9a-f]{12}$'
            OR t.table_name ~ '^[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$'
          )
        LOOP
          -- Add required columns if they don't exist
          BEGIN
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS "order" INTEGER;', uuid_table);
            EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS "path" TEXT;', uuid_table);
            RAISE NOTICE 'Added columns to %', uuid_table;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error adding columns to %: %', uuid_table, SQLERRM;
          END;
        END LOOP;
      END
      $$;
      `),
    )

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully fixed missing columns')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error fixing missing columns:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back column fixes (not actually removing columns)')
  // We don't want to actually remove these columns as they might be required by the system
}
