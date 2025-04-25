#!/usr/bin/env node
/**
 * Quiz JSONB Format Repair Script
 *
 * This executable script fixes the formatting of quiz question JSONB arrays
 * to match the expected Payload CMS format. It can be run independently of migrations.
 */
import chalk from 'chalk';

import { verifyQuestionsJSONBFormat } from '../verification/verify-questions-jsonb-format.js';
import { formatQuestionsJSONBEnhanced } from './quiz-management/enhanced-format-questions-jsonb.js';

/**
 * Main function
 */
async function main() {
  try {
    console.log(chalk.blue('=== Quiz Question JSONB Format Repair Script ==='));
    console.log(
      chalk.yellow(
        'This script fixes quiz question relationships by ensuring proper JSONB formatting',
      ),
    );

    // First verify the current state
    console.log(
      chalk.cyan('\n1. Verifying current state of quiz questions...'),
    );
    const initialVerification = await verifyQuestionsJSONBFormat();

    if (initialVerification) {
      console.log(
        chalk.green(
          'All quizzes already have properly formatted questions arrays.',
        ),
      );
      console.log(chalk.green('No action needed.'));
      return true;
    }

    // Apply the fix
    console.log(
      chalk.cyan('\n2. Applying JSONB format fix to quiz questions...'),
    );
    const fixResult = await formatQuestionsJSONBEnhanced();

    if (!fixResult) {
      console.error(
        chalk.red('Failed to format quiz questions JSONB. See errors above.'),
      );
      return false;
    }

    // Verify the fix worked
    console.log(chalk.cyan('\n3. Verifying quiz questions after fix...'));
    const afterVerification = await verifyQuestionsJSONBFormat();

    if (afterVerification) {
      console.log(
        chalk.green(
          '\n✅ Success! All quizzes now have properly formatted questions arrays.',
        ),
      );
      return true;
    } else {
      console.error(
        chalk.red(
          '\n❌ Some quizzes still have formatting issues after repair.',
        ),
      );
      console.log(
        chalk.yellow(
          'You may need to review the server logs and run more specific repairs.',
        ),
      );
      return false;
    }
  } catch (error) {
    console.error(chalk.red('Error running quiz JSONB format repair:'), error);
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  main()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(chalk.red('Unhandled error in repair script:'), error);
      process.exit(1);
    });
}

export default main;
