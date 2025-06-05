import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
	payload.logger.info("Running fix downloads alias migration");

	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Get all table names in the payload schema
		const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'payload'
    `);

		// Look for temporary tables that might be used in queries
		for (const row of tables.rows) {
			const tableName = row.tablename as string;

			// Check if this is a UUID-style table name (likely a temporary table or view)
			if (
				/^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/.test(
					tableName,
				)
			) {
				payload.logger.info(`Found dynamic table: ${tableName}`);

				// Check if downloads_id column exists in this table
				const hasDownloadsId = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = ${tableName} 
            AND column_name = 'downloads_id'
          );
        `);

				if (!hasDownloadsId.rows[0].exists) {
					try {
						payload.logger.info(
							`Adding downloads_id column to table ${tableName}`,
						);
						await db.execute(sql`
              ALTER TABLE payload.${sql.identifier(tableName)}
              ADD COLUMN downloads_id UUID;
            `);
					} catch (error) {
						// Some temporary tables might be views or have restrictions
						payload.logger.warn(
							`Could not add downloads_id column to ${tableName}: ${error}`,
						);
					}
				}
			}
		}

		// Also look for any tables that have 'course_lessons' in their name
		const courseLessonsTables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'payload' AND tablename LIKE '%course_lessons%'
    `);

		for (const row of courseLessonsTables.rows) {
			const tableName = row.tablename as string;
			if (
				tableName !== "course_lessons" &&
				tableName !== "course_lessons_rels"
			) {
				const hasDownloadsId = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload' 
            AND table_name = ${tableName} 
            AND column_name = 'downloads_id'
          );
        `);

				if (!hasDownloadsId.rows[0].exists) {
					try {
						payload.logger.info(
							`Adding downloads_id column to course lessons related table ${tableName}`,
						);
						await db.execute(sql`
              ALTER TABLE payload.${sql.identifier(tableName)}
              ADD COLUMN downloads_id UUID;
            `);
					} catch (error) {
						payload.logger.warn(
							`Could not add downloads_id column to ${tableName}: ${error}`,
						);
					}
				}
			}
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);
		payload.logger.info("Fix downloads alias migration completed successfully");
	} catch (error) {
		await db.execute(sql`ROLLBACK;`);
		payload.logger.error("Fix downloads alias migration failed:", error);
		throw error;
	}
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
	// For dynamic tables, we won't attempt to remove the columns as they are likely temporary
	payload.logger.info(
		"No action needed for down migration of fix downloads alias",
	);
}
