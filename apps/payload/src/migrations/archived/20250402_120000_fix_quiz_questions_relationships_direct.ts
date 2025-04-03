import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Direct Fix for Quiz Questions Relationships
 *
 * This migration directly addresses the issues with quiz questions relationships:
 * 1. Updates quiz_id_id column to match quiz_id column using a direct approach
 * 2. Creates entries in quiz_questions_rels table for each quiz question
 * 3. Ensures bidirectional relationships are properly established
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running direct fix for quiz questions relationships')

  try {
    // Step 1: Get a count of quiz questions with quiz_id but no quiz_id_id
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM payload.quiz_questions 
      WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL
    `)

    const countToFix = parseInt(countResult.rows?.[0]?.count || '0')
    console.log(`Found ${countToFix} quiz questions that need quiz_id_id values`)

    if (countToFix > 0) {
      // Step 2: Directly update quiz_id_id column to match quiz_id column
      console.log('Directly updating quiz_id_id column to match quiz_id column...')
      await db.execute(sql`
        UPDATE payload.quiz_questions 
        SET quiz_id_id = quiz_id 
        WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL
      `)

      console.log(`Updated quiz_id_id for ${countToFix} quiz questions`)
    } else {
      console.log('No quiz questions need quiz_id_id updates')
    }

    // Step 3: Check if quiz_questions_rels table has the necessary relationships
    const relsCountResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM payload.quiz_questions_rels 
      WHERE field = 'quiz_id_id'
    `)

    const relsCount = parseInt(relsCountResult.rows?.[0]?.count || '0')
    const totalQuestionsResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM payload.quiz_questions 
      WHERE quiz_id IS NOT NULL
    `)

    const totalQuestions = parseInt(totalQuestionsResult.rows?.[0]?.count || '0')

    if (relsCount < totalQuestions) {
      // Step 4: Create entries in quiz_questions_rels table
      console.log('Creating missing entries in quiz_questions_rels table...')

      // First, ensure the table exists and has the necessary columns
      await db.execute(sql`DO $$
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
END $$`)

      // Then insert the relationships
      const insertResult = await db.execute(sql`WITH questions_to_fix AS (
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
FROM questions_to_fix
RETURNING id`)

      // Get the count of inserted rows
      const insertedCount = insertResult.rows?.length || 0
      console.log(`Created ${insertedCount} new relationships in quiz_questions_rels table`)
    } else {
      console.log('All quiz questions already have relationships in quiz_questions_rels table')
    }

    // Step 5: Check if bidirectional relationships exist in course_quizzes_rels table
    const bidirectionalCountResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM payload.course_quizzes_rels 
      WHERE field = 'questions'
    `)

    const bidirectionalCount = parseInt(bidirectionalCountResult.rows?.[0]?.count || '0')

    if (bidirectionalCount < totalQuestions) {
      // Step 6: Create bidirectional relationships in course_quizzes_rels table
      console.log('Creating missing bidirectional relationships in course_quizzes_rels table...')

      // First, ensure the table exists and has the necessary columns
      await db.execute(sql`DO $$
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
END $$`)

      // Then insert the bidirectional relationships
      const bidirectionalInsertResult = await db.execute(sql`WITH questions_to_fix AS (
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
FROM questions_to_fix
RETURNING id`)

      // Get the count of inserted rows
      const bidirectionalInsertedCount = bidirectionalInsertResult.rows?.length || 0
      console.log(
        `Created ${bidirectionalInsertedCount} new bidirectional relationships in course_quizzes_rels table`,
      )
    } else {
      console.log(
        'All quiz questions already have bidirectional relationships in course_quizzes_rels table',
      )
    }

    // Step 7: Verify the updates
    const finalQuizIdIdCountResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM payload.quiz_questions 
      WHERE quiz_id_id IS NOT NULL
    `)

    const finalQuizIdIdCount = parseInt(finalQuizIdIdCountResult.rows?.[0]?.count || '0')

    const finalRelsCountResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM payload.quiz_questions_rels 
      WHERE field = 'quiz_id_id'
    `)

    const finalRelsCount = parseInt(finalRelsCountResult.rows?.[0]?.count || '0')

    const finalBidirectionalCountResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM payload.course_quizzes_rels 
      WHERE field = 'questions'
    `)

    const finalBidirectionalCount = parseInt(finalBidirectionalCountResult.rows?.[0]?.count || '0')

    console.log(`Final verification:`)
    console.log(`- Quiz questions with quiz_id_id: ${finalQuizIdIdCount} / ${totalQuestions}`)
    console.log(`- Relationships in quiz_questions_rels: ${finalRelsCount} / ${totalQuestions}`)
    console.log(
      `- Bidirectional relationships in course_quizzes_rels: ${finalBidirectionalCount} / ${totalQuestions}`,
    )

    if (
      finalQuizIdIdCount === totalQuestions &&
      finalRelsCount === totalQuestions &&
      finalBidirectionalCount === totalQuestions
    ) {
      console.log('✅ All relationships are properly established')
    } else {
      console.log('❌ Some relationships are still missing')
    }

    console.log('Successfully completed direct fix for quiz questions relationships')
  } catch (error) {
    console.error('Error fixing quiz questions relationships:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running migration to revert direct quiz questions relationships fix')

  try {
    // Step 1: Remove bidirectional entries from course_quizzes_rels table
    await db.execute(sql`
      DELETE FROM payload.course_quizzes_rels 
      WHERE field = 'questions'
    `)

    // Step 2: Remove entries from quiz_questions_rels table
    await db.execute(sql`
      DELETE FROM payload.quiz_questions_rels 
      WHERE field = 'quiz_id_id'
    `)

    // Step 3: Set quiz_id_id to NULL in quiz_questions table
    await db.execute(sql`
      UPDATE payload.quiz_questions 
      SET quiz_id_id = NULL 
      WHERE quiz_id_id IS NOT NULL
    `)

    console.log('Successfully reverted direct quiz questions relationships fix')
  } catch (error) {
    console.error('Error reverting direct quiz questions relationships fix:', error)
    throw error
  }
}
