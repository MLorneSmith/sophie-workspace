import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

/**
 * Migration to fix the relationships between course lessons and downloads
 *
 * This adds a direct relationship table between course lessons and downloads,
 * allowing lessons to reference multiple download files
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Create course_lessons_downloads_rels table if it doesn't exist
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
    `);

		// Add index for parent_id
		await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'course_lessons_downloads_rels'
          AND indexname = 'course_lessons_downloads_rels_parent_id_idx'
        ) THEN
          CREATE INDEX course_lessons_downloads_rels_parent_id_idx 
          ON payload.course_lessons_downloads_rels(parent_id);
        END IF;
      END
      $$;
    `);

		// Add index for downloads_id
		await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'course_lessons_downloads_rels'
          AND indexname = 'course_lessons_downloads_rels_downloads_id_idx'
        ) THEN
          CREATE INDEX course_lessons_downloads_rels_downloads_id_idx 
          ON payload.course_lessons_downloads_rels(downloads_id);
        END IF;
      END
      $$;
    `);

		// Add downloads_id column to course_lessons if it doesn't exist
		// This supports a direct relationship to a featured/primary download
		await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_lessons' 
          AND column_name = 'downloads_id'
        ) THEN
          ALTER TABLE payload.course_lessons ADD COLUMN downloads_id TEXT;
        END IF;
      END
      $$;
    `);

		// Add index for downloads_id on course_lessons
		await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'course_lessons'
          AND indexname = 'course_lessons_downloads_id_idx'
        ) THEN
          CREATE INDEX course_lessons_downloads_id_idx 
          ON payload.course_lessons(downloads_id);
        END IF;
      END
      $$;
    `);

		// Commit transaction
		await db.execute(sql`COMMIT;`);
		console.log(
			"Migration completed: Created relationship between course lessons and downloads",
		);
	} catch (error) {
		// Rollback on error
		await db.execute(sql`ROLLBACK;`);
		console.error("Error in lesson-downloads relationship migration:", error);
		throw error;
	}
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Check if the relationship table exists before trying to drop it
		const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload'
        AND table_name = 'course_lessons_downloads_rels'
      ) as exists;
    `);

		if (tableExists.rows[0].exists) {
			// Drop the relationship table
			await db.execute(sql`
        DROP TABLE payload.course_lessons_downloads_rels;
      `);
		}

		// Check if downloads_id column exists in course_lessons
		const columnExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload'
        AND table_name = 'course_lessons'
        AND column_name = 'downloads_id'
      ) as exists;
    `);

		if (columnExists.rows[0].exists) {
			// Drop the downloads_id column from course_lessons
			await db.execute(sql`
        ALTER TABLE payload.course_lessons DROP COLUMN downloads_id;
      `);
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);
		console.log(
			"Down migration completed: Removed relationship between course lessons and downloads",
		);
	} catch (error) {
		// Rollback on error
		await db.execute(sql`ROLLBACK;`);
		console.error(
			"Error in down migration for lesson-downloads relationship:",
			error,
		);
		throw error;
	}
}
