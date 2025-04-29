/**
 * Quiz System Repair - Primary Relationships
 *
 * Establishes quiz → question relationships by creating entries in course_quizzes_rels
 * This module doesn't depend on pre-existing relationships
 */
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { getLogger } from '../../../utils/logging.js';
import { PrimaryRepairResult, QuizSystemState } from './types.js';

const logger = getLogger('QuizSystemPrimaryRelationships');

// Define a type for database query results
interface DbQueryResult<T> {
  rows: T[];
  rowCount?: number;
  [key: string]: any;
}

/**
 * Fixes primary relationships (quiz → question)
 * Creates entries in course_quizzes_rels based on JSONB questions arrays
 *
 * @param db Database connection or transaction
 * @param state Current state of quiz relationships
 * @returns Result of the repair operation
 */
export async function fixPrimaryRelationships(
  db: PostgresJsDatabase,
  state: QuizSystemState,
): Promise<PrimaryRepairResult> {
  logger.info('Fixing primary relationships (quiz → question)...');

  try {
    // Insert quiz-to-question relationships where they don't exist
    logger.info('Creating missing primary relationships...');
    logger.info('Running SQL to create relationships...');

    // Simplified approach: First get all quizzes with JSONB questions
    logger.info('Getting quizzes with questions in JSONB data...');
    const quizzes: any = await db.execute(`
      SELECT id, title, questions 
      FROM payload.course_quizzes 
      WHERE jsonb_array_length(questions) > 0
    `);

    const quizzesWithQuestions = Array.isArray(quizzes)
      ? quizzes
      : quizzes?.rows || [];
    logger.info(
      `Found ${quizzesWithQuestions.length} quizzes with questions in JSONB data`,
    );

    // For each quiz, get existing relationships
    let totalRelationshipsCreated = 0;
    const createdRelationships: any[] = [];

    // Process each quiz separately to handle errors gracefully
    for (const quiz of quizzesWithQuestions) {
      try {
        logger.info(`Processing quiz "${quiz.title}" (${quiz.id})...`);

        // Extract question IDs from JSONB array
        const questionIds: string[] = [];
        try {
          const questionsArray = JSON.parse(JSON.stringify(quiz.questions));
          if (Array.isArray(questionsArray)) {
            for (const question of questionsArray) {
              if (question && question.id) {
                questionIds.push(question.id);
              }
            }
          }
        } catch (err: any) {
          logger.warning(
            `Could not parse questions for quiz ${quiz.id}: ${err.message}`,
          );
          continue;
        }

        logger.info(
          `Quiz has ${questionIds.length} question IDs in JSONB data`,
        );

        // Get existing relationships for this quiz
        const existingRels: any = await db.execute(`
          SELECT quiz_questions_id 
          FROM payload.course_quizzes_rels 
          WHERE _parent_id = '${quiz.id}' AND path = 'questions'
        `);

        const existingRelIds = new Set<string>();
        const existingRelsList = Array.isArray(existingRels)
          ? existingRels
          : existingRels?.rows || [];
        existingRelsList.forEach((rel) => {
          if (rel.quiz_questions_id) {
            existingRelIds.add(rel.quiz_questions_id);
          }
        });

        logger.info(`Quiz has ${existingRelIds.size} existing relationships`);

        // Create missing relationships
        for (const questionId of questionIds) {
          if (!existingRelIds.has(questionId)) {
            // Check if question exists
            const questionExists: any = await db.execute(`
              SELECT id FROM payload.quiz_questions WHERE id = '${questionId}'
            `);

            const questionExistsList = Array.isArray(questionExists)
              ? questionExists
              : questionExists?.rows || [];

            if (questionExistsList.length === 0) {
              logger.warning(
                `Question ${questionId} referenced in quiz ${quiz.id} doesn't exist in database, skipping`,
              );
              continue;
            }

            // Create relationship
            const relResult: any = await db.execute(`
              INSERT INTO payload.course_quizzes_rels 
              (id, _parent_id, quiz_questions_id, path, created_at, updated_at)
              VALUES (
                gen_random_uuid(),
                '${quiz.id}',
                '${questionId}',
                'questions',
                NOW(),
                NOW()
              )
              RETURNING *
            `);

            const insertedRels = Array.isArray(relResult)
              ? relResult
              : relResult?.rows || [];
            if (insertedRels.length > 0) {
              createdRelationships.push(insertedRels[0]);
              totalRelationshipsCreated++;
              logger.info(
                `Created relationship: Quiz ${quiz.id} → Question ${questionId}`,
              );
            }
          }
        }
      } catch (error: any) {
        logger.error(`Error processing quiz ${quiz.id}`, error);
        // Continue with next quiz
      }
    }

    logger.info(
      `Created ${totalRelationshipsCreated} primary relationships in total`,
    );

    // Return dummy result structure for consistency
    const result = {
      rows: createdRelationships,
      rowCount: totalRelationshipsCreated,
    };

    // Log the return structure for debugging
    logger.info(`SQL query completed. Result format: ${typeof result}`);

    // Use type assertion to resolve TypeScript errors
    const dbResult = result as any;

    logger.info(`Result has rows property: ${dbResult && 'rows' in dbResult}`);
    logger.info(
      `Result has rowCount property: ${dbResult && 'rowCount' in dbResult}`,
    );

    // Handle both array and object return types from different database adapters
    const resultRelationships = Array.isArray(dbResult)
      ? dbResult
      : dbResult?.rows || [];
    const relationshipsCreated = Array.isArray(dbResult)
      ? dbResult.length
      : dbResult?.rowCount || dbResult?.rows?.length || 0;

    logger.info(`Created ${relationshipsCreated} primary relationships`);

    if (relationshipsCreated > 0) {
      // Log some examples of created relationships
      const exampleCount = Math.min(relationshipsCreated, 3);
      logger.info(`Examples of created relationships:`);
      for (let i = 0; i < exampleCount; i++) {
        const rel = resultRelationships[i];
        logger.info(
          `  - Quiz ${rel._parent_id} → Question ${rel.quiz_questions_id}`,
        );
      }
    }

    return {
      relationshipsCreated: totalRelationshipsCreated,
      newRelationships: createdRelationships,
    };
  } catch (error: any) {
    logger.error('Error fixing primary relationships', error);
    throw new Error(
      `Failed to fix primary relationships: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Verifies primary relationships between quizzes and questions
 *
 * @param db Database connection or transaction
 * @returns Whether all primary relationships are valid
 */
export async function verifyPrimaryRelationships(
  db: PostgresJsDatabase,
): Promise<boolean> {
  logger.info('Verifying primary relationships...');

  try {
    // Check if there are any quizzes with questions first
    const hasQuizzes: any = await db.execute(`
      SELECT EXISTS (
        SELECT 1 
        FROM payload.course_quizzes 
        WHERE jsonb_array_length(questions) > 0
      ) as has_quizzes;
    `);

    const hasQuizzesWithQuestions = hasQuizzes[0]?.has_quizzes === true;

    if (!hasQuizzesWithQuestions) {
      logger.info(
        'No quizzes with questions found. Primary relationship check skipped.',
      );
      return true;
    }

    // Simplify query to avoid complex issues with array functions
    const missingRelationshipsResult: any = await db.execute(`
      -- Get quizzes with JSONB questions but missing relationships
      WITH quiz_question_pairs AS (
        SELECT 
          q.id as quiz_id,
          q.title as quiz_title,
          q.questions
        FROM 
          payload.course_quizzes q
        WHERE 
          jsonb_array_length(q.questions) > 0
      )
      SELECT 
        qp.quiz_id,
        qp.quiz_title,
        jsonb_array_length(qp.questions) as question_count,
        (
          SELECT COUNT(*) 
          FROM payload.course_quizzes_rels cqr 
          WHERE cqr._parent_id = qp.quiz_id AND cqr.path = 'questions'
        ) as rel_count
      FROM 
        quiz_question_pairs qp
      WHERE
        jsonb_array_length(qp.questions) > (
          SELECT COUNT(*) 
          FROM payload.course_quizzes_rels cqr 
          WHERE cqr._parent_id = qp.quiz_id AND cqr.path = 'questions'
        )
      LIMIT 5;
    `);

    // Handle the result array format
    const rows = Array.isArray(missingRelationshipsResult)
      ? missingRelationshipsResult
      : missingRelationshipsResult?.rows || [];

    const missingCount = rows.length;

    if (missingCount > 0) {
      logger.warning(`Found ${missingCount} missing relationships`);
      rows.forEach((row) => {
        logger.warning(
          `  - Quiz "${row.quiz_title}" (${row.quiz_id}) has ${row.question_count} questions but only ${row.rel_count} relationships`,
        );
      });
      return false;
    }

    logger.info('All primary relationships are valid');
    return true;
  } catch (error: any) {
    logger.error('Error verifying primary relationships', error);
    return false;
  }
}
