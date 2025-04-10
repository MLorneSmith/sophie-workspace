import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix Downloads Relationships Migration
 *
 * This migration fixes the relationships between collections and downloads by:
 * 1. Ensuring the downloads_id column exists in all relationship tables
 * 2. Creating bidirectional relationships where needed
 * 3. Fixing relationship ID fields in relevant tables
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix downloads relationships migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Step 1: Ensure downloads_id column exists in collections with downloads relationships
    console.log('Adding downloads_id to relationship tables...')

    // Array of collections that have relationships with downloads
    const collections = [
      'documentation',
      'posts',
      'surveys',
      'survey_questions',
      'courses',
      'course_lessons',
      'course_quizzes',
      'quiz_questions',
    ]

    // Create rels tables if they don't exist and add downloads_id
    for (const collection of collections) {
      // Check and create legacy format relationship table (collection_downloads_rels)
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payload.${sql.raw(`${collection}_downloads_rels`)} (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          parent_id TEXT NOT NULL,
          downloads_id TEXT,
          order_column INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Ensure index exists on downloads_id
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ${sql.raw(`'${collection}_downloads_rels'`)}
            AND indexname = ${sql.raw(`'${collection}_downloads_rels_downloads_id_idx'`)}
          ) THEN
            CREATE INDEX ${sql.raw(`${collection}_downloads_rels_downloads_id_idx`)} 
            ON payload.${sql.raw(`${collection}_downloads_rels`)}(downloads_id);
          END IF;
        END
        $$;
      `)

      // Check and create new format relationship table (collection__downloads)
      // First check if table exists
      const tableExists = (
        await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'payload'
          AND table_name = ${sql.raw(`'${collection}__downloads'`)}
        ) as exists;
      `)
      ).rows[0] as { exists: boolean }

      if (!tableExists.exists) {
        // Create table with all required columns if it doesn't exist
        await db.execute(sql`
          CREATE TABLE payload.${sql.raw(`${collection}__downloads`)} (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            parent_id TEXT NOT NULL,
            related_id TEXT,
            downloads_id TEXT,
            order_column INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)
      } else {
        // If table exists, ensure the necessary columns exist
        await db.execute(sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = ${sql.raw(`'${collection}__downloads'`)}
              AND column_name = 'downloads_id'
            ) THEN
              ALTER TABLE payload.${sql.raw(`${collection}__downloads`)} ADD COLUMN downloads_id TEXT;
            END IF;
            
            IF NOT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_schema = 'payload'
              AND table_name = ${sql.raw(`'${collection}__downloads'`)}
              AND column_name = 'related_id'
            ) THEN
              ALTER TABLE payload.${sql.raw(`${collection}__downloads`)} ADD COLUMN related_id TEXT;
            END IF;
          END
          $$;
        `)
      }

      // Now that we're sure columns exist, create indexes
      await db.execute(sql`
        DO $$
        BEGIN
          -- Only create index if the column and table exist
          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}__downloads'`)}
            AND column_name = 'related_id'
          ) AND NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ${sql.raw(`'${collection}__downloads'`)}
            AND indexname = ${sql.raw(`'${collection}__downloads_related_id_idx'`)}
          ) THEN
            CREATE INDEX ${sql.raw(`${collection}__downloads_related_id_idx`)} 
            ON payload.${sql.raw(`${collection}__downloads`)}(related_id);
          END IF;

          -- Only create index if the column and table exist
          IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}__downloads'`)}
            AND column_name = 'downloads_id'
          ) AND NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ${sql.raw(`'${collection}__downloads'`)}
            AND indexname = ${sql.raw(`'${collection}__downloads_downloads_id_idx'`)}
          ) THEN
            CREATE INDEX ${sql.raw(`${collection}__downloads_downloads_id_idx`)} 
            ON payload.${sql.raw(`${collection}__downloads`)}(downloads_id);
          END IF;
        END
        $$;
      `)

      // Sync downloads_id with related_id in new style tables
      await db.execute(sql`
        UPDATE payload.${sql.raw(`${collection}__downloads`)} 
        SET downloads_id = related_id
        WHERE related_id IS NOT NULL AND downloads_id IS NULL;
      `)

      console.log(`Fixed relationship tables for ${collection}`)
    }

    // Step 2: Add downloads_id to collection_rels tables for bidirectional relationships
    console.log('Adding downloads_id to collection_rels tables for bidirectional relationships...')

    for (const collection of collections) {
      // Add downloads_id to collection_rels table if it doesn't exist
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}_rels'`)}
          ) AND NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}_rels'`)}
            AND column_name = 'downloads_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(`${collection}_rels`)} 
            ADD COLUMN downloads_id uuid;
          END IF;
        END
        $$;
      `)

      // Update the downloads_id field where appropriate
      await db.execute(sql`
        UPDATE payload.${sql.raw(`${collection}_rels`)}
        SET downloads_id = value::uuid
        WHERE field = 'downloads'
        AND downloads_id IS NULL
        AND EXISTS (
          SELECT 1 FROM payload.downloads
          WHERE id = value
        );
      `)
    }

    // Step 3: Add index to the downloads table for better performance
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'downloads'
          AND indexname = 'downloads_id_idx'
        ) THEN
          CREATE INDEX downloads_id_idx ON payload.downloads(id);
        END IF;
      END
      $$;
    `)

    // Step 4: Create any missing bidirectional relationships for downloads
    console.log('Creating bidirectional relationships for downloads...')

    // For each collection that has a relationship with downloads,
    // ensure downloads also has a relationship back to that collection
    await db.execute(sql`
      DO $$
      BEGIN
        -- Add downloads_rels table if it doesn't exist (for bidirectional relationships)
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload'
          AND table_name = 'downloads_rels'
        ) THEN
          CREATE TABLE payload.downloads_rels (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            _parent_id TEXT NOT NULL REFERENCES payload.downloads(id) ON DELETE CASCADE,
            field VARCHAR(255),
            value TEXT,
            order_column INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX downloads_rels_parent_idx ON payload.downloads_rels(_parent_id);
          CREATE INDEX downloads_rels_field_idx ON payload.downloads_rels(field);
          CREATE INDEX downloads_rels_value_idx ON payload.downloads_rels(value);
        END IF;
      END
      $$;
    `)

    // Step 5: Verify all collections' relationship tables have the correct structure
    for (const collection of collections) {
      await db.execute(sql`
        DO $$
        BEGIN
          -- Ensure related_id column exists in the new style tables
          IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}__downloads'`)}
          ) AND NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}__downloads'`)}
            AND column_name = 'related_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(`${collection}__downloads`)} ADD COLUMN related_id text;
          END IF;
          
          -- Ensure downloads_id column exists in the legacy tables
          IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}_downloads_rels'`)}
          ) AND NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}_downloads_rels'`)}
            AND column_name = 'downloads_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(`${collection}_downloads_rels`)} ADD COLUMN downloads_id text;
          END IF;
        END
        $$;
      `)
    }

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Fix downloads relationships migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in fix downloads relationships migration:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for fix downloads relationships')
  // We don't remove the columns since that could break existing relationships
  console.log('Down migration completed: No destructive actions needed')
}
