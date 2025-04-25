import { sql } from 'drizzle-orm';

import { logger } from '@kit/shared/logger';

import { getDrizzleInstance } from './utils.js';

/**
 * Creates database functions for fallback relationships
 * These functions provide alternative methods to retrieve relationship data
 * when primary methods fail due to ID mismatches or missing records
 */
export async function createFallbackFunctions() {
  const drizzle = await getDrizzleInstance();

  try {
    logger.info(
      { script: 'create-fallback-functions' },
      'Creating fallback functions',
    );

    // Create a function to get relationship data with fallbacks
    await drizzle.execute(sql`
      CREATE OR REPLACE FUNCTION payload.get_relationships(
        p_collection TEXT,
        p_document_id TEXT,
        p_field_name TEXT
      )
      RETURNS TEXT[] AS $$
      DECLARE
        result TEXT[];
      BEGIN
        -- First try to get data from the fallback_relationships table
        SELECT related_ids INTO result
        FROM payload.fallback_relationships
        WHERE collection = p_collection
        AND document_id = p_document_id
        AND field_name = p_field_name;
        
        -- If no result, try to get data directly from relationship table
        IF result IS NULL THEN
          DECLARE
            relationship_table TEXT;
          BEGIN
            relationship_table := p_collection || '_' || p_field_name || '_rels';
            
            -- Check if the relationship table exists
            IF EXISTS (
              SELECT 1 FROM pg_catalog.pg_tables
              WHERE schemaname = 'payload'
              AND tablename = relationship_table
            ) THEN
              -- Dynamically get related IDs from relationship table
              EXECUTE format('
                SELECT array_agg(DISTINCT parent_id)
                FROM payload.%I
                WHERE child_id = %L
              ', relationship_table, p_document_id)
              INTO result;
            END IF;
          END;
        END IF;
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a function to get quiz questions with fallbacks
    await drizzle.execute(sql`
      CREATE OR REPLACE FUNCTION payload.get_quiz_questions(
        p_quiz_id TEXT
      )
      RETURNS TEXT[] AS $$
      DECLARE
        result TEXT[];
      BEGIN
        -- First try to get question IDs from the quiz_questions_view
        SELECT question_ids INTO result
        FROM payload.quiz_questions_view
        WHERE quiz_id = p_quiz_id;
        
        -- If no result, try to get from the relationship table directly
        IF result IS NULL THEN
          SELECT array_agg(DISTINCT parent_id) INTO result
          FROM payload.quiz_questions_rels
          WHERE child_id = p_quiz_id;
        END IF;
        
        -- If still no result, try the fallback relationships table
        IF result IS NULL THEN
          SELECT related_ids INTO result
          FROM payload.fallback_relationships
          WHERE collection = 'course_quizzes'
          AND document_id = p_quiz_id
          AND field_name = 'questions';
        END IF;
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create a function to get lesson quiz with fallbacks
    await drizzle.execute(sql`
      CREATE OR REPLACE FUNCTION payload.get_lesson_quiz(
        p_lesson_id TEXT
      )
      RETURNS TEXT AS $$
      DECLARE
        result TEXT;
      BEGIN
        -- First try to get quiz ID from the lesson_quiz_view
        SELECT quiz_id INTO result
        FROM payload.lesson_quiz_view
        WHERE lesson_id = p_lesson_id;
        
        -- If no result, try to get from the relationship table directly
        IF result IS NULL THEN
          SELECT parent_id INTO result
          FROM payload.course_lessons_rels
          WHERE child_id = p_lesson_id
          AND parent_id IN (
            SELECT id FROM payload.course_quizzes
          )
          LIMIT 1;
        END IF;
        
        -- If still no result, try the fallback relationships table
        IF result IS NULL THEN
          SELECT related_ids[1] INTO result
          FROM payload.fallback_relationships
          WHERE collection = 'course_lessons'
          AND document_id = p_lesson_id
          AND field_name = 'quiz'
          AND array_length(related_ids, 1) > 0;
        END IF;
        
        RETURN result;
      END;
      $$ LANGUAGE plpgsql;
    `);

    logger.info(
      { script: 'create-fallback-functions' },
      'Fallback functions created successfully',
    );

    return { success: true };
  } catch (error) {
    logger.error(
      { script: 'create-fallback-functions', error },
      'Failed to create fallback functions',
    );
    return { success: false, error };
  }
}

// Run the function directly if executed as a script
if (require.main === module) {
  createFallbackFunctions()
    .then((result) => {
      if (result.success) {
        console.log('Successfully created fallback functions');
        process.exit(0);
      } else {
        console.error('Failed to create fallback functions:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
