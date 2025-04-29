/**
 * CLI Entry point for Quiz System Repair tool
 *
 * This script registers and executes the quiz relationship repair system
 * to fix issues between quizzes and questions
 */
import { Command } from 'commander';

import { repairQuizSystem } from '../scripts/repair/quiz-system/index.js';
import { getLogger } from '../utils/logging.js';

const logger = getLogger('QuizSystemRepairCLI');

// Configure command line options
const program = new Command();
program
  .name('quiz-system-repair')
  .description('Repair quiz system relationships and JSONB data')
  .option('-s, --skip-verification', 'Skip verification step', false)
  .option('-c, --continue-on-error', 'Continue on verification errors', false)
  .option('-d, --dry-run', 'Dry run - no changes will be made', false)
  .option('-v, --verbose', 'Show detailed output', false)
  .option('--verify-only', 'Only run verification, no repairs', false)
  .option(
    '--analyze-only',
    'Only analyze relationships, no repairs or verification',
    false,
  )
  .parse(process.argv);

// Get options
const options = program.opts();

async function main() {
  try {
    logger.info('Starting Quiz System Repair...');

    // Configure repair options
    const repairOptions = {
      skipVerification: options.skipVerification || options.analyzeOnly,
      continueOnError: options.continueOnError,
      dryRun: options.dryRun || options.verifyOnly || options.analyzeOnly,
      verbose: options.verbose,
    };

    // Run repair process
    const result = await repairQuizSystem(repairOptions);

    // Handle result
    if (result.success) {
      logger.info('Quiz system repair completed successfully.');

      // Log summary counts
      if (result.primaryResult) {
        logger.info(
          `Created ${result.primaryResult.relationshipsCreated} primary relationships`,
        );
      }

      if (result.bidirectionalResult) {
        logger.info(
          `Created ${result.bidirectionalResult.relationshipsCreated} bidirectional relationships`,
        );
      }

      if (result.jsonbResult) {
        logger.info(
          `Updated JSONB format in ${result.jsonbResult.quizzesUpdated} quizzes`,
        );
      }

      if (result.verificationResult) {
        logger.info(
          `Verification: ${result.verificationResult.success ? 'PASSED' : 'FAILED'}`,
        );
        if (!result.verificationResult.success) {
          logger.warning(
            'Some verification issues remain. Try running again or check logs for details.',
          );
        }
      }

      process.exit(0);
    } else {
      logger.error('Quiz system repair failed.');
      if (result.error) {
        logger.error(`Error: ${result.error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    logger.error('Unhandled error during quiz system repair', error);
    process.exit(1);
  }
}

// Execute the main function
main();
