import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration 20250425_190002_comprehensive_quiz_jsonb_format_fix.ts
 *
 * This migration fixes the JSONB format of quiz questions arrays to match
 * the format expected by Payload CMS for relationship fields.
 *
 * The correct format is:
 * {
 *   "questions": [
 *     {
 *       "id": "unique-entry-id",
 *       "relationTo": "quiz_questions",
 *       "value": {
 *         "id": "related-document-id"
 *       }
 *     }
 *   ]
 * }
 *
 * This provides a comprehensive fix by:
 * 1. Using explicit type casting to handle PostgreSQL type strictness
 * 2. Using JSONB functions for safe construction of complex objects
 * 3. Adding special handling for problem quizzes like "The Who Quiz"
 *
 * UPDATED: Removed ORDER BY clauses to fix column not found error
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Starting Comprehensive Quiz JSONB Format Fix')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Step 1: Log initial state for monitoring
    console.log('Checking current quiz question format...')
    const initialCheck = await db.execute(sql`
      SELECT 
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE jsonb_typeof(questions) = 'array') as array_count,
        COUNT(*) FILTER (WHERE 
          jsonb_typeof(questions) = 'array' AND 
          jsonb_array_length(questions) > 0 AND
          questions @> '[{"relationTo": "quiz_questions"}]'
        ) as formatted_count
      FROM payload.course_quizzes
      WHERE questions IS NOT NULL
    `)

    console.log(`Initial check:
      - Total quizzes: ${initialCheck.rows[0].count}
      - With array questions: ${initialCheck.rows[0].array_count}
      - With properly formatted questions: ${initialCheck.rows[0].formatted_count || 0}
    `)

    // Step 2: Format the questions array for all quizzes based on relationship table
    console.log('Updating all quizzes with properly formatted questions array...')
    await db.execute(sql`
      WITH quiz_questions AS (
        SELECT 
          _parent_id::text as quiz_id,
          jsonb_agg(
            jsonb_build_object(
              'id', quiz_questions_id::text,
              'relationTo', 'quiz_questions'::text,
              'value', jsonb_build_object('id', quiz_questions_id::text)
            )
          ) as formatted_questions
        FROM 
          payload.course_quizzes_rels
        WHERE 
          field = 'questions'
          AND quiz_questions_id IS NOT NULL
        GROUP BY 
          _parent_id
      )
      UPDATE payload.course_quizzes q
      SET questions = qr.formatted_questions
      FROM quiz_questions qr
      WHERE q.id::text = qr.quiz_id::text
    `)

    // Step 3: Special handling for "The Who Quiz" that has errors in logs
    console.log('Adding special handling for "The Who Quiz"...')
    await db.execute(sql`
      UPDATE payload.course_quizzes
      SET questions = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', quiz_questions_id::text,
            'relationTo', 'quiz_questions'::text,
            'value', jsonb_build_object('id', quiz_questions_id::text)
          )
        )
        FROM payload.course_quizzes_rels
        WHERE _parent_id::text = payload.course_quizzes.id::text
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      )
      WHERE id::text = 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0'::text  -- The Who Quiz ID
      AND EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels
        WHERE _parent_id::text = 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0'::text
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      )
    `)

    // Step 4: Special handling for Performance Quiz
    console.log('Adding special handling for Performance Quiz...')
    await db.execute(sql`
      UPDATE payload.course_quizzes
      SET questions = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', quiz_questions_id::text,
            'relationTo', 'quiz_questions'::text,
            'value', jsonb_build_object('id', quiz_questions_id::text)
          )
        )
        FROM payload.course_quizzes_rels
        WHERE _parent_id::text = payload.course_quizzes.id::text
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      )
      WHERE title LIKE '%Performance%'
      AND EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels
        WHERE _parent_id::text = payload.course_quizzes.id::text
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      )
    `)

    // Step 5: Handle any case where quiz has no questions relationship records
    // but does have questions array data (unlinked questions)
    console.log('Handling quizzes with array data but no relationship records...')
    await db.execute(sql`
      WITH quizzes_needing_format AS (
        SELECT 
          q.id::text as quiz_id,
          q.questions
        FROM 
          payload.course_quizzes q
        LEFT JOIN 
          payload.course_quizzes_rels r
        ON 
          q.id::text = r._parent_id::text
          AND r.field = 'questions'
        WHERE 
          jsonb_typeof(q.questions) = 'array'
          AND jsonb_array_length(q.questions) > 0
          AND NOT (q.questions @> '[{"relationTo": "quiz_questions"}]')
          AND r._parent_id IS NULL
      )
      UPDATE payload.course_quizzes q
      SET questions = (
        WITH elements AS (
          SELECT 
            jsonb_array_elements(qnf.questions) as element
          FROM 
            quizzes_needing_format qnf
          WHERE 
            qnf.quiz_id = q.id::text
        )
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', COALESCE(
              (e.element->>'id'), 
              (e.element#>>'{}')::text
            ),
            'relationTo', 'quiz_questions',
            'value', jsonb_build_object(
              'id', COALESCE(
                (e.element->>'id'), 
                (e.element#>>'{}')::text
              )
            )
          )
        )
        FROM elements e
      )
      FROM quizzes_needing_format qnf
      WHERE q.id::text = qnf.quiz_id
    `)

    // Step 6: Final verification to confirm success
    console.log('Verifying quiz question format after fix...')
    const finalCheck = await db.execute(sql`
      SELECT 
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE jsonb_typeof(questions) = 'array') as array_count,
        COUNT(*) FILTER (WHERE 
          jsonb_typeof(questions) = 'array' AND 
          jsonb_array_length(questions) > 0 AND
          questions @> '[{"relationTo": "quiz_questions"}]'
        ) as formatted_count
      FROM payload.course_quizzes
      WHERE questions IS NOT NULL
    `)

    console.log(`Final check:
      - Total quizzes: ${finalCheck.rows[0].count}
      - With array questions: ${finalCheck.rows[0].array_count}
      - With properly formatted questions: ${finalCheck.rows[0].formatted_count || 0}
    `)

    // Create a simple verification function for ongoing checks
    console.log('Creating verification function...')
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION payload.verify_quiz_questions_jsonb_format()
      RETURNS TABLE(
        quiz_id text,
        quiz_title text,
        has_questions boolean,
        is_array boolean,
        is_formatted boolean,
        question_count integer
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          id::text as quiz_id,
          title as quiz_title,
          questions IS NOT NULL as has_questions,
          jsonb_typeof(questions) = 'array' as is_array,
          CASE 
            WHEN jsonb_typeof(questions) != 'array' THEN false
            WHEN jsonb_array_length(questions) = 0 THEN false
            WHEN NOT (questions @> '[{"relationTo": "quiz_questions"}]') THEN false
            ELSE true
          END as is_formatted,
          CASE 
            WHEN jsonb_typeof(questions) = 'array' THEN jsonb_array_length(questions)
            ELSE 0
          END as question_count
        FROM 
          payload.course_quizzes
        WHERE
          questions IS NOT NULL
        ORDER BY
          title;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Commit the transaction
    await db.execute(sql`COMMIT;`)

    console.log('Comprehensive Quiz JSONB Format Fix completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in Quiz JSONB Format Fix:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('No down migration needed for JSONB format fix as it is a data correction')
  // We don't roll back data format corrections as they fix the data to match the expected format
}
