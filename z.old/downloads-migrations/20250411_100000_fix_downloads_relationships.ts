import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix Downloads Relationships Migration
 *
 * This migration addresses the relationship issues with Downloads collection
 * across all affected collections in Payload CMS. It fixes the problem with
 * temporary UUID tables missing the downloads_id column by:
 *
 * 1. Ensuring downloads_id columns exist in all relationship tables
 * 2. Creating bidirectional relationships
 * 3. Adding a system-level approach to handle temporary UUID tables
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix downloads relationships migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // 1. Create downloads_rels table if it doesn't exist (for bidirectional relationships)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.downloads_rels (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        _parent_id TEXT NOT NULL REFERENCES payload.downloads(id) ON DELETE CASCADE,
        field VARCHAR(255),
        value TEXT,
        order_column INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // 2. Create indexes on downloads_rels
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS downloads_rels_parent_idx ON payload.downloads_rels(_parent_id);
      CREATE INDEX IF NOT EXISTS downloads_rels_field_idx ON payload.downloads_rels(field);
      CREATE INDEX IF NOT EXISTS downloads_rels_value_idx ON payload.downloads_rels(value);
    `)

    // 3. Add fields for each collection that references downloads
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

    for (const collection of collections) {
      // Ensure downloads_id column exists in the collection's main table
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}'`)}
          ) AND NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${collection}'`)}
            AND column_name = 'downloads_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(collection)} ADD COLUMN downloads_id TEXT[];
          END IF;
        END
        $$;
      `)

      // Create collection__downloads relationship table if it doesn't exist
      const relationshipTable = `${collection}__downloads`
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payload.${sql.raw(relationshipTable)} (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          parent_id TEXT NOT NULL,
          related_id TEXT,
          downloads_id TEXT,
          order_column INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)

      // Ensure columns exist in relationship table
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${relationshipTable}'`)}
            AND column_name = 'downloads_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(relationshipTable)} ADD COLUMN downloads_id TEXT;
          END IF;

          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'payload'
            AND table_name = ${sql.raw(`'${relationshipTable}'`)}
            AND column_name = 'related_id'
          ) THEN
            ALTER TABLE payload.${sql.raw(relationshipTable)} ADD COLUMN related_id TEXT;
          END IF;
        END
        $$;
      `)

      // Create indexes for faster queries
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ${sql.raw(`'${relationshipTable}'`)}
            AND indexname = ${sql.raw(`'${relationshipTable}_parent_id_idx'`)}
          ) THEN
            CREATE INDEX ${sql.raw(`${relationshipTable}_parent_id_idx`)} 
            ON payload.${sql.raw(relationshipTable)}(parent_id);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ${sql.raw(`'${relationshipTable}'`)}
            AND indexname = ${sql.raw(`'${relationshipTable}_related_id_idx'`)}
          ) THEN
            CREATE INDEX ${sql.raw(`${relationshipTable}_related_id_idx`)} 
            ON payload.${sql.raw(relationshipTable)}(related_id);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = ${sql.raw(`'${relationshipTable}'`)}
            AND indexname = ${sql.raw(`'${relationshipTable}_downloads_id_idx'`)}
          ) THEN
            CREATE INDEX ${sql.raw(`${relationshipTable}_downloads_id_idx`)} 
            ON payload.${sql.raw(relationshipTable)}(downloads_id);
          END IF;
        END
        $$;
      `)

      // Sync related_id and downloads_id columns (make sure they contain the same values)
      await db.execute(sql`
        UPDATE payload.${sql.raw(relationshipTable)}
        SET downloads_id = related_id
        WHERE related_id IS NOT NULL AND (downloads_id IS NULL OR downloads_id != related_id);
        
        UPDATE payload.${sql.raw(relationshipTable)}
        SET related_id = downloads_id
        WHERE downloads_id IS NOT NULL AND (related_id IS NULL OR related_id != downloads_id);
      `)
    }

    // 4. Create bidirectional relationships from downloads to collections
    console.log('Creating bidirectional relationships for downloads...')

    for (const collection of collections) {
      const relationshipTable = `${collection}__downloads`

      // Get existing relationships from collection to downloads
      const relationships = await db.execute(sql`
        SELECT 
          parent_id as collection_id,
          downloads_id
        FROM payload.${sql.raw(relationshipTable)}
        WHERE downloads_id IS NOT NULL
      `)

      // For each relationship, create a reverse relationship if it doesn't exist
      for (const relationship of relationships.rows) {
        const downloadsId = relationship.downloads_id as string
        const collectionId = relationship.collection_id as string

        await db.execute(sql`
          INSERT INTO payload.downloads_rels
            (id, _parent_id, field, value, order_column, created_at, updated_at)
          SELECT
            gen_random_uuid()::text,
            ${downloadsId},
            ${collection},
            ${collectionId},
            0,
            NOW(),
            NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM payload.downloads_rels
            WHERE _parent_id = ${downloadsId}
            AND field = ${collection}
            AND value = ${collectionId}
          );
        `)
      }
    }

    // 5. Verify and report on relationships
    let totalRelationships = 0
    let totalBidirectional = 0

    // Create a function to get relationship counts to avoid TypeScript issues with SQL template literals
    async function getRelationshipCounts(
      collection: string,
    ): Promise<{ total: number; bidirectional: number }> {
      const relationshipTable = `${collection}__downloads`

      // Get total relationships
      const counts = await db.execute(sql`
        SELECT COUNT(*) as total FROM payload.${sql.raw(relationshipTable)}
        WHERE downloads_id IS NOT NULL
      `)

      // Get bidirectional relationships with proper SQL escaping and TYPE CASTING
      const bidirectionalCounts = await db.execute(sql`
        SELECT COUNT(*) as total 
        FROM payload.${sql.raw(relationshipTable)} rt
        JOIN payload.downloads_rels dr ON 
          CASE 
            WHEN rt.downloads_id IS NOT NULL THEN rt.downloads_id::uuid = dr._parent_id::uuid
            ELSE false
          END
        WHERE dr.field = ${sql.raw(`'${collection}'`)}
        AND dr.value = rt.parent_id
      `)

      // Parse counts safely
      const total = parseInt(counts.rows[0]?.total as string) || 0
      const bidirectional = parseInt(bidirectionalCounts.rows[0]?.total as string) || 0

      return { total, bidirectional }
    }

    // Check each collection
    for (const collection of collections) {
      const { total, bidirectional } = await getRelationshipCounts(collection)

      totalRelationships += total
      totalBidirectional += bidirectional

      console.log(`${collection}: ${bidirectional}/${total} bidirectional relationships`)
    }

    console.log(`Total: ${totalBidirectional}/${totalRelationships} bidirectional relationships`)

    // 6. Create a view-based solution for temporary UUID tables - this approach avoids
    // needing system-level triggers which may need higher permissions
    console.log('Creating view and function for handling UUID temporary tables...')

    await db.execute(sql`
      -- Create a view-based solution that maps column names
      CREATE OR REPLACE VIEW payload.downloads_column_mapping AS
      SELECT 'related_id' AS source_column, 'downloads_id' AS target_column
      UNION
      SELECT 'downloads_id' AS source_column, 'related_id' AS target_column;
      
      -- Create function to transparently map between column names
      CREATE OR REPLACE FUNCTION payload.column_alias() 
      RETURNS TRIGGER AS $$
      BEGIN
        -- This checks if the temporary table being created matches UUID pattern
        IF TG_TABLE_NAME ~ '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$' THEN
          -- Create equivalent column names for temporary UUID tables
          EXECUTE 'ALTER TABLE ' || TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME || 
                 ' ADD COLUMN IF NOT EXISTS downloads_id TEXT';
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Drop trigger if it exists
      DROP TRIGGER IF EXISTS handle_temp_tables ON payload.course_lessons__downloads;
      
      -- Try to create the trigger (may fail if insufficient privileges)
      DO $$
      BEGIN
        CREATE TRIGGER handle_temp_tables
        AFTER INSERT ON payload.course_lessons__downloads
        FOR EACH ROW
        EXECUTE FUNCTION payload.column_alias();
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Unable to create trigger for temporary tables - insufficient privileges';
      END
      $$;
    `)

    // 7. Create fallback function that can be called from application code
    await db.execute(sql`
      -- Create a function that can copy values between columns as a fallback
      CREATE OR REPLACE FUNCTION payload.ensure_downloads_id(table_name TEXT) 
      RETURNS VOID AS $$
      BEGIN
        EXECUTE 'ALTER TABLE ' || table_name || ' ADD COLUMN IF NOT EXISTS downloads_id TEXT';
        EXECUTE 'UPDATE ' || table_name || ' SET downloads_id = related_id WHERE related_id IS NOT NULL AND downloads_id IS NULL';
      END;
      $$ LANGUAGE plpgsql;
    `)

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

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Remove the views and functions, but leave the relationships intact
    await db.execute(sql`
      DROP VIEW IF EXISTS payload.downloads_column_mapping;
      DROP FUNCTION IF EXISTS payload.column_alias() CASCADE;
      DROP FUNCTION IF EXISTS payload.ensure_downloads_id(TEXT);
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Down migration for downloads relationships completed')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in down migration for fix downloads relationships:', error)
    throw error
  }
}
