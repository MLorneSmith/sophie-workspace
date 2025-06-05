import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
	payload.logger.info("Running relationship column fix migration");

	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Get all relationship tables
		const relsTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name LIKE '%_rels';
    `);

		// Process each relationship table
		for (const row of relsTables.rows) {
			const tableName = row.table_name as string;

			// Check if _parent_id exists
			const hasUnderscoreParentId = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = ${tableName} 
          AND column_name = '_parent_id'
        );
      `);

			// Check if parent_id exists
			const hasParentId = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = ${tableName} 
          AND column_name = 'parent_id'
        );
      `);

			// If _parent_id exists but parent_id doesn't
			if (hasUnderscoreParentId.rows[0].exists && !hasParentId.rows[0].exists) {
				payload.logger.info(`Adding parent_id column to ${tableName}`);

				// Create parent_id column as a copy of _parent_id
				await db.execute(sql`
          ALTER TABLE payload.${sql.identifier(tableName)} 
          ADD COLUMN parent_id UUID;
        `);

				await db.execute(sql`
          UPDATE payload.${sql.identifier(tableName)} 
          SET parent_id = _parent_id;
        `);
			}

			// If parent_id exists but _parent_id doesn't
			else if (
				hasParentId.rows[0].exists &&
				!hasUnderscoreParentId.rows[0].exists
			) {
				payload.logger.info(`Adding _parent_id column to ${tableName}`);

				// Create _parent_id column as a copy of parent_id
				await db.execute(sql`
          ALTER TABLE payload.${sql.identifier(tableName)} 
          ADD COLUMN _parent_id UUID;
        `);

				await db.execute(sql`
          UPDATE payload.${sql.identifier(tableName)} 
          SET _parent_id = parent_id;
        `);
			}

			// If neither exists, create them both
			else if (
				!hasParentId.rows[0].exists &&
				!hasUnderscoreParentId.rows[0].exists
			) {
				payload.logger.warn(
					`Neither parent_id nor _parent_id exists in ${tableName}`,
				);
			}
		}

		// Check and fix survey_questions_options table
		const sqoHasUnderscoreParentId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'survey_questions_options' 
        AND column_name = '_parent_id'
      );
    `);

		const sqoHasParentId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'survey_questions_options' 
        AND column_name = 'parent_id'
      );
    `);

		// If _parent_id exists but parent_id doesn't
		if (
			sqoHasUnderscoreParentId.rows[0].exists &&
			!sqoHasParentId.rows[0].exists
		) {
			payload.logger.info(
				"Adding parent_id column to survey_questions_options",
			);

			await db.execute(sql`
        ALTER TABLE payload.survey_questions_options 
        ADD COLUMN parent_id UUID;
      `);

			await db.execute(sql`
        UPDATE payload.survey_questions_options 
        SET parent_id = _parent_id;
      `);
		}

		// If parent_id exists but _parent_id doesn't
		else if (
			sqoHasParentId.rows[0].exists &&
			!sqoHasUnderscoreParentId.rows[0].exists
		) {
			payload.logger.info(
				"Adding _parent_id column to survey_questions_options",
			);

			await db.execute(sql`
        ALTER TABLE payload.survey_questions_options 
        ADD COLUMN _parent_id UUID;
      `);

			await db.execute(sql`
        UPDATE payload.survey_questions_options 
        SET _parent_id = parent_id;
      `);
		}

		// If neither exists, warn
		else if (
			!sqoHasParentId.rows[0].exists &&
			!sqoHasUnderscoreParentId.rows[0].exists
		) {
			payload.logger.warn(
				"Neither parent_id nor _parent_id exists in survey_questions_options",
			);
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);

		payload.logger.info(
			"Relationship column fix migration completed successfully",
		);
	} catch (error) {
		await db.execute(sql`ROLLBACK;`);
		payload.logger.error("Relationship column fix migration failed:", error);
		throw error;
	}
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
	payload.logger.info("Reverting relationship column fix migration");

	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// Get all relationship tables
		const relsTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name LIKE '%_rels';
    `);

		// Process each relationship table
		for (const row of relsTables.rows) {
			const tableName = row.table_name as string;

			// Check if both columns exist
			const hasUnderscoreParentId = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = ${tableName} 
          AND column_name = '_parent_id'
        );
      `);

			const hasParentId = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = ${tableName} 
          AND column_name = 'parent_id'
        );
      `);

			// If both columns exist
			if (hasUnderscoreParentId.rows[0].exists && hasParentId.rows[0].exists) {
				// We'll keep _parent_id as the standard for down migration
				// So if parent_id was added by this migration, remove it
				payload.logger.info(`Removing parent_id column from ${tableName}`);

				await db.execute(sql`
          ALTER TABLE payload.${sql.identifier(tableName)} 
          DROP COLUMN parent_id;
        `);
			}
		}

		// Check and fix survey_questions_options table
		const sqoHasUnderscoreParentId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'survey_questions_options' 
        AND column_name = '_parent_id'
      );
    `);

		const sqoHasParentId = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = 'survey_questions_options' 
        AND column_name = 'parent_id'
      );
    `);

		// If both columns exist
		if (
			sqoHasUnderscoreParentId.rows[0].exists &&
			sqoHasParentId.rows[0].exists
		) {
			// We'll keep _parent_id as the standard for down migration
			// So if parent_id was added by this migration, remove it
			payload.logger.info(
				"Removing parent_id column from survey_questions_options",
			);

			await db.execute(sql`
        ALTER TABLE payload.survey_questions_options 
        DROP COLUMN parent_id;
      `);
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);

		payload.logger.info(
			"Relationship column fix migration reversion completed successfully",
		);
	} catch (error) {
		await db.execute(sql`ROLLBACK;`);
		payload.logger.error(
			"Relationship column fix migration reversion failed:",
			error,
		);
		throw error;
	}
}
