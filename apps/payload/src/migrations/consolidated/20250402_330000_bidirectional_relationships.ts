import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Bidirectional Relationship Migration
 *
 * This migration establishes bidirectional relationships between collections
 * by creating entries in both relationship tables.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Running bidirectional relationship migration')

  try {
    // Update quiz_id_id column to match quiz_id column
    await db.execute(sql`
      UPDATE payload.quiz_questions
      SET quiz_id_id = quiz_id
      WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL;
    `)

    // Create bidirectional relationships between surveys and questions
    await db.execute(sql`
      WITH questions_to_link AS (
        SELECT sq.id as question_id, sqr.surveys_id as survey_id
        FROM payload.survey_questions sq
        JOIN payload.survey_questions_rels sqr ON sq.id = sqr._parent_id
        WHERE sqr.surveys_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.surveys_rels sr
          WHERE sr._parent_id = sqr.surveys_id
          AND sr.field = 'questions'
          AND sr.value = sq.id
        )
      )
      INSERT INTO payload.surveys_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT 
        gen_random_uuid(), 
        survey_id, 
        'questions', 
        question_id,
        NOW(),
        NOW()
      FROM questions_to_link;
    `)

    // Insert relationships into quiz_questions_rels table
    await db.execute(sql`
      WITH questions_to_fix AS (
        SELECT id, quiz_id
        FROM payload.quiz_questions qq
        WHERE quiz_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payload.quiz_questions_rels qr
          WHERE qr._parent_id = qq.id
          AND qr.field = 'quiz_id'
        )
      )
      INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, updated_at, created_at)
      SELECT 
        gen_random_uuid(), 
        id, 
        'quiz_id', 
        quiz_id,
        NOW(),
        NOW()
      FROM questions_to_fix;
    `)

    // Insert bidirectional relationships into course_quizzes_rels table
    await db.execute(sql`
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

    // Get the count of created relationships for verification
    const surveyRelCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM payload.surveys_rels WHERE field = 'questions';
    `)

    const quizQuestionsRelCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM payload.quiz_questions_rels WHERE field = 'quiz_id';
    `)

    const courseQuizzesRelCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM payload.course_quizzes_rels WHERE field = 'questions';
    `)

    console.log(
      `Created ${surveyRelCount.rows[0]?.count || 0} bidirectional relationships in surveys_rels table`,
    )
    console.log(
      `Created ${quizQuestionsRelCount.rows[0]?.count || 0} relationships in quiz_questions_rels table`,
    )
    console.log(
      `Created ${courseQuizzesRelCount.rows[0]?.count || 0} bidirectional relationships in course_quizzes_rels table`,
    )

    console.log('Bidirectional relationship migration completed successfully')
  } catch (error) {
    console.error('Error in bidirectional relationship migration:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for bidirectional relationships')

  try {
    // Remove bidirectional relationships from surveys_rels table
    await db.execute(sql`
      DELETE FROM payload.surveys_rels
      WHERE field = 'questions';
    `)

    // Remove bidirectional relationships from course_quizzes_rels table
    await db.execute(sql`
      DELETE FROM payload.course_quizzes_rels
      WHERE field = 'questions';
    `)

    console.log('Bidirectional relationship down migration completed successfully')
  } catch (error) {
    console.error('Error in bidirectional relationship down migration:', error)
    throw error
  }
}
