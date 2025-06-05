import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
	payload.logger.info("Running add downloads column migration");

	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Check if downloads_id column exists in course_lessons_rels table
		const hasDownloadsId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons_rels' 
        AND column_name = 'downloads_id'
      );
    `);

		// Add downloads_id column if it doesn't exist
		if (!hasDownloadsId.rows[0].exists) {
			payload.logger.info(
				"Adding downloads_id column to course_lessons_rels table",
			);
			await db.execute(sql`
        ALTER TABLE payload.course_lessons_rels
        ADD COLUMN downloads_id UUID;
      `);
		}

		// Also add it to course_lessons table in case it's needed
		const hasDownloadsIdInLessons = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'downloads_id'
      );
    `);

		if (!hasDownloadsIdInLessons.rows[0].exists) {
			payload.logger.info("Adding downloads_id column to course_lessons table");
			await db.execute(sql`
        ALTER TABLE payload.course_lessons
        ADD COLUMN downloads_id UUID;
      `);
		}

		// Also add the downloads_id_id column which might be used for foreign key references
		const hasDownloadsIdId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'downloads_id_id'
      );
    `);

		if (!hasDownloadsIdId.rows[0].exists) {
			payload.logger.info(
				"Adding downloads_id_id column to course_lessons table",
			);
			await db.execute(sql`
        ALTER TABLE payload.course_lessons
        ADD COLUMN downloads_id_id UUID;
      `);
		}

		// Also create a downloads_rels table if it doesn't exist
		// (in case we're trying to establish relationship)
		const downloadsRelsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = 'downloads_rels'
      );
    `);

		if (!downloadsRelsExists.rows[0].exists) {
			payload.logger.info("Creating downloads_rels table");
			await db.execute(sql`
        CREATE TABLE payload.downloads_rels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          parent_id UUID,
          _parent_id UUID, 
          downloads_id UUID,
          course_lessons_id UUID,
          field TEXT,
          value TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);

		payload.logger.info(
			"Add downloads column migration completed successfully",
		);
	} catch (error) {
		await db.execute(sql`ROLLBACK;`);
		payload.logger.error("Add downloads column migration failed:", error);
		throw error;
	}
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
	payload.logger.info("Reverting add downloads column migration");

	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Check if downloads_id column exists in course_lessons_rels table
		const hasDownloadsId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons_rels' 
        AND column_name = 'downloads_id'
      );
    `);

		// Remove downloads_id column if it exists
		if (hasDownloadsId.rows[0].exists) {
			payload.logger.info(
				"Removing downloads_id column from course_lessons_rels table",
			);
			await db.execute(sql`
        ALTER TABLE payload.course_lessons_rels
        DROP COLUMN downloads_id;
      `);
		}

		// Also remove it from course_lessons table if it exists
		const hasDownloadsIdInLessons = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'downloads_id'
      );
    `);

		if (hasDownloadsIdInLessons.rows[0].exists) {
			payload.logger.info(
				"Removing downloads_id column from course_lessons table",
			);
			await db.execute(sql`
        ALTER TABLE payload.course_lessons
        DROP COLUMN downloads_id;
      `);
		}

		// Also remove the downloads_id_id column if it exists
		const hasDownloadsIdId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'course_lessons' 
        AND column_name = 'downloads_id_id'
      );
    `);

		if (hasDownloadsIdId.rows[0].exists) {
			payload.logger.info(
				"Removing downloads_id_id column from course_lessons table",
			);
			await db.execute(sql`
        ALTER TABLE payload.course_lessons
        DROP COLUMN downloads_id_id;
      `);
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);

		payload.logger.info(
			"Add downloads column migration reversion completed successfully",
		);
	} catch (error) {
		await db.execute(sql`ROLLBACK;`);
		payload.logger.error(
			"Add downloads column migration reversion failed:",
			error,
		);
		throw error;
	}
}
