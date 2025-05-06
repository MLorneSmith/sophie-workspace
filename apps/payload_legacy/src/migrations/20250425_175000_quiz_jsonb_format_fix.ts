import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Enhanced Quiz Questions JSONB Migration
 *
 * This migration addresses the issue with JSONB formatting in quiz questions arrays
 * by ensuring they follow the Payload CMS expected format:
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
 */

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Starting Quiz Questions JSONB Format Fix Migration')

  try {
    // Run direct SQL queries to format the JSONB data correctly
    await payload.db.drizzle.execute(`
      -- Begin a transaction for safety
      BEGIN;
      
      -- Ensure questions arrays match the expected format with proper JSONB structure
      WITH quiz_questions AS (
        SELECT 
          _parent_id::text as quiz_id,
          jsonb_agg(
            jsonb_build_object(
              'id', quiz_questions_id,
              'relationTo', 'quiz_questions',
              'value', jsonb_build_object('id', quiz_questions_id)
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
      WHERE q.id::text = qr.quiz_id::text;
      
      -- Special fix for "The Who" Quiz (mentioned in server logs)
      UPDATE payload.course_quizzes
      SET questions = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', quiz_questions_id,
            'relationTo', 'quiz_questions',
            'value', jsonb_build_object('id', quiz_questions_id)
          )
        )
        FROM payload.course_quizzes_rels
        WHERE _parent_id = payload.course_quizzes.id
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      )
      WHERE title LIKE '%Who%'
      AND EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels
        WHERE _parent_id = payload.course_quizzes.id
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      );
      
      -- Special fix for Performance Quiz (mentioned in server logs)
      UPDATE payload.course_quizzes
      SET questions = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', quiz_questions_id,
            'relationTo', 'quiz_questions',
            'value', jsonb_build_object('id', quiz_questions_id)
          )
        )
        FROM payload.course_quizzes_rels
        WHERE _parent_id = payload.course_quizzes.id
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      )
      WHERE title LIKE '%Performance%'
      AND EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels
        WHERE _parent_id = payload.course_quizzes.id
        AND field = 'questions'
        AND quiz_questions_id IS NOT NULL
      );
      
      -- Commit the transaction
      COMMIT;
    `)

    console.log('Quiz Questions JSONB Format Fix successfully applied')

    // Verify the fix
    const verificationResult = await payload.db.drizzle.execute(`
      SELECT COUNT(*) as count
      FROM payload.course_quizzes
      WHERE jsonb_typeof(questions) = 'array'
        AND jsonb_array_length(questions) > 0
        AND questions @> '[{"relationTo": "quiz_questions"}]'
    `)

    console.log(
      `Verification: ${verificationResult.rows[0].count} quizzes now have properly formatted question arrays`,
    )
  } catch (error) {
    console.error('Error applying Quiz Questions JSONB Format Fix:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('No down migration for quiz JSONB format fix as it is a data fix')
  // No down migration needed since this is fixing incorrectly formatted data
  // We don't want to revert to broken data
}
