import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Final Fix for Quiz Questions Bidirectional Relationships
 *
 * This migration fixes the bidirectional relationships between quizzes and questions:
 * 1. Updates quiz_id_id column to match quiz_id column
 * 2. Creates entries in quiz_questions_rels table for each quiz question
 * 3. Ensures bidirectional relationships are properly established
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Running final fix for quiz questions bidirectional relationships')

  try {
    // Execute all SQL in a single statement
    await payload.db.drizzle.execute(sql`
      -- Step 1: Update quiz_id_id column to match quiz_id column
      UPDATE payload.quiz_questions
      SET quiz_id_id = quiz_id
      WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL;

      -- Step 2: Ensure the quiz_questions_rels table exists
      DO $$
      BEGIN
        -- Create the table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'quiz_questions_rels'
        ) THEN
          CREATE TABLE payload.quiz_questions_rels (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            _parent_id uuid REFERENCES payload.quiz_questions(id) ON DELETE CASCADE,
            field VARCHAR(255),
            value uuid,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;
      END $$;

      -- Step 3: Insert relationships into quiz_questions_rels table
      WITH questions_to_fix AS (
        SELECT id, quiz_id
        FROM payload.quiz_questions qq
        WHERE quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.quiz_questions_rels qr
          WHERE qr._parent_id = qq.id
          AND qr.field = 'quiz_id_id'
        )
      )
      INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT 
        gen_random_uuid(), 
        id, 
        'quiz_id_id', 
        quiz_id,
        NOW(),
        NOW()
      FROM questions_to_fix;

      -- Step 4: Ensure the course_quizzes_rels table exists
      DO $$
      BEGIN
        -- Create the table if it doesn't exist
        IF NOT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels'
        ) THEN
          CREATE TABLE payload.course_quizzes_rels (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            _parent_id uuid REFERENCES payload.course_quizzes(id) ON DELETE CASCADE,
            field VARCHAR(255),
            value uuid,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        END IF;
      END $$;

      -- Step 5: Insert bidirectional relationships into course_quizzes_rels table
      WITH questions_to_fix AS (
        SELECT id, quiz_id
        FROM payload.quiz_questions qq
        WHERE quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.course_quizzes_rels cqr
          WHERE cqr._parent_id = qq.quiz_id
          AND cqr.field = 'questions'
          AND cqr.value = qq.id
        )
      )
      INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT 
        gen_random_uuid(), 
        quiz_id, 
        'questions', 
        id,
        NOW(),
        NOW()
      FROM questions_to_fix;
    `)

    // Verify the updates
    const verificationResult = await payload.db.drizzle.execute(sql`
      -- Count quiz questions with quiz_id_id
      SELECT 
        (SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id_id IS NOT NULL) as quiz_id_id_count,
        (SELECT COUNT(*) FROM payload.quiz_questions_rels WHERE field = 'quiz_id_id') as rels_count,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as bidirectional_count,
        (SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id IS NOT NULL) as total_questions;
    `)

    const result = verificationResult.rows[0]
    const quizIdIdCount = parseInt(result?.quiz_id_id_count || '0')
    const relsCount = parseInt(result?.rels_count || '0')
    const bidirectionalCount = parseInt(result?.bidirectional_count || '0')
    const totalQuestions = parseInt(result?.total_questions || '0')

    console.log(`Final verification:`)
    console.log(`- Quiz questions with quiz_id_id: ${quizIdIdCount} / ${totalQuestions}`)
    console.log(`- Relationships in quiz_questions_rels: ${relsCount} / ${totalQuestions}`)
    console.log(
      `- Bidirectional relationships in course_quizzes_rels: ${bidirectionalCount} / ${totalQuestions}`,
    )

    if (
      quizIdIdCount === totalQuestions &&
      relsCount === totalQuestions &&
      bidirectionalCount === totalQuestions
    ) {
      console.log('✅ All relationships are properly established')
    } else {
      console.log('❌ Some relationships are still missing')
    }

    console.log('Successfully completed final fix for quiz questions bidirectional relationships')
  } catch (error) {
    console.error('Error fixing quiz questions bidirectional relationships:', error)
    throw error
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert quiz questions bidirectional relationships fix')

  try {
    await payload.db.drizzle.execute(sql`
      -- Remove bidirectional entries from course_quizzes_rels table
      DELETE FROM payload.course_quizzes_rels
      WHERE field = 'questions';

      -- Remove entries from quiz_questions_rels table
      DELETE FROM payload.quiz_questions_rels
      WHERE field = 'quiz_id_id';

      -- Set quiz_id_id to NULL in quiz_questions table
      UPDATE payload.quiz_questions
      SET quiz_id_id = NULL
      WHERE quiz_id_id IS NOT NULL;
    `)

    console.log('Successfully reverted quiz questions bidirectional relationships fix')
  } catch (error) {
    console.error('Error reverting quiz questions bidirectional relationships fix:', error)
    throw error
  }
}
