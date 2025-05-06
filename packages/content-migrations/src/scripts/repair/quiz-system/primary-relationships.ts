/**
 * Quiz System Repair - Primary Relationships
 *
 * Establishes quiz → question relationships by creating entries in course_quizzes_rels
 * This module doesn't depend on pre-existing relationships
 */
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { QUIZZES } from '../../../data/quizzes-quiz-questions-truth.js';
import { getLogger } from '../../../utils/logging.js';
import { PrimaryRepairResult, QuizSystemState } from './types.js';

// Import QUIZZES source of truth

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
    logger.info('Starting to process quizzes from source of truth...');

    let totalRelationshipsCreated = 0;
    const createdRelationships: any[] = [];

    // Process each quiz from the source of truth
    for (const quizSlug in QUIZZES) {
      const quiz = QUIZZES[quizSlug];
      logger.info(
        `Processing quiz "${quiz.title}" (${quiz.id}) from source of truth...`,
      );
      try {
        // 1. Delete existing relationships for this quiz
        logger.info(`Deleting existing relationships for quiz ${quiz.id}...`);
        const deleteResult: any = await db.execute(`
          DELETE FROM payload.course_quizzes_rels 
          WHERE _parent_id = '${quiz.id}' AND path = 'questions'
        `);
        const deletedCount = Array.isArray(deleteResult)
          ? deleteResult.length
          : deleteResult?.rowCount || 0;
        logger.info(
          `Deleted ${deletedCount} existing relationships for quiz ${quiz.id}`,
        );

        // 2. Insert correct relationships based on source of truth
        logger.info(
          `Inserting relationships based on source of truth for quiz ${quiz.id}...`,
        );
        let order = 0;
        logger.info(
          `Processing ${quiz.questions.length} questions for quiz ${quiz.id}...`,
        );
        for (const question of quiz.questions) {
          logger.info(
            `Processing question ${question.id} (Order: ${order})...`,
          );
          // Check if question exists in the database
          logger.info(
            `Checking if question ${question.id} exists in database...`,
          );
          const questionExists: any = await db.execute(`
            SELECT id FROM payload.quiz_questions WHERE id = '${question.id}'
          `);

          const questionExistsList = Array.isArray(questionExists)
            ? questionExists
            : questionExists?.rows || [];

          if (questionExistsList.length === 0) {
            logger.warning(
              `Question ${question.id} referenced in quiz ${quiz.id} (source of truth) doesn't exist in database, skipping relationship creation.`,
            );
            continue;
          }
          logger.info(`Question ${question.id} exists in database.`);

          // Insert relationship
          logger.info(
            `Inserting relationship for quiz ${quiz.id} and question ${question.id} with order ${order}...`,
          );
          const relResult: any = await db.execute(`
            INSERT INTO payload.course_quizzes_rels 
            (id, _parent_id, quiz_questions_id, path, _order, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              '${quiz.id}',
              '${question.id}',
              'questions',
              ${order},
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
              `Created relationship: Quiz ${quiz.id} → Question ${question.id} (Order: ${order}). Insert result: ${JSON.stringify(insertedRels[0])}`,
            );
          } else {
            logger.warning(
              `Failed to create relationship for quiz ${quiz.id} and question ${question.id}. Insert result was empty.`,
            );
          }
          order++;
        }
        logger.info(
          `Finished processing quiz ${quiz.id}. Attempted to create ${quiz.questions.length} relationships.`,
        );
      } catch (error: any) {
        logger.error(
          `Error processing quiz ${quiz.id} from source of truth`,
          error,
        );
        // Continue with next quiz
      }
    }

    logger.info(
      `Created ${totalRelationshipsCreated} primary relationships in total based on source of truth.`,
    );

    // Return result structure
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
