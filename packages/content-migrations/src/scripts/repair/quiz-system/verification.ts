/**
 * Quiz System Repair - Verification
 *
 * Verifies relationship integrity after repair operations
 * Provides detailed reporting on fixed issues and any remaining problems
 */
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { getLogger } from '../../../utils/logging.js';
import { verifyBidirectionalRelationships } from './bidirectional.js';
import { verifyJsonbFormat } from './jsonb-format.js';
import { verifyPrimaryRelationships } from './primary-relationships.js';
import { VerificationResult } from './types.js';

const logger = getLogger('QuizSystemVerification');

/**
 * Comprehensive verification of quiz relationship integrity
 * Checks primary relationships, bidirectional relationships, and JSONB format
 *
 * @param db Database connection or transaction
 * @returns Result of the verification operation
 */
export async function verifyQuizSystem(
  db: PostgresJsDatabase,
): Promise<VerificationResult> {
  logger.info('Running comprehensive quiz system verification...');

  try {
    // Verify primary relationships
    logger.info('Step 1: Verifying primary relationships...');
    const primarySuccess = await verifyPrimaryRelationships(db);

    // Verify bidirectional relationships
    logger.info('Step 2: Verifying bidirectional relationships...');
    const bidirectionalSuccess = await verifyBidirectionalRelationships(db);

    // Verify JSONB format
    logger.info('Step 3: Verifying JSONB format...');
    const jsonbSuccess = await verifyJsonbFormat(db);

    // Check if all verifications passed
    const success = primarySuccess && bidirectionalSuccess && jsonbSuccess;

    // Aggregate issues
    const issues = [];

    if (!primarySuccess) {
      issues.push({
        component: 'primary_relationships',
        message: 'Primary relationships verification failed',
      });
    }

    if (!bidirectionalSuccess) {
      issues.push({
        component: 'bidirectional_relationships',
        message: 'Bidirectional relationships verification failed',
      });
    }

    if (!jsonbSuccess) {
      issues.push({
        component: 'jsonb_format',
        message: 'JSONB format verification failed',
      });
    }

    // Record aggregate counts to show current state
    const counts = await getSystemCounts(db);

    // Generate result message
    let message = '';
    if (success) {
      message = 'All quiz relationships are valid';
    } else {
      message = `Found ${issues.length} verification issues`;
    }

    logger.info(`Verification ${success ? 'PASSED' : 'FAILED'}: ${message}`);

    // Return comprehensive result
    return {
      success,
      issues,
      message,
      counts,
    };
  } catch (error) {
    logger.error('Error during quiz system verification', error);
    return {
      success: false,
      issues: [
        {
          component: 'verification',
          message: `Verification error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      message: `Verification failed with error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get counts of quizzes, questions, and relationships for reporting
 *
 * @param db Database connection or transaction
 * @returns Object containing counts of various entities
 */
async function getSystemCounts(db: PostgresJsDatabase): Promise<any> {
  try {
    // Define a type for database query results
    interface DbQueryResult<T> {
      rows: T[];
      [key: string]: any;
    }

    // Get quiz count
    const quizCount = (await db.execute(`
      SELECT COUNT(*) as count FROM payload.course_quizzes;
    `)) as unknown as DbQueryResult<{ count: string }>;

    // Get question count
    const questionCount = (await db.execute(`
      SELECT COUNT(*) as count FROM payload.quiz_questions;
    `)) as unknown as DbQueryResult<{ count: string }>;

    // Get primary relationship count
    const primaryCount = (await db.execute(`
      SELECT COUNT(*) as count FROM payload.course_quizzes_rels
      WHERE path = 'questions' AND quiz_questions_id IS NOT NULL;
    `)) as unknown as DbQueryResult<{ count: string }>;

    // Get bidirectional relationship count
    const bidirectionalCount = (await db.execute(`
      SELECT COUNT(*) as count FROM payload.quiz_questions_rels
      WHERE field = 'quiz_id';
    `)) as unknown as DbQueryResult<{ count: string }>;

    return {
      quizzes: parseInt(quizCount.rows[0].count),
      questions: parseInt(questionCount.rows[0].count),
      primaryRelationships: parseInt(primaryCount.rows[0].count),
      bidirectionalRelationships: parseInt(bidirectionalCount.rows[0].count),
    };
  } catch (error) {
    logger.error('Error getting system counts', error);
    return {
      error: `Failed to get system counts: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
