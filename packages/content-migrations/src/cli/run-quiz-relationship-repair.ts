/**
 * CLI script to run the quiz relationship repair process.
 * This script coordinates running both the quiz analysis and relationship repair.
 */
import minimist from 'minimist';
import path from 'path';

// Parse command-line arguments
const args = minimist(process.argv.slice(2), {
  boolean: ['analyze-only', 'fix-only', 'update-definitions'],
  default: {
    'analyze-only': false,
    'fix-only': false,
    'update-definitions': false,
  },
});

/**
 * Main function to coordinate the repair process
 */
async function main() {
  try {
    console.log('Starting Quiz Relationship Repair process...');

    // If analyze-only flag is set, only run the analysis
    if (args['analyze-only']) {
      console.log('Running quiz relationship analysis only...');
      await import(
        '../scripts/repair/quiz-relationship-repair/analyze-quiz-relationships-fixed.js'
      );
      return;
    }

    // If update-definitions flag is set, update the definitions
    if (args['update-definitions']) {
      console.log('Running quiz definitions update...');
      await import(
        '../scripts/repair/quiz-relationship-repair/update-quiz-definitions.js'
      );
      return;
    }

    // If fix-only flag is set or no flag is set, run the repair
    console.log('Running quiz relationship repair...');
    await import(
      '../scripts/repair/quiz-relationship-repair/fix-quiz-relationships.js'
    );
    // The module auto-executes, so no need to call a function
  } catch (error) {
    console.error('Error in Quiz Relationship Repair process:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Critical error in Quiz Relationship Repair process:', error);
  process.exit(1);
});
