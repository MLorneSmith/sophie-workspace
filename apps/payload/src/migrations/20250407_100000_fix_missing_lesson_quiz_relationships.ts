import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix Missing Lesson Quiz Relationships Migration
 *
 * This migration fixes the relationships between specific course lessons and quizzes that
 * were missed by the previous fix_lesson_quiz_relationships migration.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log(
    'Skipping fix missing lesson quiz relationships migration - logic moved to 20250404_100000',
  )
  // try {
  //   // Start transaction
  //   await db.execute(sql`BEGIN;`)
  //   // Step 1: Verify that the quizzes exist before updating relationships
  //   console.log('Verifying quizzes exist...')
  //   const { rows: quizzes } = await db.execute<{ id: string; title: string }>(sql`
  //     SELECT id, title FROM payload.course_quizzes
  //     WHERE id IN (
  //       'a42f601d-f968-4d08-8b46-46bb62a43ad4', -- The Why (Introductions) Quiz
  //       '98025e2d-2d8f-4a49-960b-e9985c5fa992', -- The Why (Next Steps) Quiz
  //       'a9c824c9-9ce1-4c48-a742-91d31bbb77ea', -- Tables vs Graphs Quiz
  //       '22fa2e61-c1e4-4a25-9ea8-26ef03cf3b38'  -- Perparation & Practice Quiz
  //     );
  //   `)
  //   // Create a map of quiz IDs to titles for easier lookup
  //   const quizMap = new Map<string, string>()
  //   quizzes.forEach((quiz) => {
  //     quizMap.set(quiz.id, quiz.title)
  //   })
  //   console.log(`Found ${quizzes.length} quizzes:`)
  //   quizzes.forEach((quiz) => {
  //     console.log(`- ${quiz.id}: ${quiz.title}`)
  //   })
  //   // Step 2: Update specific lesson-quiz relationships only for quizzes that exist
  //   console.log('Updating specific lesson-quiz relationships...')
  //   // Update "The Why: Building the Introduction" lesson
  //   if (quizMap.has('a42f601d-f968-4d08-8b46-46bb62a43ad4')) {
  //     const { rowCount: introductionsUpdated } = await db.execute(sql`
  //       UPDATE payload.course_lessons
  //       SET quiz_id = 'a42f601d-f968-4d08-8b46-46bb62a43ad4', -- The Why (Introductions) Quiz
  //           quiz_id_id = 'a42f601d-f968-4d08-8b46-46bb62a43ad4'
  //       WHERE title = 'The Why: Building the Introduction'
  //       AND (quiz_id IS NULL OR quiz_id_id IS NULL);
  //     `)
  //     console.log(
  //       `Updated ${introductionsUpdated} rows for "The Why: Building the Introduction" lesson`,
  //     )
  //   } else {
  //     console.log('Skipping "The Why: Building the Introduction" lesson - quiz not found')
  //   }
  //   // Update "The Why: Next Steps" lesson
  //   if (quizMap.has('98025e2d-2d8f-4a49-960b-e9985c5fa992')) {
  //     const { rowCount: nextStepsUpdated } = await db.execute(sql`
  //       UPDATE payload.course_lessons
  //       SET quiz_id = '98025e2d-2d8f-4a49-960b-e9985c5fa992', -- The Why (Next Steps) Quiz
  //           quiz_id_id = '98025e2d-2d8f-4a49-960b-e9985c5fa992'
  //       WHERE title = 'The Why: Next Steps'
  //       AND (quiz_id IS NULL OR quiz_id_id IS NULL);
  //     `)
  //     console.log(`Updated ${nextStepsUpdated} rows for "The Why: Next Steps" lesson`)
  //   } else {
  //     console.log('Skipping "The Why: Next Steps" lesson - quiz not found')
  //   }
  //   // Update "Tables vs. Graphs" lesson
  //   if (quizMap.has('a9c824c9-9ce1-4c48-a742-91d31bbb77ea')) {
  //     const { rowCount: tablesGraphsUpdated } = await db.execute(sql`
  //       UPDATE payload.course_lessons
  //       SET quiz_id = 'a9c824c9-9ce1-4c48-a742-91d31bbb77ea', -- Tables vs Graphs Quiz
  //           quiz_id_id = 'a9c824c9-9ce1-4c48-a742-91d31bbb77ea'
  //       WHERE title = 'Tables vs. Graphs'
  //       AND (quiz_id IS NULL OR quiz_id_id IS NULL);
  //     `)
  //     console.log(`Updated ${tablesGraphsUpdated} rows for "Tables vs. Graphs" lesson`)
  //   } else {
  //     console.log('Skipping "Tables vs. Graphs" lesson - quiz not found')
  //   }
  //   // Update "Preparation and Practice" lesson
  //   if (quizMap.has('22fa2e61-c1e4-4a25-9ea8-26ef03cf3b38')) {
  //     const { rowCount: prepPracticeUpdated } = await db.execute(sql`
  //       UPDATE payload.course_lessons
  //       SET quiz_id = '22fa2e61-c1e4-4a25-9ea8-26ef03cf3b38', -- Perparation & Practice Quiz (note the typo)
  //           quiz_id_id = '22fa2e61-c1e4-4a25-9ea8-26ef03cf3b38'
  //       WHERE title = 'Preparation and Practice'
  //       AND (quiz_id IS NULL OR quiz_id_id IS NULL);
  //     `)
  //     console.log(`Updated ${prepPracticeUpdated} rows for "Preparation and Practice" lesson`)
  //   } else {
  //     console.log('Skipping "Preparation and Practice" lesson - quiz not found')
  //   }
  //   // Step 3: Create bidirectional relationships between lessons and quizzes
  //   console.log('Creating bidirectional relationships for specifically updated lessons...')
  //   // Step 3.1: Create relationships from lessons to quizzes (course_lessons_rels) - TARGETED
  //   // Only insert for the lessons specifically updated in Step 2 of this migration
  //   const { rowCount: lessonRelsAdded } = await db.execute(sql`
  //     WITH lessons_to_link AS (
  //       SELECT id as lesson_id, quiz_id
  //       FROM payload.course_lessons
  //       WHERE title IN ( -- Target only the specific lessons handled in Step 2
  //         'The Why: Building the Introduction',
  //         'The Why: Next Steps',
  //         'Tables vs. Graphs',
  //         'Preparation and Practice'
  //       )
  //       AND quiz_id IS NOT NULL
  //       AND NOT EXISTS ( -- Still check for existing relationships
  //         SELECT 1 FROM payload.course_lessons_rels
  //         WHERE _parent_id = id
  //         AND field = 'quiz_id'
  //         AND value = quiz_id
  //       )
  //     )
  //     INSERT INTO payload.course_lessons_rels (id, _parent_id, field, value, created_at, updated_at)
  //     SELECT
  //       gen_random_uuid(),
  //       lesson_id,
  //       'quiz_id',
  //       quiz_id,
  //       NOW(),
  //       NOW()
  //     FROM lessons_to_link;
  //   `)
  //   console.log(`Created ${lessonRelsAdded} specific relationships in course_lessons_rels table`)
  //   // Step 3.2: Create relationships from quizzes to lessons (course_quizzes_rels) - TARGETED
  //   // Only insert for the quizzes linked to the specific lessons updated in Step 2
  //   const { rowCount: quizRelsAdded } = await db.execute(sql`
  //     WITH quizzes_to_link AS (
  //       SELECT id as lesson_id, quiz_id
  //       FROM payload.course_lessons
  //       WHERE title IN ( -- Target only the specific lessons handled in Step 2
  //         'The Why: Building the Introduction',
  //         'The Why: Next Steps',
  //         'Tables vs. Graphs',
  //         'Preparation and Practice'
  //       )
  //       AND quiz_id IS NOT NULL
  //       AND NOT EXISTS ( -- Still check for existing relationships
  //         SELECT 1 FROM payload.course_quizzes_rels
  //         WHERE _parent_id = quiz_id
  //         AND field = 'lesson'
  //         AND value = id
  //       )
  //     )
  //     INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at)
  //     SELECT
  //       gen_random_uuid(),
  //       quiz_id,
  //       'lesson',
  //       lesson_id,
  //       NOW(),
  //       NOW()
  //     FROM quizzes_to_link;
  //   `)
  //   console.log(`Created ${quizRelsAdded} specific relationships in course_quizzes_rels table`)
  //   // Step 4: Verify relationships
  //   const { rows: verificationResult } = await db.execute<{
  //     lessons_with_quiz: string
  //     lesson_rels: string
  //     quiz_rels: string
  //   }>(sql`
  //     SELECT
  //       (SELECT COUNT(*) FROM payload.course_lessons WHERE quiz_id IS NOT NULL) as lessons_with_quiz,
  //       (SELECT COUNT(*) FROM payload.course_lessons_rels WHERE field = 'quiz_id') as lesson_rels,
  //       (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'lesson') as quiz_rels;
  //   `)
  //   const lessonsWithQuiz = parseInt(verificationResult[0].lessons_with_quiz)
  //   const lessonRels = parseInt(verificationResult[0].lesson_rels)
  //   const quizRels = parseInt(verificationResult[0].quiz_rels)
  //   console.log(
  //     `Verification: ${lessonsWithQuiz} lessons with quiz, ${lessonRels} lesson relationships, ${quizRels} quiz relationships`,
  //   )
  //   if (lessonsWithQuiz !== lessonRels || lessonsWithQuiz !== quizRels) {
  //     console.warn(`Warning: Not all lesson-quiz relationships are bidirectional`)
  //     console.warn(`- Lessons with quiz: ${lessonsWithQuiz}`)
  //     console.warn(`- Lesson relationships: ${lessonRels}`)
  //     console.warn(`- Quiz relationships: ${quizRels}`)
  //   } else {
  //     console.log('✅ All lesson-quiz relationships are properly bidirectional')
  //   }
  //   // Commit transaction
  //   await db.execute(sql`COMMIT;`)
  //   console.log('Fix missing lesson quiz relationships migration completed successfully')
  // } catch (error) {
  //   // Rollback on error
  //   await db.execute(sql`ROLLBACK;`)
  //   console.error('Error in fix missing lesson quiz relationships migration:', error)
  //   throw error
  // }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for fix missing lesson quiz relationships')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Remove the specific relationships we added
    await db.execute(sql`
      -- Remove quiz_id and quiz_id_id for "The Why: Building the Introduction" lesson
      UPDATE payload.course_lessons
      SET quiz_id = NULL, quiz_id_id = NULL
      WHERE title = 'The Why: Building the Introduction';

      -- Remove quiz_id and quiz_id_id for "The Why: Next Steps" lesson
      UPDATE payload.course_lessons
      SET quiz_id = NULL, quiz_id_id = NULL
      WHERE title = 'The Why: Next Steps';

      -- Remove quiz_id and quiz_id_id for "Tables vs. Graphs" lesson
      UPDATE payload.course_lessons
      SET quiz_id = NULL, quiz_id_id = NULL
      WHERE title = 'Tables vs. Graphs';

      -- Remove quiz_id and quiz_id_id for "Preparation and Practice" lesson
      UPDATE payload.course_lessons
      SET quiz_id = NULL, quiz_id_id = NULL
      WHERE title = 'Preparation and Practice';
    `)

    // Remove bidirectional relationships for these lessons
    await db.execute(sql`
      -- Get the IDs of the lessons we updated
      WITH updated_lessons AS (
        SELECT id
        FROM payload.course_lessons
        WHERE title IN (
          'The Why: Building the Introduction',
          'The Why: Next Steps',
          'Tables vs. Graphs',
          'Preparation and Practice'
        )
      )
      -- Remove relationships from lessons to quizzes
      DELETE FROM payload.course_lessons_rels
      WHERE _parent_id IN (SELECT id FROM updated_lessons)
      AND field = 'quiz_id';
    `)

    await db.execute(sql`
      -- Get the IDs of the quizzes we linked
      WITH linked_quizzes AS (
        SELECT id
        FROM payload.course_quizzes
        WHERE title IN (
          'The Why (Introductions) Quiz',
          'The Why (Next Steps) Quiz',
          'Tables vs Graphs Quiz',
          'Perparation & Practice Quiz'
        )
      )
      -- Remove relationships from quizzes to lessons
      DELETE FROM payload.course_quizzes_rels
      WHERE _parent_id IN (SELECT id FROM linked_quizzes)
      AND field = 'lesson';
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Fix missing lesson quiz relationships down migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in fix missing lesson quiz relationships down migration:', error)
    throw error
  }
}
