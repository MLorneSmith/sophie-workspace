import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Content Processing Migration
 *
 * This migration executes SQL seed files to populate content in the database.
 * It also fixes relationship issues and verifies that content was properly populated.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running content processing migration')

  try {
    // Get the current file's directory
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    // Define the path to the SQL seed files
    const seedDir = path.resolve(__dirname, '../seed/sql')

    // Define the SQL seed files in the order they should be executed
    const seedFiles = [
      '01-courses.sql',
      '07-media.sql',
      '02-lessons.sql',
      '03-quizzes.sql',
      '04-questions.sql',
      '05-surveys.sql',
      // Replace the problematic file with individual files
      '06a-feedback-survey-questions.sql',
      '06b-assessment-survey-questions.sql',
      '06c-three-questions-survey-questions.sql',
      '07-documentation.sql',
      '08-posts.sql',
      '09-fix-quiz-questions.sql',
    ]

    // Execute each SQL file
    for (const file of seedFiles) {
      const filePath = path.join(seedDir, file)

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`SQL seed file not found: ${file}. Skipping.`)
        continue
      }

      console.log(`Executing SQL seed file: ${file}`)

      // Read the SQL file
      const sqlContent = fs.readFileSync(filePath, 'utf8')

      // Execute the SQL
      await db.execute(sql.raw(sqlContent))

      console.log(`Successfully executed SQL seed file: ${file}`)
    }

    // Fix relationships between collections
    await fixRelationships(db)

    // Verify content was added and relationships are correct
    await verifyContent(db)

    console.log('Content processing migration completed successfully')
  } catch (error) {
    console.error('Error in content processing migration:', error)
    throw error
  }
}

/**
 * Fixes relationship issues between collections
 */
async function fixRelationships(db: any) {
  console.log('Fixing relationships between collections...')

  // Start a transaction
  await db.execute(sql`BEGIN`)

  try {
    // 1. Fix Course Lessons Relationships
    console.log('Fixing course_lessons relationships...')

    // Update course_id_id to match course_id
    const { rowCount: courseLessonsUpdated } = await db.execute(sql`
      UPDATE payload.course_lessons 
      SET course_id_id = course_id 
      WHERE course_id IS NOT NULL AND course_id_id IS NULL
    `)
    console.log(`Updated course_id_id for ${courseLessonsUpdated} course lessons`)

    // Update quiz_id_id to match quiz_id
    const { rowCount: quizLessonsUpdated } = await db.execute(sql`
      UPDATE payload.course_lessons 
      SET quiz_id_id = quiz_id 
      WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL
    `)
    console.log(`Updated quiz_id_id for ${quizLessonsUpdated} course lessons`)

    // Update featured_image_id_id to match featured_image_id
    const { rowCount: featuredImageLessonsUpdated } = await db.execute(sql`
      UPDATE payload.course_lessons 
      SET featured_image_id_id = featured_image_id 
      WHERE featured_image_id IS NOT NULL AND featured_image_id_id IS NULL
    `)
    console.log(`Updated featured_image_id_id for ${featuredImageLessonsUpdated} course lessons`)

    // 2. Fix Course Quizzes Relationships
    console.log('Fixing course_quizzes relationships...')

    // Create missing bidirectional relationships from quizzes to questions
    const { rowCount: quizRelationshipsAdded } = await db.execute(sql`
      INSERT INTO payload.course_quizzes_rels (
        id,
        _parent_id,
        field,
        value,
        quiz_questions_id,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        q.quiz_id_id,
        'questions',
        q.id,
        q.id,
        NOW(),
        NOW()
      FROM payload.quiz_questions q
      WHERE q.quiz_id_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels r
        WHERE r._parent_id = q.quiz_id_id
        AND r.field = 'questions'
        AND r.value = q.id
      )
    `)
    console.log(`Added ${quizRelationshipsAdded} missing quiz-to-question relationships`)

    // 3. Fix Documentation Nested Structure
    console.log('Fixing documentation nested structure...')

    // Create missing parent-child relationships
    const { rowCount: docRelationshipsAdded } = await db.execute(sql`
      INSERT INTO payload.documentation_rels (
        id,
        _parent_id,
        field,
        value,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        d.parent_id,
        'children',
        d.id,
        NOW(),
        NOW()
      FROM payload.documentation d
      WHERE d.parent_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM payload.documentation_rels r
        WHERE r._parent_id = d.parent_id
        AND r.field = 'children'
        AND r.value = d.id
      )
    `)
    console.log(`Added ${docRelationshipsAdded} missing documentation parent-child relationships`)

    // 4. Fix Media Relationships
    console.log('Fixing media relationships...')

    // Create missing bidirectional relationships from course lessons to media
    const { rowCount: mediaRelationshipsAdded } = await db.execute(sql`
      INSERT INTO payload.course_lessons_rels (
        id,
        _parent_id,
        field,
        value,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        l.id,
        'featured_image',
        l.featured_image_id,
        NOW(),
        NOW()
      FROM payload.course_lessons l
      WHERE l.featured_image_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM payload.course_lessons_rels r
        WHERE r._parent_id = l.id
        AND r.field = 'featured_image'
        AND r.value = l.featured_image_id
      )
    `)
    console.log(`Added ${mediaRelationshipsAdded} missing lesson-to-media relationships`)

    // 5. Fix Posts Media Relationships
    console.log('Fixing posts media relationships...')

    // Update image_id_id to match image_id
    const { rowCount: postsImageUpdated } = await db.execute(sql`
      UPDATE payload.posts 
      SET image_id_id = image_id 
      WHERE image_id IS NOT NULL AND image_id_id IS NULL
    `)
    console.log(`Updated image_id_id for ${postsImageUpdated} posts`)

    // Create missing bidirectional relationships from posts to media
    const { rowCount: postMediaRelationshipsAdded } = await db.execute(sql`
      INSERT INTO payload.posts_rels (
        id,
        _parent_id,
        field,
        value,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        p.id,
        'image_id',
        p.image_id,
        NOW(),
        NOW()
      FROM payload.posts p
      WHERE p.image_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM payload.posts_rels r
        WHERE r._parent_id = p.id
        AND r.field = 'image_id'
        AND r.value = p.image_id
      )
    `)
    console.log(`Added ${postMediaRelationshipsAdded} missing post-to-media relationships`)

    // 6. Fix Survey Questions Relationships
    console.log('Fixing survey_questions relationships...')

    // Convert questionspin string values to integer values if needed
    const { rowCount: surveyQuestionsUpdated } = await db.execute(sql`
      UPDATE payload.survey_questions
      SET questionspin = 
        CASE 
          WHEN questionspin::text = 'Positive' THEN 0
          WHEN questionspin::text = 'Negative' THEN 1
          ELSE questionspin
        END
      WHERE questionspin::text IN ('Positive', 'Negative')
    `)
    console.log(`Updated questionspin for ${surveyQuestionsUpdated} survey questions`)

    // Create missing bidirectional relationships from surveys to questions
    const { rowCount: surveyRelationshipsAdded } = await db.execute(sql`
      INSERT INTO payload.surveys_rels (
        id,
        _parent_id,
        field,
        value,
        survey_questions_id,
        created_at,
        updated_at
      )
      SELECT 
        gen_random_uuid(),
        q.surveys_id,
        'questions',
        q.id,
        q.id,
        NOW(),
        NOW()
      FROM payload.survey_questions q
      WHERE q.surveys_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM payload.surveys_rels r
        WHERE r._parent_id = q.surveys_id
        AND r.field = 'questions'
        AND r.value = q.id
      )
    `)
    console.log(`Added ${surveyRelationshipsAdded} missing survey-to-question relationships`)

    // Commit the transaction
    await db.execute(sql`COMMIT`)
    console.log('Successfully fixed relationships between collections')
  } catch (error) {
    // Rollback the transaction on error
    await db.execute(sql`ROLLBACK`)
    console.error('Error fixing relationships:', error)
    throw error
  }
}

