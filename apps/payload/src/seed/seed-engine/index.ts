#!/usr/bin/env node

/**
 * CLI entry point for Payload CMS seeding engine
 *
 * Provides command-line interface for seeding Payload collections with:
 * - Dry-run mode for validation without creating records
 * - Verbose logging for detailed progress tracking
 * - Collection filtering to seed specific collections
 * - Environment safety checks to prevent production seeding
 *
 * @module seed-engine/index
 *
 * @example
 * ```bash
 * # Seed all collections
 * pnpm seed:run
 *
 * # Dry-run validation only
 * pnpm seed:dry
 *
 * # Seed specific collections with verbose logging
 * pnpm seed:run --verbose -c courses,course-lessons
 * ```
 */

import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger, LogLevel } from './utils/logger';
import { validateEnvironment, initializePayload, cleanupPayload } from './core/payload-initializer';
import { ENV_VARS, DEFAULT_OPTIONS } from './config';
import type { SeedOptions } from './types';

// Parse --force flag from process.argv early (before Commander runs)
// This is needed because validateEnvironmentSafety() runs before Commander parses arguments
export function getForceFromArgs(): boolean {
  return process.argv.includes('--force');
}

// Parse --env flag from process.argv to determine which environment file to load
// Defaults to 'test' for backwards compatibility, supports 'production' for remote seeding
// Supports both --env=value and --env value formats
export function getEnvNameFromArgs(): string {
  const validEnvs = ['test', 'production', 'development'];

  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];

    // Handle --env=value format
    if (arg.startsWith('--env=')) {
      const envValue = arg.split('=')[1];
      if (envValue && validEnvs.includes(envValue)) {
        return envValue;
      }
      // biome-ignore lint/suspicious/noConsole: Intentional log at module init time before Logger is available
      console.warn(`Warning: Invalid --env value "${envValue}", defaulting to "test"`);
      return 'test';
    }

    // Handle --env value format (space-separated)
    if (arg === '--env') {
      const nextArg = process.argv[i + 1];
      if (nextArg && validEnvs.includes(nextArg)) {
        return nextArg;
      }
      // biome-ignore lint/suspicious/noConsole: Intentional log at module init time before Logger is available
      console.warn(`Warning: Invalid --env value "${nextArg}", defaulting to "test"`);
      return 'test';
    }
  }

  return 'test'; // Default for backwards compatibility
}

// Load environment file at the very start
// This ensures environment variables are available before any validation
// Using override: true to prevent shell environment pollution (fixes #966/#967)
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const envName = getEnvNameFromArgs();
// From src/seed/seed-engine/ go up 3 levels to apps/payload/
const envPath = path.resolve(dirname, `../../../.env.${envName}`);
// biome-ignore lint/suspicious/noConsole: Intentional log at module init time before Logger is available
console.log(`[seed-engine] Loading environment from: .env.${envName}`);
loadEnv({ path: envPath, override: true });

/**
 * Exit codes for CLI process
 */
const EXIT_CODES = {
  SUCCESS: 0,
  VALIDATION_ERROR: 1,
  INITIALIZATION_ERROR: 2,
  SEEDING_ERROR: 3,
} as const;

/**
 * Parse CLI arguments and return seed options
 *
 * @returns Parsed seed options
 */
export function parseArguments(): SeedOptions {
  const program = new Command();

  program
    .name('seed-engine')
    .description('Seed Payload CMS collections with pre-defined data')
    .version('1.0.0')
    .option('--dry-run', 'Validate data and dependencies without creating records', false)
    .option('--verbose', 'Enable detailed logging (per-record progress)', false)
    .option(
      '-c, --collections <collections>',
      'Comma-separated list of collections to seed (e.g., "courses,course-lessons")',
      ''
    )
    .option(
      '--max-retries <number>',
      'Maximum retry attempts for transient failures',
      String(DEFAULT_OPTIONS.MAX_RETRIES)
    )
    .option(
      '--timeout <ms>',
      'Operation timeout in milliseconds',
      String(DEFAULT_OPTIONS.TIMEOUT_MS)
    )
    .option(
      '--env <environment>',
      'Environment file to load (test, production, development)',
      'test'
    )
    .option(
      '--force',
      'Bypass production safety check for intentional remote seeding',
      false
    )
    .addHelpText(
      'after',
      `
Examples:
  $ pnpm seed:run
    Seed all collections in dependency order

  $ pnpm seed:run --dry-run
    Validate all data without creating records

  $ pnpm seed:run --verbose
    Seed with detailed per-record logging

  $ pnpm seed:run -c courses,course-lessons
    Seed only specific collections

  $ pnpm seed:run --dry-run --verbose
    Full validation with detailed output

  $ pnpm seed:run --env=production
    Seed using production environment file (.env.production)

  $ pnpm seed:run --env=production --force
    Seed production environment, bypassing safety check

Environment Variables:
  DATABASE_URI       PostgreSQL connection string (required)
  PAYLOAD_SECRET     Payload secret key (required)
  NODE_ENV           Must be 'development' or 'test' (not 'production')

Safety:
  - Production seeding is blocked by default (use --force to bypass)
  - Dry-run mode validates without side effects
  - All operations are logged with timestamps
  - Graceful cleanup on errors or interruption
`
    );

  program.parse();

  const opts = program.opts();

  // Parse collections filter
  const collectionsFilter: string[] = opts.collections
    ? opts.collections.split(',').map((c: string) => c.trim()).filter(Boolean)
    : [];

  return {
    dryRun: opts.dryRun as boolean,
    verbose: opts.verbose as boolean,
    collections: collectionsFilter,
    maxRetries: parseInt(opts.maxRetries as string, 10),
    timeout: parseInt(opts.timeout as string, 10),
    force: opts.force as boolean,
  };
}

