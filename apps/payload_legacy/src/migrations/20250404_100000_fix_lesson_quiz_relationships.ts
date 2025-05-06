import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Fix Lesson Quiz Relationships Migration
 *
 * This migration fixes the relationships between course lessons and quizzes by:
 * 1. Matching lessons to quizzes based on title similarity
 * 2. Updating the quiz_id and quiz_id_id fields in the course_lessons table
 * 3. Creating bidirectional relationships between lessons and quizzes
 * 4. Fixing relationship ID fields in course_quizzes_rels table:
 *    - Adding course_lessons_id column if it doesn't exist
 *    - Updating quiz_questions_id field for questions relationships
 *    - Updating course_lessons_id field for lesson relationships
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running fix lesson quiz relationships migration')

  try {
    // Start transaction
    await db.execute(sql`BEGIN;`)

    // Step 1: Match lessons to quizzes based on title similarity
    console.log('Matching lessons to quizzes based on title similarity...')

    // Get all lessons and quizzes
    const { rows: lessons } = await db.execute<{ id: string; title: string; slug: string }>(sql`
      SELECT id, title, slug FROM payload.course_lessons ORDER BY lesson_number;
    `)

    const { rows: quizzes } = await db.execute<{ id: string; title: string; slug: string }>(sql`
      SELECT id, title, slug FROM payload.course_quizzes ORDER BY title;
    `)

    console.log(`Found ${lessons.length} lessons and ${quizzes.length} quizzes`)

    // Match lessons to quizzes
    const matches = []
    let matchCount = 0

    for (const lesson of lessons) {
      // Skip lessons that already have a quiz
      const { rows: existingQuiz } = await db.execute(sql`
        SELECT quiz_id FROM payload.course_lessons WHERE id = ${lesson.id} AND quiz_id IS NOT NULL;
      `)

      if (existingQuiz.length > 0) {
        console.log(`Lesson "${lesson.title}" already has a quiz assigned, skipping`)
        continue
      }

      // Find a matching quiz
      let matchedQuiz = null

      // First, try exact title match (removing "Quiz" from quiz title)
      for (const quiz of quizzes) {
        const quizTitleWithoutQuiz = quiz.title.replace(' Quiz', '')

        if (lesson.title === quizTitleWithoutQuiz) {
          matchedQuiz = quiz
          console.log(`Found exact match: Lesson "${lesson.title}" -> Quiz "${quiz.title}"`)
          break
        }
      }

      // If no exact match, try fuzzy match
      if (!matchedQuiz) {
        for (const quiz of quizzes) {
          const quizTitleWithoutQuiz = quiz.title.replace(' Quiz', '')

          // Check if lesson title contains quiz title or vice versa
          if (
            lesson.title.includes(quizTitleWithoutQuiz) ||
            quizTitleWithoutQuiz.includes(lesson.title)
          ) {
            matchedQuiz = quiz
            console.log(`Found fuzzy match: Lesson "${lesson.title}" -> Quiz "${quiz.title}"`)
            break
          }
        }
      }

      // If a match was found, add it to the matches array
      if (matchedQuiz) {
        matches.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          quizId: matchedQuiz.id,
          quizTitle: matchedQuiz.title,
        })
        matchCount++
      }
    }

    console.log(`Matched ${matchCount} lessons to quizzes based on title similarity`)

    // Step 2: Update specific lesson-quiz relationships (logic moved from 20250407 migration)
    console.log('Updating specific known lesson-quiz relationships...')

    // Define the specific lesson-quiz pairs to fix
    const specificUpdates = [
      {
        lessonTitle: 'The Why: Building the Introduction',
        quizId: 'a42f601d-f968-4d08-8b46-46bb62a43ad4',
      },
      { lessonTitle: 'The Why: Next Steps', quizId: '98025e2d-2d8f-4a49-960b-e9985c5fa992' },
      { lessonTitle: 'Tables vs. Graphs', quizId: 'a9c824c9-9ce1-4c48-a742-91d31bbb77ea' },
      { lessonTitle: 'Preparation and Practice', quizId: '22fa2e61-c1e4-4a25-9ea8-26ef03cf3b38' },
    ]

    let specificUpdatedCount = 0
    for (const update of specificUpdates) {
      // Verify quiz exists before attempting update
      const { rows: quizExists } = await db.execute(
        sql`SELECT id FROM payload.course_quizzes WHERE id = ${update.quizId};`,
      )
      if (quizExists.length > 0) {
        const { rowCount } = await db.execute(sql`
          UPDATE payload.course_lessons
          SET 
            quiz_id = ${update.quizId},
            quiz_id_id = ${update.quizId}
          WHERE title = ${update.lessonTitle}
          AND (quiz_id IS NULL OR quiz_id_id IS NULL);
        `)
        if (rowCount > 0) {
          specificUpdatedCount += rowCount
          console.log(
            `Specifically updated lesson "${update.lessonTitle}" with quiz ID ${update.quizId}`,
          )
        }
      } else {
        console.log(
          `Skipping specific update for lesson "${update.lessonTitle}" - quiz ID ${update.quizId} not found`,
        )
      }
    }
    console.log(`Specifically updated ${specificUpdatedCount} lessons`)

    // Step 2b: Update the quiz_id and quiz_id_id fields based on title matching (original Step 2)
    console.log('Updating quiz_id and quiz_id_id fields based on title matching...')

    let updatedLessonsCount = 0

    for (const match of matches) {
      const { rowCount } = await db.execute(sql`
        UPDATE payload.course_lessons
        SET 
          quiz_id = ${match.quizId},
          quiz_id_id = ${match.quizId}
        WHERE id = ${match.lessonId}
        AND (quiz_id IS NULL OR quiz_id_id IS NULL);
      `)

      if (rowCount > 0) {
        updatedLessonsCount += rowCount
        console.log(`Updated lesson "${match.lessonTitle}" with quiz "${match.quizTitle}"`)
      }
    }

    console.log(`Updated ${updatedLessonsCount} lessons with quiz relationships`)

    // Step 3: Removed explicit INSERTs into _rels tables. Relying on Payload's internal handling.
    console.log('Skipping explicit INSERT into _rels tables (relying on Payload internal handling)')

    // Step 4: Fix relationship ID fields in course_quizzes_rels table
    console.log('Fixing relationship ID fields in course_quizzes_rels table...')

    // Step 4.1: Add course_lessons_id column if it doesn't exist
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'course_quizzes_rels' 
          AND column_name = 'course_lessons_id'
        ) THEN
          ALTER TABLE payload.course_quizzes_rels ADD COLUMN course_lessons_id uuid;
        END IF;
      END
      $$;
    `)

    console.log("Added course_lessons_id column to course_quizzes_rels table if it didn't exist")

    // Step 4.2: Update quiz_questions_id field for questions relationships
    const { rowCount: updatedQuizQuestionsRels } = await db.execute(sql`
      UPDATE payload.course_quizzes_rels
      SET quiz_questions_id = value
      WHERE field = 'questions'
      AND quiz_questions_id IS NULL
      AND EXISTS (
        SELECT 1 FROM payload.quiz_questions
        WHERE id = value
      );
    `)

    console.log(
      `Updated quiz_questions_id for ${updatedQuizQuestionsRels} quiz question relationships`,
    )

    // Step 4.3: Update course_lessons_id field for lesson relationships
    const { rowCount: updatedLessonRels } = await db.execute(sql`
      UPDATE payload.course_quizzes_rels
      SET course_lessons_id = value
      WHERE field = 'lesson'
      AND course_lessons_id IS NULL
      AND EXISTS (
        SELECT 1 FROM payload.course_lessons
        WHERE id = value
      );
    `)

    console.log(`Updated course_lessons_id for ${updatedLessonRels} lesson relationships`)

    // Step 5: Verify relationships
    const { rows: verificationResult } = await db.execute<{
      lessons_with_quiz: string
      lesson_rels: string
      quiz_rels: string
      quiz_questions_rels: string
      quiz_questions_rels_with_id: string
      lesson_rels_with_id: string
    }>(sql`
      SELECT 
        (SELECT COUNT(*) FROM payload.course_lessons WHERE quiz_id IS NOT NULL) as lessons_with_quiz,
        (SELECT COUNT(*) FROM payload.course_lessons_rels WHERE field = 'quiz_id') as lesson_rels,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'lesson') as quiz_rels,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as quiz_questions_rels,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions' AND quiz_questions_id IS NOT NULL) as quiz_questions_rels_with_id,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'lesson' AND course_lessons_id IS NOT NULL) as lesson_rels_with_id;
    `)

    const lessonsWithQuiz = parseInt(verificationResult[0].lessons_with_quiz)
    const lessonRels = parseInt(verificationResult[0].lesson_rels)
    const quizRels = parseInt(verificationResult[0].quiz_rels)
    const quizQuestionsRels = parseInt(verificationResult[0].quiz_questions_rels)
    const quizQuestionsRelsWithId = parseInt(verificationResult[0].quiz_questions_rels_with_id)
    const lessonRelsWithId = parseInt(verificationResult[0].lesson_rels_with_id)

    console.log(
      `Verification: ${lessonsWithQuiz} lessons with quiz, ${lessonRels} lesson relationships, ${quizRels} quiz relationships`,
    )
    console.log(
      `Quiz questions relationships: ${quizQuestionsRels} total, ${quizQuestionsRelsWithId} with quiz_questions_id set`,
    )
    console.log(
      `Lesson relationships in quizzes: ${quizRels} total, ${lessonRelsWithId} with course_lessons_id set`,
    )

    if (lessonsWithQuiz !== lessonRels || lessonsWithQuiz !== quizRels) {
      console.warn(`Warning: Not all lesson-quiz relationships are bidirectional`)
      console.warn(`- Lessons with quiz: ${lessonsWithQuiz}`)
      console.warn(`- Lesson relationships: ${lessonRels}`)
      console.warn(`- Quiz relationships: ${quizRels}`)
    } else {
      console.log('✅ All lesson-quiz relationships are properly bidirectional')
    }

    if (quizQuestionsRels !== quizQuestionsRelsWithId) {
      console.warn(`Warning: Not all quiz-questions relationships have quiz_questions_id set`)
      console.warn(`- Quiz questions relationships: ${quizQuestionsRels}`)
      console.warn(`- Quiz questions relationships with ID: ${quizQuestionsRelsWithId}`)
    } else {
      console.log('✅ All quiz-questions relationships have quiz_questions_id set')
    }

    if (quizRels !== lessonRelsWithId) {
      console.warn(`Warning: Not all lesson relationships in quizzes have course_lessons_id set`)
      console.warn(`- Quiz relationships: ${quizRels}`)
      console.warn(`- Lesson relationships with ID: ${lessonRelsWithId}`)
    } else {
      console.log('✅ All lesson relationships in quizzes have course_lessons_id set')
    }

    // Step 6: Add global_slug column to payload_locked_documents if it doesn't exist
    console.log('Adding global_slug column to payload_locked_documents table...')
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents'
        ) AND NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'global_slug'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          ADD COLUMN "global_slug" varchar;
          RAISE NOTICE 'Added global_slug column to payload_locked_documents table';
        ELSE
          RAISE NOTICE 'global_slug column already exists or payload_locked_documents table does not exist';
        END IF;
      END
      $$;
    `)
    console.log('Fixed payload_locked_documents schema')

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Fix lesson quiz relationships migration completed successfully')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in fix lesson quiz relationships migration:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for fix lesson quiz relationships')

  try {
    // Remove bidirectional relationships
    await db.execute(sql`
      -- Remove relationships from lessons to quizzes
      DELETE FROM payload.course_lessons_rels
      WHERE field = 'quiz_id';

      -- Remove relationships from quizzes to lessons
      DELETE FROM payload.course_quizzes_rels
      WHERE field = 'lesson';

      -- Clear quiz_id and quiz_id_id fields in course_lessons table
      UPDATE payload.course_lessons
      SET quiz_id = NULL, quiz_id_id = NULL
      WHERE quiz_id IS NOT NULL OR quiz_id_id IS NULL;

      -- Clear relationship ID fields in course_quizzes_rels table
      UPDATE payload.course_quizzes_rels
      SET quiz_questions_id = NULL
      WHERE field = 'questions' AND quiz_questions_id IS NOT NULL;

      UPDATE payload.course_quizzes_rels
      SET course_lessons_id = NULL
      WHERE field = 'lesson' AND course_lessons_id IS NOT NULL;
    `)

    // Remove global_slug column if it exists
    console.log('Removing global_slug column from payload_locked_documents table if it exists...')
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'payload' 
          AND table_name = 'payload_locked_documents' 
          AND column_name = 'global_slug'
        ) THEN
          ALTER TABLE "payload"."payload_locked_documents"
          DROP COLUMN "global_slug";
          RAISE NOTICE 'Removed global_slug column from payload_locked_documents table';
        ELSE
          RAISE NOTICE 'global_slug column does not exist or payload_locked_documents table does not exist';
        END IF;
      END
      $$;
    `)

    console.log('Fix lesson quiz relationships down migration completed successfully')
  } catch (error) {
    console.error('Error in fix lesson quiz relationships down migration:', error)
    throw error
  }
}
