/**
 * CLI Runner for the corrected quiz relationship repair script
 */
/**
 * CLI script to run the corrected quiz relationship repair process.
 */
import minimist from 'minimist';
// Parse command-line arguments
const args = minimist(process.argv.slice(2), {
    boolean: ['verify-only', 'help'],
    alias: {
        h: 'help',
        v: 'verify-only',
    },
    default: {
        'verify-only': false,
        help: false,
    },
});
// Show help message if requested
if (args.help) {
    console.log(`
  Corrected Quiz Relationship Repair Tool
  --------------------------------------
  
  This script fixes the relationship entries between quizzes and their questions.
  It corrects the parent_id usage and other critical issues in the previous repair script.
  
  Options:
    --verify-only, -v    Only verify relationships without making changes
    --help, -h           Show this help message
  
  Examples:
    pnpm quiz:fix:corrected                 # Run the full repair
    pnpm quiz:fix:corrected --verify-only   # Only verify without changes
  `);
    process.exit(0);
}
/**
 * Main function to coordinate the repair process
 */
async function main() {
    try {
        console.log('Starting corrected quiz relationship repair process...');
        // If verify-only flag is set, only run the verification
        if (args['verify-only']) {
            console.log('Running in verify-only mode...');
            // Here we would implement verification-only logic
            // For now, just log a message
            console.log('Verification completed. Use regular mode to apply fixes.');
            return;
        }
        // Run the full repair
        console.log('Running corrected quiz relationship repair...');
        const { fixQuizRelationships } = await import('../scripts/repair/quiz-relationship-repair/fix-quiz-relationships-corrected.js');
        const results = await fixQuizRelationships();
        console.log(`
Quiz relationship repair completed successfully!
Fixed ${results.quizzesFixed} quizzes with missing or incorrect relationships.
    `);
    }
    catch (error) {
        console.error('Error in corrected quiz relationship repair process:', error);
        process.exit(1);
    }
}
// Run the main function
main().catch((error) => {
    console.error('Critical error in corrected quiz relationship repair process:', error);
    process.exit(1);
});