/**
 * Validate environment and check safety conditions
 *
 * @param logger - Logger instance for output
 * @param force - If true, bypass production safety check
 * @returns True if validation passes, false otherwise
 */
export function validateEnvironmentSafety(logger: Logger, force = false): boolean {
  // Check NODE_ENV
  const nodeEnv = process.env[ENV_VARS.NODE_ENV];
  if (nodeEnv === 'production') {
    if (force) {
      logger.warn('WARNING: Production safety check bypassed with --force flag');
    } else {
      logger.error('SAFETY CHECK FAILED: Seeding is not allowed in production environment');
      logger.info('Set NODE_ENV to "development" or "test" to proceed');
      logger.info('Use --force to bypass this check for intentional remote seeding');
      return false;
    }
  }

  // Check required environment variables
  const validation = validateEnvironment();
  if (!validation.valid) {
    logger.error('Environment validation failed');
    logger.error(`Missing required environment variables: ${validation.missing.join(', ')}`);
    logger.info('');
    logger.info('Required environment variables:');
    logger.info(`${ENV_VARS.DATABASE_URI}  - PostgreSQL connection string`);
    logger.info(`${ENV_VARS.PAYLOAD_SECRET}  - Payload secret key`);
    return false;
  }

  return true;
}

/**
 * Main seeding operation
 *
 * @param options - Seed options from CLI
 * @param logger - Logger instance
 * @returns Exit code
 */
export async function runSeeding(options: SeedOptions, logger: Logger): Promise<number> {
  try {
    // Initialize Payload
    logger.info('Initializing Payload CMS...');
    const payload = await initializePayload();
    logger.success('Payload initialized successfully');

    // Check if we can connect to database
    try {
      // Simple health check - try to query collections
      const healthCheck = await payload.find({
        collection: 'users',
        limit: 0,
      });
      if (healthCheck === undefined) {
        throw new Error('Database health check failed');
      }
      logger.success('Database connection verified');
    } catch (error) {
      logger.error('Database connection failed', error instanceof Error ? error : undefined);
      return EXIT_CODES.INITIALIZATION_ERROR;
    }

    // Import and run orchestrator
    try {
      const { runSeeding } = await import('./core/seed-orchestrator.js');

      logger.info('Starting seeding operation...');
      logger.debug('Seed options', options as unknown as Record<string, unknown>);

      if (options.dryRun) {
        logger.info('DRY-RUN MODE: Validation only, no records will be created');
      }

      if (options.collections.length > 0) {
        logger.info(`Filtering collections: ${options.collections.join(', ')}`);
      } else {
        logger.info('Processing all collections');
      }

      // Run the seeding orchestrator
      const result = await runSeeding(options);

      // Report results
      if (result.success) {
        logger.success(`Seeded ${result.summary.totalRecords} records successfully`);
        return EXIT_CODES.SUCCESS;
      } else {
        logger.error(`Seeding completed with ${result.summary.failureCount} errors`);
        return EXIT_CODES.SEEDING_ERROR;
      }
    } catch (error) {
      logger.error('Seeding operation failed', error instanceof Error ? error : undefined);
      return EXIT_CODES.SEEDING_ERROR;
    }

  } catch (error) {
    logger.error('Initialization failed', error instanceof Error ? error : undefined);
    return EXIT_CODES.INITIALIZATION_ERROR;
  } finally {
    // Always cleanup, even on errors
    await cleanupPayload();
  }
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  // Get --force flag early (before Commander parses) for use in validation
  const forceFlag = getForceFromArgs();

  // Parse arguments
  const options = parseArguments();

  // Configure logger
  const logger = new Logger({
    verbose: options.verbose,
    level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
  });

  // Print banner
  logger.info('═══════════════════════════════════════════════════════');
  logger.info('   Payload CMS Seeding Engine');
  logger.info('═══════════════════════════════════════════════════════');
  logger.info('');

  // Validate environment (pass force flag to bypass production safety check if specified)
  if (!validateEnvironmentSafety(logger, forceFlag)) {
    process.exit(EXIT_CODES.VALIDATION_ERROR);
  }

  logger.success('Environment validation passed');
  logger.info('');

  // Run seeding operation
  const exitCode = await runSeeding(options, logger);

  // Print summary
  logger.info('');
  logger.info('═══════════════════════════════════════════════════════');
  if (exitCode === EXIT_CODES.SUCCESS) {
    logger.success('Seeding completed successfully');
  } else {
    logger.error('Seeding failed - see errors above');
  }
  logger.info('═══════════════════════════════════════════════════════');

  process.exit(exitCode);
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(EXIT_CODES.SEEDING_ERROR);
  });
}
