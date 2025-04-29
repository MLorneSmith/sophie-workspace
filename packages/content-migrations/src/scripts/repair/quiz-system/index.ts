/**
 * Quiz System Repair - Main Entry Point
 *
 * Orchestrates the entire quiz relationship repair process
 * Manages transactions, error handling, and provides a clean API
 */
import { Command } from 'commander';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { getLogger } from '../../../utils/logging.js';
import { fixBidirectionalRelationships } from './bidirectional.js';
import { detectQuizRelationships, logDetectionSummary } from './detection.js';
import { fixJsonbFormat } from './jsonb-format.js';
import { fixPrimaryRelationships } from './primary-relationships.js';
import { RepairOptions, RepairResult } from './types.js';
import { getDbConnection } from './utils/db-connection.js';
import { logRepairSummary } from './utils/index.js';
import { verifyQuizSystem } from './verification.js';

const logger = getLogger('QuizSystemRepair');

/**
 * Main function to repair quiz relationship system
 * Orchestrates the entire process in the correct sequence
 *
 * @param options Options for the repair process
 * @returns Result of the repair operation
 */
export async function repairQuizSystem(
  options: RepairOptions = {},
): Promise<RepairResult> {
  const {
    skipVerification = false,
    continueOnError = false,
    dryRun = false,
    verbose = false,
  } = options;

  logger.info('Starting quiz system repair...');
  if (dryRun) {
    logger.info('DRY RUN MODE: No changes will be made to the database');
  }

  let db: PostgresJsDatabase | null = null;

  try {
    // Get database connection with payload schema
    db = await getDbConnection({ schema: 'payload' });

    // 1. Detect current state
    logger.info('Step 1: Detecting current quiz relationship state...');
    const state = await detectQuizRelationships(db);
    if (verbose) {
      logDetectionSummary(state);
    }

    // If no issues found, skip repair steps
    if (state.issues.length === 0) {
      logger.info('No relationship issues detected, skipping repair steps');

      // Still run verification if requested
      let verificationResult = null;
      if (!skipVerification) {
        logger.info('Running verification...');
        verificationResult = await verifyQuizSystem(db);
      }

      return {
        success: true,
        primaryResult: { relationshipsCreated: 0, newRelationships: [] },
        bidirectionalResult: { relationshipsCreated: 0, newRelationships: [] },
        jsonbResult: { quizzesUpdated: 0, updatedQuizzes: [] },
        verificationResult,
      };
    }

    let primaryResult;
    let bidirectionalResult;
    let jsonbResult;
    let verificationResult = null;

    if (!dryRun) {
      // Use Drizzle's transaction API instead of raw SQL commands
      logger.info('Starting database transaction...');
      await db.transaction(async (tx) => {
        // 2. Fix primary relationships (quiz → question)
        logger.info(
          'Step 2: Fixing primary relationships (quiz → question)...',
        );
        primaryResult = await fixPrimaryRelationships(tx, state);

        // 3. Fix bidirectional relationships (question → quiz)
        logger.info(
          'Step 3: Fixing bidirectional relationships (question → quiz)...',
        );
        bidirectionalResult = await fixBidirectionalRelationships(tx, state);

        // 4. Fix JSONB format
        logger.info('Step 4: Fixing JSONB format...');
        jsonbResult = await fixJsonbFormat(tx, state);

        // Throw an error if verification fails, which will trigger rollback
        if (!skipVerification) {
          logger.info('Step 5: Verifying quiz system integrity...');
          verificationResult = await verifyQuizSystem(tx);

          if (!verificationResult.success && !continueOnError) {
            throw new Error(
              'Verification failed: ' + verificationResult.message,
            );
          }
        }
      });

      logger.info('Transaction committed successfully');
    } else {
      // In dry run mode, just return empty results
      primaryResult = { relationshipsCreated: 0, newRelationships: [] };
      bidirectionalResult = { relationshipsCreated: 0, newRelationships: [] };
      jsonbResult = { quizzesUpdated: 0, updatedQuizzes: [] };

      // Still perform verification if requested
      if (!skipVerification) {
        logger.info('Step 5: Verifying quiz system integrity...');
        verificationResult = await verifyQuizSystem(db);
      }
    }

    // Log summary
    const result = {
      success: true,
      primaryResult,
      bidirectionalResult,
      jsonbResult,
      verificationResult,
    };

    logRepairSummary(result, { verbose });

    return result;
  } catch (error) {
    // Transaction is automatically rolled back by Drizzle when an error occurs
    logger.error('Quiz system repair failed', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const program = new Command();

  program
    .name('quiz-system-repair')
    .description('Repair quiz-question relationships')
    .option('-s, --skip-verification', 'Skip verification step', false)
    .option('-c, --continue-on-error', 'Continue on verification errors', false)
    .option('-d, --dry-run', 'Dry run - no changes will be made', false)
    .option('-v, --verbose', 'Show detailed output', false)
    .option('--verify-only', 'Only run verification, no repairs', false);

  program.parse();

  const options = program.opts();

  // Handle --verify-only flag
  if (options.verifyOnly) {
    (async () => {
      const db = await getDbConnection({ schema: 'payload' });
      logger.info('Running verification only...');
      const result = await verifyQuizSystem(db);
      logger.info(
        `Verification ${result.success ? 'PASSED' : 'FAILED'}: ${result.message}`,
      );
      if (!result.success) {
        process.exit(1);
      }
    })();
  } else {
    // Run the repair process
    repairQuizSystem({
      skipVerification: options.skipVerification,
      continueOnError: options.continueOnError,
      dryRun: options.dryRun,
      verbose: options.verbose,
    })
      .then((result) => {
        if (!result.success) {
          process.exit(1);
        }
      })
      .catch((err) => {
        logger.error('Unhandled error during repair', err);
        process.exit(1);
      });
  }
}
