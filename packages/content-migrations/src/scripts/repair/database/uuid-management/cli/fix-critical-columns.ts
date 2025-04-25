/**
 * CLI Runner for Critical Columns Fix
 *
 * This script provides a command-line interface for running the critical columns fix
 * for UUID tables. It passes any command-line arguments to the fix function and
 * provides a user-friendly output format.
 */
import chalk from 'chalk';
import minimist from 'minimist';

import { fixCriticalColumns } from '../fix-critical-columns.js';

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  boolean: ['verbose', 'help', 'verify-only'],
  alias: {
    v: 'verbose',
    h: 'help',
    V: 'verify-only',
  },
});

// Show help if requested or no arguments
if (argv.help) {
  console.log(
    chalk.blue('=== UUID Critical Columns Fix CLI ===') +
      '\n\n' +
      'This utility ensures all UUID tables have the required critical columns (id, parent_id, path).\n\n' +
      chalk.yellow('Options:') +
      '\n' +
      '  -v, --verbose      Show detailed output during the fix process\n' +
      '  -h, --help         Show this help message\n' +
      '  -V, --verify-only  Only verify tables without making changes\n\n' +
      chalk.yellow('Examples:') +
      '\n' +
      '  ' +
      chalk.gray('# Run with standard output') +
      '\n' +
      '  pnpm run uuid:fix-critical-columns\n\n' +
      '  ' +
      chalk.gray('# Run with verbose output') +
      '\n' +
      '  pnpm run uuid:fix-critical-columns --verbose\n\n' +
      '  ' +
      chalk.gray('# Only verify tables without making changes') +
      '\n' +
      '  pnpm run uuid:fix-critical-columns --verify-only',
  );
  process.exit(0);
}

// Run the fix with the specified options
async function run() {
  console.log(chalk.blue('=== UUID CRITICAL COLUMNS FIX ==='));
  console.log(`Running with options: ${JSON.stringify(argv, null, 2)}`);

  try {
    const result = await fixCriticalColumns();

    if (result.success) {
      console.log(chalk.green('\n===== SUCCESS ====='));
      console.log(`Tables checked: ${result.tablesChecked}`);
      console.log(`Tables fixed: ${result.tablesFixed}`);
      console.log(`Columns added: ${result.columnsAdded}`);

      if (argv.verbose && result.fixedDetails) {
        console.log(chalk.yellow('\nDetailed fixes:'));
        Object.entries(result.fixedDetails).forEach(([tableName, columns]) => {
          // Type assertion to fix TypeScript error
          const columnArray = columns as string[];
          console.log(`  ${tableName}: ${columnArray.join(', ')}`);
        });
      }

      console.log(chalk.green('\nUUID tables have been fixed successfully!'));
      process.exit(0);
    } else {
      console.error(chalk.red('\n===== ERROR ====='));
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Unhandled error:'), error);
    process.exit(1);
  }
}

// Execute the script
run();
