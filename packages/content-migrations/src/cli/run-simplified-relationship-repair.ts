/**
 * Simplified Relationship Repair CLI
 *
 * This script runs the simplified relationship repair process, which doesn't rely on
 * direct fields that may not exist in the schema.
 */
import { runRelationshipRepairSimplified } from '../orchestration/simplified-relationship-repair.js';
import { formatLogMessage } from '../scripts/repair/relationships/core/utils.js';

// Parse command line arguments
const args = process.argv.slice(2);

const options = {
  skipVerification: args.includes('--skip-verification'),
  skipQuizFix: args.includes('--skip-quiz-fix'),
  skipMultiFix: args.includes('--skip-multi-fix'),
  skipFallbackSystem: args.includes('--skip-fallback'),
  logToFile: args.includes('--log-to-file'),
  verbose: args.includes('--verbose'),
};

console.log('\n┌───────────────────────────────────────────────────┐');
console.log('│                                                   │');
console.log('│        COMPREHENSIVE RELATIONSHIP REPAIR          │');
console.log('│                                                   │');
console.log('│         Fix Payload CMS relationship issues       │');
console.log('│                                                   │');
console.log('└───────────────────────────────────────────────────┘\n');

console.log(formatLogMessage('Starting relationship repair...', 'info'));
console.log('Options:', JSON.stringify(options, null, 2));

// Run the repair process
runRelationshipRepairSimplified(options)
  .then((success) => {
    if (success) {
      console.log(
        formatLogMessage('Relationship repair completed successfully!', 'info'),
      );
      process.exit(0);
    } else {
      console.log(formatLogMessage('Relationship repair failed!', 'error'));
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
