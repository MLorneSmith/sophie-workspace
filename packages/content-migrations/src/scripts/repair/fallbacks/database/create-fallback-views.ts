import { sql } from 'drizzle-orm';

import { logger } from '@kit/shared/logger';

import { getDrizzleInstance } from './utils.js';

/**
 * Creates database views for fallback relationships
 * These views help to provide alternative data when primary relationship
 * lookups fail due to ID mismatches or missing records
 */
export async function createFallbackViews() {
  const drizzle = await getDrizzleInstance();

  try {
    logger.info({ script: 'create-fallback-views' }, 'Creating fallback views');

    // First, ensure the fallback_relationships table exists
    await drizzle.execute(sql`
      CREATE TABLE IF NOT EXISTS payload.fallback_relationships (
        collection TEXT NOT NULL,
        field_name TEXT NOT NULL,
        document_id TEXT NOT NULL,
        related_ids TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (collection, field_name, document_id)
      )
    `);

    // Create main relationship fallbacks view
    // This provides a view of the fallback relationships
    await drizzle.execute(sql`
      CREATE OR REPLACE VIEW payload.relationship_fallbacks_view AS
      SELECT 
        collection,
        document_id,
        field_name,
        related_ids
      FROM 
        payload.fallback_relationships
    `);

    // Fill the fallback_relationships table by querying each collection separately
    // This is safer than using dynamic table names in a single query

    // Get all collections
    const collections = await drizzle.execute(sql`
      SELECT DISTINCT table_name FROM payload.dynamic_uuid_tables
      WHERE table_name NOT LIKE '%\_rels' ESCAPE '\\'
    `);

    // Process each collection and its relationship tables
    for (const row of collections) {
      const collection = row.table_name;

      // Only process known collections to avoid SQL injection
      if (!collection.match(/^[a-zA-Z0-9_]+$/)) {
        logger.warn(
          { script: 'create-fallback-views', collection },
          'Skipping collection with invalid name pattern',
        );
        continue;
      }

      try {
        // Find relationship tables for this collection
        const queryText = `
          SELECT table_name, 
                substring(table_name from '${collection}_(.+)_rels$') as field_name
          FROM pg_catalog.pg_tables
          WHERE schemaname = 'payload'
          AND table_name LIKE '${collection}_%_rels'
        `;

        const relationshipTables = await drizzle.execute(sql.raw(queryText));

        // Process each relationship table
        for (const relTable of relationshipTables) {
          if (relTable.table_name && relTable.field_name) {
            // Validate table name to prevent SQL injection
            if (!relTable.table_name.match(/^[a-zA-Z0-9_]+$/)) {
              continue;
            }

            try {
              const insertQuery = `
                INSERT INTO payload.fallback_relationships (
                  collection, field_name, document_id, related_ids
                )
                SELECT 
                  '${collection}' as collection,
                  '${relTable.field_name}' as field_name,
                  doc.id as document_id,
                  array_agg(DISTINCT rel.parent_id) as related_ids
                FROM 
                  payload.${collection} doc
                LEFT JOIN 
                  payload.${relTable.table_name} rel
                  ON rel.child_id = doc.id
                GROUP BY 
                  doc.id
                ON CONFLICT (collection, field_name, document_id) 
                DO UPDATE SET 
                  related_ids = EXCLUDED.related_ids,
                  updated_at = NOW()
              `;

              await drizzle.execute(sql.raw(insertQuery));

              logger.info(
                {
                  script: 'create-fallback-views',
                  collection,
                  relationship: relTable.field_name,
                },
                'Successfully updated fallback relationship data',
              );
            } catch (err) {
              logger.warn(
                {
                  script: 'create-fallback-views',
                  collection,
                  relationshipTable: relTable.table_name,
                  error: err,
                },
                'Failed to update fallback for specific relationship',
              );
            }
          }
        }
      } catch (collectionError) {
        logger.warn(
          {
            script: 'create-fallback-views',
            collection,
            error: collectionError,
          },
          'Failed to process collection for fallbacks',
        );
      }
    }

    // Create view for quiz-questions relationships
    // This specific view is tailored for the quiz-questions relationship
    // which is a common source of errors
    await drizzle.execute(sql`
      CREATE OR REPLACE VIEW payload.quiz_questions_view AS
      SELECT 
        cq.id as quiz_id, 
        cq.title as quiz_title,
        array_agg(qq.id) as question_ids
      FROM 
        payload.course_quizzes cq
      JOIN payload.quiz_questions_rels rel 
        ON rel.child_id = cq.id
      JOIN payload.quiz_questions qq 
        ON rel.parent_id = qq.id
      GROUP BY 
        cq.id, 
        cq.title
    `);

    // Create lesson-quiz relationship view
    // This provides fallbacks for lesson-quiz relationships
    await drizzle.execute(sql`
      CREATE OR REPLACE VIEW payload.lesson_quiz_view AS
      SELECT 
        cl.id as lesson_id, 
        cl.title as lesson_title,
        cq.id as quiz_id,
        cq.title as quiz_title
      FROM 
        payload.course_lessons cl
      JOIN payload.course_lessons_rels rel 
        ON rel.child_id = cl.id
      JOIN payload.course_quizzes cq 
        ON rel.parent_id = cq.id
    `);

    logger.info(
      { script: 'create-fallback-views' },
      'Fallback views created successfully',
    );

    return { success: true };
  } catch (error) {
    logger.error(
      { script: 'create-fallback-views', error },
      'Failed to create fallback views',
    );
    return { success: false, error };
  }
}

// Run the function directly if executed as a script
if (require.main === module) {
  createFallbackViews()
    .then((result) => {
      if (result.success) {
        console.log('Successfully created fallback views');
        process.exit(0);
      } else {
        console.error('Failed to create fallback views:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
