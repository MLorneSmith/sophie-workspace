/**
 * CLI script to run the quiz relationship repair process.
 * This script coordinates the entire quiz relationship repair system.
 */
import minimist from 'minimist';

import { repairQuizSystem } from '../scripts/repair/quiz-system/index.js';
import { getLogger } from '../utils/logging.js';

const logger = getLogger('QuizRepairCLI');

// Parse command-line arguments
const args = minimist(process.argv.slice(2), {
  boolean: [
    'analyze-only',
    'verify-only',
    'skip-verification',
    'continue-on-error',
    'dry-run',
    'verbose',
  ],
  default: {
    'analyze-only': false,
    'verify-only': false,
    'skip-verification': false,
    'continue-on-error': false,
    'dry-run': false,
    verbose: false,
  },
});

/**
 * Main function to coordinate the repair process
 */
async function main() {
  try {
    logger.info('Starting quiz relationship repair...');

    // Log the operating mode
    if (args['analyze-only']) {
      logger.info('ANALYZE ONLY MODE: Only running detection, no repairs');
    } else if (args['verify-only']) {
      logger.info('VERIFY ONLY MODE: Only running verification, no repairs');
    } else if (args['dry-run']) {
      logger.info('DRY RUN MODE: Simulating repairs without making changes');
    }

    // If verify-only flag is set, only run verification
    if (args['verify-only']) {
      logger.info('Running verification only...');

      const { verifyQuizSystem } = await import(
        '../scripts/repair/quiz-system/verification.js'
      );
      const db = await (
        await import('../scripts/repair/quiz-system/utils/index.js')
      ).getDbConnection({ schema: 'payload' });

      const result = await verifyQuizSystem(db);
      logger.info(
        `Verification ${result.success ? 'PASSED' : 'FAILED'}: ${result.message}`,
      );

      if (!result.success) {
        process.exit(1);
      }

      return;
    }

    // If analyze-only flag is set, only run detection
    if (args['analyze-only']) {
      logger.info('Running detection only...');

      const { detectQuizRelationships, logDetectionSummary } = await import(
        '../scripts/repair/quiz-system/detection.js'
      );
      const db = await (
        await import('../scripts/repair/quiz-system/utils/index.js')
      ).getDbConnection({ schema: 'payload' });

      const state = await detectQuizRelationships(db);
      logDetectionSummary(state);

      logger.info(
        `Detection completed with ${state.issues.length} issues found`,
      );

      if (state.issues.length > 0) {
        process.exit(1);
      }

      return;
    }

    // Run full repair process
    const result = await repairQuizSystem({
      skipVerification: args['skip-verification'],
      continueOnError: args['continue-on-error'],
      dryRun: args['dry-run'],
      verbose: args['verbose'],
    });

    // Exit with appropriate code based on result
    if (!result.success) {
      logger.error('Quiz relationship repair failed:', result.error);
      process.exit(1);
    }

    logger.info('Quiz relationship repair completed successfully');
  } catch (error) {
    logger.error('Error in Quiz Relationship Repair process:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  logger.error('Critical error in Quiz Relationship Repair process:', error);
  process.exit(1);
});
