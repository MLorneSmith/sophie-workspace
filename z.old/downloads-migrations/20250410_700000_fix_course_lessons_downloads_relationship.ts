import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to fix the relationship naming between course lessons and downloads
 *
 * This fixes the naming convention for the relationship table between course lessons and downloads
 * to match Payload CMS's expected structure.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // First, check if our previous relationship table exists
    const oldTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload'
        AND table_name = 'course_lessons_downloads_rels'
      ) as exists;
    `)
    // Type assertion for exists check
    const oldTableExistsValue = (oldTableExists.rows[0] as { exists: boolean }).exists

    // Check if we have data in the old table that needs to be migrated
    let hasOldData = false
    if (oldTableExistsValue) {
      const oldDataQuery = await db.execute(sql`
        SELECT COUNT(*) as count FROM payload.course_lessons_downloads_rels;
      `)
      // Type assertion to handle the unknown type from db.execute
      hasOldData = (oldDataQuery.rows[0] as { count: number }).count > 0
    }

    // Create a new correctly named relationship table with Payload's expected column structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.course_lessons__downloads (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        order_column INTEGER,
        parent_id TEXT NOT NULL,
        related_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Add proper indices for efficient querying
    await db.execute(sql`
      DO $$
      BEGIN
        -- Index for parent_id (course_lesson)
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'course_lessons__downloads'
          AND indexname = 'course_lessons__downloads_parent_id_idx'
        ) THEN
          CREATE INDEX course_lessons__downloads_parent_id_idx 
          ON payload.course_lessons__downloads(parent_id);
        END IF;

        -- Index for related_id (download)
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'course_lessons__downloads'
          AND indexname = 'course_lessons__downloads_related_id_idx'
        ) THEN
          CREATE INDEX course_lessons__downloads_related_id_idx 
          ON payload.course_lessons__downloads(related_id);
        END IF;
      END
      $$;
    `)

    // If the old table exists and has data, migrate the data to the new table
    if (hasOldData) {
      await db.execute(sql`
        INSERT INTO payload.course_lessons__downloads (
          id, 
          order_column, 
          parent_id, 
          related_id, 
          created_at, 
          updated_at
        )
        SELECT 
          id::text, 
          order_column, 
          parent_id, 
          downloads_id, 
          created_at, 
          updated_at
        FROM 
          payload.course_lessons_downloads_rels
        WHERE
          downloads_id IS NOT NULL;
      `)
    }

    // Drop the old table if it exists
    if (oldTableExistsValue) {
      await db.execute(sql`
        DROP TABLE payload.course_lessons_downloads_rels;
      `)
    }

    // Update any direct downloads_id column on course_lessons if it exists
    const hasDownloadsIdColumn = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload'
        AND table_name = 'course_lessons'
        AND column_name = 'downloads_id'
      ) as exists;
    `)
    const hasDownloadsIdColumnValue = (hasDownloadsIdColumn.rows[0] as { exists: boolean }).exists

    if (hasDownloadsIdColumnValue) {
      // Check if any lessons have a direct downloads_id we should migrate
      const lessonsWithDownloads = await db.execute(sql`
        SELECT id, downloads_id 
        FROM payload.course_lessons 
        WHERE downloads_id IS NOT NULL;
      `)

      // Insert relationships for any direct downloads_id references
      if (lessonsWithDownloads.rows.length > 0) {
        for (const row of lessonsWithDownloads.rows) {
          await db.execute(sql`
            INSERT INTO payload.course_lessons__downloads (
              parent_id, 
              related_id, 
              order_column
            ) VALUES (
              ${row.id}, 
              ${row.downloads_id}, 
              0
            )
            ON CONFLICT DO NOTHING;
          `)
        }
      }

      // Drop the now migrated column
      await db.execute(sql`
        ALTER TABLE payload.course_lessons DROP COLUMN downloads_id;
      `)
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Migration completed: Fixed relationship between course lessons and downloads')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in course_lessons-downloads relationship fix migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Check if the relationship table exists before trying to drop it
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload'
        AND table_name = 'course_lessons__downloads'
      ) as exists;
    `)
    const tableExistsValue = (tableExists.rows[0] as { exists: boolean }).exists

    if (tableExistsValue) {
      // Drop the relationship table
      await db.execute(sql`
        DROP TABLE payload.course_lessons__downloads;
      `)
    }

    // Re-create the original table structure
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.course_lessons_downloads_rels (
        id SERIAL PRIMARY KEY,
        order_column INTEGER,
        parent_id TEXT NOT NULL,
        path TEXT NOT NULL,
        downloads_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // Add downloads_id column back to course_lessons
    await db.execute(sql`
      ALTER TABLE payload.course_lessons ADD COLUMN downloads_id TEXT;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log(
      'Down migration completed: Reverted relationship between course lessons and downloads',
    )
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in down migration for course_lessons-downloads relationship fix:', error)
    throw error
  }
}