/**
 * Verifies that content was properly populated and relationships are correct
 */
async function verifyContent(db: any) {
  console.log('Verifying content and relationships...')

  // Check documentation
  const { rows: docCount } = await db.execute(sql`
    SELECT COUNT(*) as count FROM payload.documentation
  `)
  console.log(`Documentation count: ${docCount[0].count}`)

  // Check posts
  const { rows: postsCount } = await db.execute(sql`
    SELECT COUNT(*) as count FROM payload.posts
  `)
  console.log(`Posts count: ${postsCount[0].count}`)

  // Check surveys
  const { rows: surveysCount } = await db.execute(sql`
    SELECT COUNT(*) as count FROM payload.surveys
  `)
  console.log(`Surveys count: ${surveysCount[0].count}`)

  // Check survey questions
  const { rows: surveyQuestionsCount } = await db.execute(sql`
    SELECT COUNT(*) as count FROM payload.survey_questions
  `)
  console.log(`Survey questions count: ${surveyQuestionsCount[0].count}`)

  // Check quiz questions
  const { rows: quizQuestionsCount } = await db.execute(sql`
    SELECT COUNT(*) as count FROM payload.quiz_questions
  `)
  console.log(`Quiz questions count: ${quizQuestionsCount[0].count}`)

  // Check course lessons
  const { rows: courseLessonsCount } = await db.execute(sql`
    SELECT COUNT(*) as count FROM payload.course_lessons
  `)
  console.log(`Course lessons count: ${courseLessonsCount[0].count}`)

  // Check media
  const { rows: mediaCount } = await db.execute(sql`
    SELECT COUNT(*) as count FROM payload.media
  `)
  console.log(`Media count: ${mediaCount[0].count}`)

  // Check if any tables are empty
  if (parseInt(docCount[0].count) === 0) {
    console.warn('WARNING: No documentation found!')
  }

  if (parseInt(postsCount[0].count) === 0) {
    console.warn('WARNING: No posts found!')
  }

  if (parseInt(surveysCount[0].count) === 0) {
    console.warn('WARNING: No surveys found!')
  }

  if (parseInt(surveyQuestionsCount[0].count) === 0) {
    console.warn('WARNING: No survey questions found!')
  }

  if (parseInt(quizQuestionsCount[0].count) === 0) {
    console.warn('WARNING: No quiz questions found!')
  }

  if (parseInt(courseLessonsCount[0].count) === 0) {
    console.warn('WARNING: No course lessons found!')
  }

  if (parseInt(mediaCount[0].count) === 0) {
    console.warn('WARNING: No media found!')
  }

  // Verify media relationships with course lessons
  const { rows: mediaRelationshipsCount } = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM payload.course_lessons_rels r
    WHERE r.field = 'featured_image'
  `)
  console.log(`Media relationships count: ${mediaRelationshipsCount[0].count}`)

  // Verify course_lessons relationship columns
  const { rows: courseLessonsNullCount } = await db.execute(sql`
    SELECT 
      COUNT(*) FILTER (WHERE course_id IS NOT NULL AND course_id_id IS NULL) as null_course_id_count,
      COUNT(*) FILTER (WHERE quiz_id IS NOT NULL AND quiz_id_id IS NULL) as null_quiz_id_count
    FROM payload.course_lessons
  `)

  if (parseInt(courseLessonsNullCount[0].null_course_id_count) > 0) {
    console.warn(
      `WARNING: ${courseLessonsNullCount[0].null_course_id_count} course lessons have course_id but NULL course_id_id!`,
    )
  } else {
    console.log('✅ All course lessons have proper course_id_id values')
  }

  if (parseInt(courseLessonsNullCount[0].null_quiz_id_count) > 0) {
    console.warn(
      `WARNING: ${courseLessonsNullCount[0].null_quiz_id_count} course lessons have quiz_id but NULL quiz_id_id!`,
    )
  } else {
    console.log('✅ All course lessons have proper quiz_id_id values')
  }

  // Verify quiz questions bidirectional relationships
  const { rows: quizQuestionsMissingRels } = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM payload.quiz_questions q
    WHERE q.quiz_id_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.course_quizzes_rels r
      WHERE r._parent_id = q.quiz_id_id
      AND r.field = 'questions'
      AND r.value = q.id
    )
  `)

  if (parseInt(quizQuestionsMissingRels[0].count) > 0) {
    console.warn(
      `WARNING: ${quizQuestionsMissingRels[0].count} quiz questions are missing bidirectional relationships!`,
    )
  } else {
    console.log('✅ All quiz questions have proper bidirectional relationships')
  }

  // Verify documentation parent-child relationships
  const { rows: docMissingRels } = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM payload.documentation d
    WHERE d.parent_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.documentation_rels r
      WHERE r._parent_id = d.parent_id
      AND r.field = 'children'
      AND r.value = d.id
    )
  `)

  if (parseInt(docMissingRels[0].count) > 0) {
    console.warn(
      `WARNING: ${docMissingRels[0].count} documentation entries are missing parent-child relationships!`,
    )
  } else {
    console.log('✅ All documentation entries have proper parent-child relationships')
  }

  // Verify media relationships with course lessons
  const { rows: mediaMissingRels } = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM payload.course_lessons l
    WHERE l.featured_image_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.course_lessons_rels r
      WHERE r._parent_id = l.id
      AND r.field = 'featured_image'
      AND r.value = l.featured_image_id
    )
  `)

  if (parseInt(mediaMissingRels[0].count) > 0) {
    console.warn(
      `WARNING: ${mediaMissingRels[0].count} course lessons are missing media relationships!`,
    )
  } else {
    console.log('✅ All course lessons have proper media relationships')
  }

  // Verify survey questions bidirectional relationships
  const { rows: surveyQuestionsMissingRels } = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM payload.survey_questions q
    WHERE q.surveys_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.surveys_rels r
      WHERE r._parent_id = q.surveys_id
      AND r.field = 'questions'
      AND r.value = q.id
    )
  `)

  if (parseInt(surveyQuestionsMissingRels[0].count) > 0) {
    console.warn(
      `WARNING: ${surveyQuestionsMissingRels[0].count} survey questions are missing bidirectional relationships!`,
    )
  } else {
    console.log('✅ All survey questions have proper bidirectional relationships')
  }

  // Verify media relationships with posts
  const { rows: postMediaRelationshipsCount } = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM payload.posts_rels r
    WHERE r.field = 'image_id'
  `)
  console.log(`Post media relationships count: ${postMediaRelationshipsCount[0].count}`)

  // Verify posts relationship columns
  const { rows: postsMissingRels } = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM payload.posts p
    WHERE p.image_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.posts_rels r
      WHERE r._parent_id = p.id
      AND r.field = 'image_id'
      AND r.value = p.image_id
    )
  `)

  if (parseInt(postsMissingRels[0].count) > 0) {
    console.warn(`WARNING: ${postsMissingRels[0].count} posts are missing media relationships!`)
  } else {
    console.log('✅ All posts have proper media relationships')
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This would be destructive, so we'll just log a message
  console.log('Down migration for content processing is a no-op to preserve data')
}
