import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

/**
 * Comprehensive migration to fix all downloads relationship tables
 *
 * Payload CMS uses a specific naming convention for relationship tables and columns.
 * This migration resolves issues across all collections that might have relationships
 * with the downloads collection.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// 1. First, identify all relationship tables that might be using 'downloads_id'
		const relationTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND column_name = 'downloads_id';
    `);

		// 2. For each relationship table with 'downloads_id', update the structure
		for (const row of relationTables.rows) {
			const tableName = row.table_name as string;
			console.log(`Processing relationship table: ${tableName}`);

			// Check if this is a relationship table (typically has 'rels' in the name)
			if (tableName.includes("rels")) {
				// Create a properly structured relationship table with Payload's expected naming
				const collectionName = tableName.replace("_rels", "");
				const newTableName = `${collectionName}__downloads`;

				// Check if the new table already exists
				const newTableExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload'
            AND table_name = ${newTableName}
          ) as exists;
        `);

				const newTableExistsValue = (
					newTableExists.rows[0] as { exists: boolean }
				).exists;

				if (!newTableExistsValue) {
					// Create new correctly structured relationship table
					await db.execute(sql`
            CREATE TABLE IF NOT EXISTS payload.${sql.identifier(newTableName)} (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              order_column INTEGER,
              parent_id TEXT NOT NULL,
              related_id TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `);

					// Add proper indices
					await db.execute(sql`
            CREATE INDEX IF NOT EXISTS ${sql.identifier(`${newTableName}_parent_id_idx`)}
            ON payload.${sql.identifier(newTableName)}(parent_id);
          `);

					await db.execute(sql`
            CREATE INDEX IF NOT EXISTS ${sql.identifier(`${newTableName}_related_id_idx`)}
            ON payload.${sql.identifier(newTableName)}(related_id);
          `);

					// First check if order_column exists in the source table
					const hasOrderColumn = await db.execute(sql`
            SELECT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_schema = 'payload'
              AND table_name = ${tableName}
              AND column_name = 'order_column'
            ) as exists;
          `);

					const hasOrderColumnValue = (
						hasOrderColumn.rows[0] as { exists: boolean }
					).exists;

					// Migrate data from old table to new table - with or without order_column
					if (hasOrderColumnValue) {
						await db.execute(sql`
              INSERT INTO payload.${sql.identifier(newTableName)} (
                id, 
                order_column, 
                parent_id, 
                related_id, 
                created_at, 
                updated_at
              )
              SELECT 
                COALESCE(id::text, gen_random_uuid()::text), 
                COALESCE(order_column, 0), 
                parent_id, 
                downloads_id, 
                COALESCE(created_at, NOW()), 
                COALESCE(updated_at, NOW())
              FROM 
                payload.${sql.identifier(tableName)}
              WHERE
                downloads_id IS NOT NULL;
            `);
					} else {
						// Insert without order_column, it will default to NULL or 0 depending on table definition
						await db.execute(sql`
              INSERT INTO payload.${sql.identifier(newTableName)} (
                id, 
                parent_id, 
                related_id, 
                created_at, 
                updated_at
              )
              SELECT 
                COALESCE(id::text, gen_random_uuid()::text), 
                parent_id, 
                downloads_id, 
                COALESCE(created_at, NOW()), 
                COALESCE(updated_at, NOW())
              FROM 
                payload.${sql.identifier(tableName)}
              WHERE
                downloads_id IS NOT NULL;
            `);
					}
				}
			}
		}

		// 3. Handle any direct downloads_id columns in content tables
		const contentTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name IN ('documentation', 'posts', 'surveys', 'survey_questions', 'courses', 'course_lessons', 'course_quizzes', 'quiz_questions');
    `);

		for (const row of contentTables.rows) {
			const tableName = row.table_name as string;

			// Check if this table has a direct downloads_id column
			const hasDownloadsColumn = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload'
          AND table_name = ${tableName}
          AND column_name = 'downloads_id'
        ) as exists;
      `);

			const hasDownloadsColumnValue = (
				hasDownloadsColumn.rows[0] as { exists: boolean }
			).exists;

			if (hasDownloadsColumnValue) {
				// Create properly structured relationship table if it doesn't exist
				const relationTableName = `${tableName}__downloads`;

				const relationTableExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload'
            AND table_name = ${relationTableName}
          ) as exists;
        `);

				const relationTableExistsValue = (
					relationTableExists.rows[0] as { exists: boolean }
				).exists;

				if (!relationTableExistsValue) {
					// Create new relationship table
					await db.execute(sql`
            CREATE TABLE IF NOT EXISTS payload.${sql.identifier(relationTableName)} (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              order_column INTEGER,
              parent_id TEXT NOT NULL,
              related_id TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `);

					// Add proper indices
					await db.execute(sql`
            CREATE INDEX IF NOT EXISTS ${sql.identifier(`${relationTableName}_parent_id_idx`)}
            ON payload.${sql.identifier(relationTableName)}(parent_id);
          `);

					await db.execute(sql`
            CREATE INDEX IF NOT EXISTS ${sql.identifier(`${relationTableName}_related_id_idx`)}
            ON payload.${sql.identifier(relationTableName)}(related_id);
          `);
				}

				// Migrate any existing direct relationships to the relationship table
				await db.execute(sql`
          INSERT INTO payload.${sql.identifier(relationTableName)} (
            parent_id, 
            related_id
          )
          SELECT 
            id, 
            downloads_id
          FROM 
            payload.${sql.identifier(tableName)}
          WHERE 
            downloads_id IS NOT NULL AND
            NOT EXISTS (
              SELECT 1 FROM payload.${sql.identifier(relationTableName)}
              WHERE parent_id = payload.${sql.identifier(tableName)}.id
              AND related_id = payload.${sql.identifier(tableName)}.downloads_id
            );
        `);
			}
		}

		// 4. Handle temporary UUID-named tables that might be created by Payload CMS for queries
		// This is a more direct approach to fix the immediate error
		try {
			const uuidPattern =
				"^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$";

			// First, get all UUID-named tables
			const uuidTables = await db.execute(sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'payload'
        AND table_name ~ ${uuidPattern};
      `);

			for (const row of uuidTables.rows) {
				const tableName = row.table_name as string;
				console.log(`Processing UUID table: ${tableName}`);

				// Check if 'downloads_id' column exists in this table
				const hasDownloadsIdColumn = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${tableName}
            AND column_name = 'downloads_id'
          ) as exists;
        `);

				if ((hasDownloadsIdColumn.rows[0] as { exists: boolean }).exists) {
					// Add a 'related_id' column as an alias for 'downloads_id'
					try {
						await db.execute(sql`
              ALTER TABLE payload.${sql.identifier(tableName)}
              ADD COLUMN IF NOT EXISTS related_id TEXT;
            `);

						// Copy values from downloads_id to related_id
						await db.execute(sql`
              UPDATE payload.${sql.identifier(tableName)}
              SET related_id = downloads_id
              WHERE downloads_id IS NOT NULL AND related_id IS NULL;
            `);

						console.log(`Successfully fixed table ${tableName}`);
					} catch (err: any) {
						// Log the error but continue with other tables
						console.warn(
							`Warning: Could not fix UUID table ${tableName}: ${err.message || String(err)}`,
						);
					}
				}
			}
		} catch (err: any) {
			// Log the error but continue with the rest of the migration
			console.warn(
				`Warning in UUID tables section: ${err.message || String(err)}`,
			);
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);
		console.log(
			"Migration completed: Fixed all downloads relationships across collections",
		);
	} catch (error) {
		// Rollback on error
		await db.execute(sql`ROLLBACK;`);
		console.error("Error in fix-all-downloads-relationships migration:", error);
		throw error;
	}
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
	console.log(
		"This migration does not support down migration. Manual intervention required to undo schema changes.",
	);
}
