import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-postgres";

/**
 * Fix Downloads Relationship UUID Type Mismatch
 *
 * This migration addresses the type mismatch issues between TEXT and UUID columns
 * in downloads relationship tables by:
 * 1. Converting _parent_id in downloads_rels to TEXT type
 * 2. Adding a helper function for safe UUID/TEXT comparisons
 * 3. Ensuring all downloads_id values are consistently typed
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
	console.log("Running fix downloads UUID type mismatch migration");

	try {
		// Start transaction
		await db.execute(sql`BEGIN;`);

		// 1. Check if _parent_id column in downloads_rels is UUID type, if so convert to TEXT
		const columnCheck = await db.execute(sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'downloads_rels' 
      AND column_name = '_parent_id'
    `);

		if (
			columnCheck.rows.length > 0 &&
			columnCheck.rows[0].data_type === "uuid"
		) {
			console.log("Converting _parent_id column from UUID to TEXT type");

			// Create temporary column
			await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        ADD COLUMN _parent_id_text TEXT
      `);

			// Copy data with proper casting
			await db.execute(sql`
        UPDATE payload.downloads_rels 
        SET _parent_id_text = _parent_id::text
      `);

			// Drop the old column
			await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        DROP COLUMN _parent_id
      `);

			// Rename the new column
			await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        RENAME COLUMN _parent_id_text TO _parent_id
      `);

			// Re-create the primary key relationship
			await db.execute(sql`
        ALTER TABLE payload.downloads_rels 
        ADD CONSTRAINT downloads_rels_parent_fk 
        FOREIGN KEY (_parent_id) 
        REFERENCES payload.downloads(id) 
        ON DELETE CASCADE
      `);
		}

		// 2. Create helper function for safe UUID/TEXT comparisons
		await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.safe_uuid_comparison(a TEXT, b TEXT) 
      RETURNS BOOLEAN AS $$
      BEGIN
        -- Try to cast both to UUID and compare
        RETURN a::uuid = b::uuid;
      EXCEPTION WHEN OTHERS THEN
        -- If casting fails, compare as text
        RETURN a = b;
      END;
      $$ LANGUAGE plpgsql;
    `);

		// 3. Ensure table columns have consistent types
		const collections = [
			"documentation",
			"posts",
			"surveys",
			"survey_questions",
			"courses",
			"course_lessons",
			"course_quizzes",
			"quiz_questions",
		];

		for (const collection of collections) {
			const relationshipTable = `${collection}__downloads`;

			// Check if the table exists
			const tableCheck = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = ${sql.raw(`'${relationshipTable}'`)}
        ) as exists
      `);

			if (tableCheck.rows[0]?.exists) {
				console.log(`Adding TEXT type constraint to ${relationshipTable}`);

				// Ensure both downloads_id and related_id are TEXT type
				await db.execute(sql`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = ${sql.raw(`'${relationshipTable}'`)}
              AND column_name = 'downloads_id'
              AND data_type <> 'text'
            ) THEN
              ALTER TABLE payload.${sql.raw(relationshipTable)}
              ALTER COLUMN downloads_id TYPE TEXT USING downloads_id::TEXT;
            END IF;
            
            IF EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = ${sql.raw(`'${relationshipTable}'`)}
              AND column_name = 'related_id'
              AND data_type <> 'text'
            ) THEN
              ALTER TABLE payload.${sql.raw(relationshipTable)}
              ALTER COLUMN related_id TYPE TEXT USING related_id::TEXT;
            END IF;
          END
          $$;
        `);
			}
		}

		// Commit transaction
		await db.execute(sql`COMMIT;`);
		console.log(
			"Fix downloads UUID type mismatch migration completed successfully",
		);
	} catch (error) {
		// Rollback on error
		await db.execute(sql`ROLLBACK;`);
		console.error(
			"Error in fix downloads UUID type mismatch migration:",
			error,
		);
		throw error;
	}
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	console.log("Running down migration for fix downloads UUID type mismatch");

	// We don't revert the column type changes as it would be destructive
	// Just remove the helper function
	await db.execute(sql`
    DROP FUNCTION IF EXISTS payload.safe_uuid_comparison(TEXT, TEXT);
  `);

	console.log("Removed helper functions");
}
