#!/usr/bin/env node
/**
 * Relationship Repair CLI
 *
 * This script provides a command-line interface for running the relationship repair process
 * as part of the content migration system.
 */
import minimist from 'minimist';

import { runRelationshipRepair } from '../orchestration/relationship-repair.js';
import { formatLogMessage } from '../scripts/repair/relationships/core/utils.js';

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  boolean: [
    'skip-verification',
    'skip-quiz-fix',
    'skip-multi-fix',
    'skip-fallback',
    'log-to-file',
    'verbose',
    'help',
    'h',
  ],
  alias: {
    h: 'help',
    v: 'verbose',
  },
});

// Show help
if (argv.help) {
  console.log(`
  Relationship Repair CLI

  Description:
    Run comprehensive relationship repair for Payload CMS collections

  Usage:
    relationship-repair [options]

  Options:
    --skip-verification    Skip the verification phase
    --skip-quiz-fix        Skip quiz-question relationship fixes
    --skip-multi-fix       Skip multi-collection relationship fixes
    --skip-fallback        Skip creating fallback database views and helpers
    --log-to-file          Log output to a file
    --verbose, -v          Enable verbose logging
    --help, -h             Show this help message
  `);
  process.exit(0);
}

// Convert command line flags to option object
const options = {
  skipVerification: argv['skip-verification'],
  skipQuizFix: argv['skip-quiz-fix'],
  skipMultiFix: argv['skip-multi-fix'],
  skipFallbackSystem: argv['skip-fallback'],
  logToFile: argv['log-to-file'],
  verbose: argv.verbose,
};

// Configure global log level if verbose is specified
if (options.verbose) {
  process.env.LOG_LEVEL = 'debug';
}

// Display banner
console.log(`
┌───────────────────────────────────────────────────┐
│                                                   │
│        COMPREHENSIVE RELATIONSHIP REPAIR          │
│                                                   │
│         Fix Payload CMS relationship issues       │
│                                                   │
└───────────────────────────────────────────────────┘
`);

console.log(formatLogMessage('Starting relationship repair...', 'info'));
console.log('Options:', JSON.stringify(options, null, 2));

// Run the repair process
runRelationshipRepair(options)
  .then((success) => {
    if (success) {
      console.log(
        formatLogMessage('Relationship repair completed successfully!', 'info'),
      );
      process.exit(0);
    } else {
      console.error(formatLogMessage('Relationship repair failed!', 'error'));
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
