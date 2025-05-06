import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration 20250425_195000_fix_quiz_questions_jsonb_format.ts
 *
 * This migration provides an improved approach to fix JSONB format issues in quiz questions.
 * Previous attempts encountered issues with certain quizzes (like "The Who Quiz") not being
 * updated correctly. This migration uses a quiz-by-quiz approach with explicit error handling
 * and detailed logging to ensure all quiz questions are formatted correctly.
 *
 * The expected format for relationship fields in Payload CMS is:
 * {
 *   "questions": [
 *     {
 *       "id": "question-id",
 *       "relationTo": "quiz_questions",
 *       "value": {
 *         "id": "question-id"
 *       }
 *     }
 *   ]
 * }
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  console.log('Starting improved quiz questions JSONB format fix')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Step 1: Get all quizzes and their current states for processing
    console.log('Fetching all quizzes to process individually...')
    const quizzes = await db.execute(sql`
      SELECT 
        id::text as quiz_id,
        title,
        questions,
        jsonb_typeof(questions) as questions_type,
        CASE 
          WHEN jsonb_typeof(questions) = 'array' THEN jsonb_array_length(questions)
          ELSE 0
        END as question_count,
        CASE 
          WHEN jsonb_typeof(questions) = 'array' AND jsonb_array_length(questions) > 0 AND questions @> '[{"relationTo": "quiz_questions"}]' THEN true
          ELSE false
        END as is_properly_formatted
      FROM payload.course_quizzes
      WHERE questions IS NOT NULL
    `)

    console.log(`Found ${quizzes.rows.length} quizzes with questions field`)

    // Track our progress
    let successCount = 0
    let failureCount = 0
    let alreadyFormattedCount = 0
    let problemQuizzes: Array<{
      id: string
      title: string
      error: string
      questions?: any
    }> = []

    // Process each quiz individually
    for (const quiz of quizzes.rows) {
      try {
        const quizId = String(quiz.quiz_id)
        const quizTitle = String(quiz.title)
        const questionsType = String(quiz.questions_type)
        const questionCount = Number(quiz.question_count)
        const isProperlyFormatted = Boolean(quiz.is_properly_formatted)

        console.log(`\nProcessing quiz "${quizTitle}" (ID: ${quizId})`)
        console.log(
          `  Current state: type=${questionsType}, count=${questionCount}, properly formatted=${isProperlyFormatted}`,
        )

        // Skip already properly formatted quizzes
        if (isProperlyFormatted) {
          console.log(`  ✅ Quiz "${quizTitle}" is already properly formatted, skipping`)
          alreadyFormattedCount++
          continue
        }

        // Step 2: Get relationship data for this quiz from the _rels table
        console.log(`  Fetching question relationships for quiz ${quizId}...`)
        const questionRels = await db.execute(sql`
          SELECT 
            quiz_questions_id::text
          FROM payload.course_quizzes_rels
          WHERE _parent_id::text = ${quizId}
          AND field = 'questions'
          AND quiz_questions_id IS NOT NULL
        `)

        console.log(`  Found ${questionRels.rows.length} question relationships in _rels table`)

        // Handle cases based on what we found
        if (questionRels.rows.length > 0) {
          // We have relationships, so format based on those
          const formattedQuestions = questionRels.rows.map((rel) => ({
            id: String(rel.quiz_questions_id),
            relationTo: 'quiz_questions',
            value: { id: String(rel.quiz_questions_id) },
          }))

          // Convert to valid JSONB and update the quiz
          console.log(
            `  Updating quiz with ${formattedQuestions.length} formatted question relationships`,
          )
          await db.execute(sql`
            UPDATE payload.course_quizzes
            SET questions = ${JSON.stringify(formattedQuestions)}::jsonb
            WHERE id::text = ${quizId}
          `)
        } else if (questionsType === 'array' && questionCount > 0) {
          // No relationships in _rels table, but we have question IDs in the array
          // This handles direct ID references that need conversion
          console.log(`  No relationships found in _rels table, formatting from existing array`)

          // Get the raw questions array and parse it
          let existingQuestions: any[] = []

          try {
            // Handle simple string array format
            existingQuestions = Array.isArray(quiz.questions)
              ? quiz.questions
              : JSON.parse(JSON.stringify(quiz.questions))

            const formattedQuestions = existingQuestions.map((q: any) => {
              // Handle if questions are already objects or just strings
              const questionId = typeof q === 'object' ? q.id || q.value?.id || q : q
              return {
                id: String(questionId),
                relationTo: 'quiz_questions',
                value: { id: String(questionId) },
              }
            })

            console.log(`  Formatting ${formattedQuestions.length} questions from existing array`)

            // Update the quiz with the properly formatted questions
            await db.execute(sql`
              UPDATE payload.course_quizzes
              SET questions = ${JSON.stringify(formattedQuestions)}::jsonb
              WHERE id::text = ${quizId}
            `)

            // Additionally, ensure the relationships exist in the _rels table
            console.log(`  Ensuring relationships exist in _rels table...`)
            for (const question of formattedQuestions) {
              // Check if relationship already exists
              const existingRel = await db.execute(sql`
                SELECT id FROM payload.course_quizzes_rels
                WHERE _parent_id::text = ${quizId}
                AND field = 'questions'
                AND quiz_questions_id::text = ${question.value.id}
              `)

              // Insert if not exists
              if (existingRel.rows.length === 0) {
                await db.execute(sql`
                  INSERT INTO payload.course_quizzes_rels
                  (_parent_id, field, value, quiz_questions_id)
                  VALUES (${quizId}, 'questions', ${question.value.id}, ${question.value.id})
                `)
              }
            }
          } catch (parseError) {
            console.error(`  ❌ Error parsing questions array for quiz "${quizTitle}":`, parseError)
            failureCount++
            problemQuizzes.push({
              id: quizId,
              title: quizTitle,
              error: String(parseError),
              questions: quiz.questions,
            })
            continue
          }
        } else {
          console.log(
            `  ⚠️ Quiz "${quizTitle}" has no question relationships and no valid questions array`,
          )
          failureCount++
          problemQuizzes.push({
            id: quizId,
            title: quizTitle,
            error: 'No question relationships or valid questions array',
            questions: quiz.questions,
          })
          continue
        }

        // Verify the update was successful
        const verifyUpdate = await db.execute(sql`
          SELECT 
            jsonb_typeof(questions) as questions_type,
            jsonb_array_length(questions) as question_count,
            CASE 
              WHEN jsonb_typeof(questions) = 'array' AND jsonb_array_length(questions) > 0 AND questions @> '[{"relationTo": "quiz_questions"}]' THEN true
              ELSE false
            END as is_properly_formatted
          FROM payload.course_quizzes
          WHERE id::text = ${quizId}
        `)

        if (Boolean(verifyUpdate.rows[0].is_properly_formatted)) {
          console.log(
            `  ✅ Quiz "${quizTitle}" successfully updated with properly formatted questions`,
          )
          successCount++
        } else {
          console.log(`  ⚠️ Quiz "${quizTitle}" update verification failed`)
          failureCount++
          problemQuizzes.push({
            id: quizId,
            title: quizTitle,
            error: 'Update verification failed',
            questions: verifyUpdate.rows[0],
          })
        }
      } catch (quizError) {
        console.error(`  ❌ Error processing quiz "${String(quiz.title)}":`, quizError)
        failureCount++
        problemQuizzes.push({
          id: String(quiz.quiz_id),
          title: String(quiz.title),
          error: String(quizError),
        })
      }
    }

    // Step 3: Add a specialized fix for any remaining problem quizzes
    if (problemQuizzes.length > 0) {
      console.log('\nAttempting specialized fixes for problem quizzes...')

      for (const problemQuiz of problemQuizzes) {
        console.log(`\nSpecialized fix for quiz "${problemQuiz.title}" (ID: ${problemQuiz.id})`)

        // Explicit custom query for this specific quiz
        try {
          // Direct approach - build the structure explicitly to avoid type conversion issues
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
              WHERE _parent_id::text = ${problemQuiz.id}
              AND field = 'questions'
              AND quiz_questions_id IS NOT NULL
            )
            WHERE id::text = ${problemQuiz.id}
          `)

          // Verify the specialized fix
          const verifySpecial = await db.execute(sql`
            SELECT 
              jsonb_typeof(questions) as questions_type,
              CASE 
                WHEN jsonb_typeof(questions) = 'array' THEN jsonb_array_length(questions)
                ELSE 0
              END as question_count,
              CASE 
                WHEN jsonb_typeof(questions) = 'array' AND jsonb_array_length(questions) > 0 AND questions @> '[{"relationTo": "quiz_questions"}]' THEN true
                ELSE false
              END as is_properly_formatted
            FROM payload.course_quizzes
            WHERE id::text = ${problemQuiz.id}
          `)

          if (Boolean(verifySpecial.rows[0].is_properly_formatted)) {
            console.log(`  ✅ Specialized fix successful for "${problemQuiz.title}"`)
            successCount++
            failureCount-- // Discount the previous failure
          } else {
            console.log(`  ⚠️ Specialized fix verification failed for "${problemQuiz.title}"`)
          }
        } catch (specialError) {
          console.error(`  ❌ Specialized fix failed for "${problemQuiz.title}":`, specialError)
        }
      }
    }

    // Step 4: Final verification to confirm success
    console.log('\nPerforming final verification...')
    const finalCheck = await db.execute(sql`
      SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE jsonb_typeof(questions) = 'array') as array_count,
        COUNT(*) FILTER (WHERE 
          jsonb_typeof(questions) = 'array' AND 
          jsonb_array_length(questions) > 0 AND
          questions @> '[{"relationTo": "quiz_questions"}]'
        ) as formatted_count
      FROM payload.course_quizzes
      WHERE questions IS NOT NULL
    `)

    console.log(`Final verification results:
      - Total quizzes: ${finalCheck.rows[0].total_count}
      - With array questions: ${finalCheck.rows[0].array_count}
      - With properly formatted questions: ${finalCheck.rows[0].formatted_count || 0}
    `)

    // Update or create verification function
    console.log('Creating/updating verification function...')
    // First drop the existing function to avoid "cannot change return type of existing function" error
    await db.execute(sql`
      DROP FUNCTION IF EXISTS payload.verify_quiz_questions_jsonb_format();
      
      CREATE FUNCTION payload.verify_quiz_questions_jsonb_format()
      RETURNS TABLE(
        quiz_id text,
        quiz_title text,
        has_questions boolean,
        is_array boolean,
        is_formatted boolean,
        question_count integer,
        rels_count integer
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          q.id::text as quiz_id,
          q.title as quiz_title,
          q.questions IS NOT NULL as has_questions,
          jsonb_typeof(q.questions) = 'array' as is_array,
          CASE 
            WHEN jsonb_typeof(q.questions) != 'array' THEN false
            WHEN jsonb_array_length(q.questions) = 0 THEN false
            WHEN NOT (q.questions @> '[{"relationTo": "quiz_questions"}]') THEN false
            ELSE true
          END as is_formatted,
          CASE 
            WHEN jsonb_typeof(q.questions) = 'array' THEN jsonb_array_length(q.questions)
            ELSE 0
          END as question_count,
          (SELECT COUNT(*) FROM payload.course_quizzes_rels r 
           WHERE r._parent_id::text = q.id::text AND r.field = 'questions') as rels_count
        FROM 
          payload.course_quizzes q
        WHERE
          q.questions IS NOT NULL
        ORDER BY
          q.title;
      END;
      $$ LANGUAGE plpgsql;
    `)

    // Summary
    const summary = `
    Migration summary:
    - ${successCount} quizzes successfully updated
    - ${alreadyFormattedCount} quizzes already correctly formatted
    - ${failureCount} quizzes failed to update
    
    Total quizzes processed: ${quizzes.rows.length}
    
    To check remaining issues, run:
    SELECT * FROM payload.verify_quiz_questions_jsonb_format() WHERE NOT is_formatted;
    `

    console.log(summary)

    // Commit the transaction if no failures, otherwise rollback
    if (failureCount > 0) {
      console.log('Rolling back due to failures...')
      await db.execute(sql`ROLLBACK;`)
      throw new Error(`Failed to update ${failureCount} quizzes. See logs for details.`)
    } else {
      console.log('Committing successful updates...')
      await db.execute(sql`COMMIT;`)
      console.log('Improved quiz questions JSONB format fix completed successfully')
    }
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error in improved quiz questions JSONB format fix:', error)
    throw error
  }
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  console.log('No down migration needed for JSONB format fix as it is a data correction')
  // We don't roll back data format corrections as they fix the data to match the expected format
}
