/**
 * Payload Local API initializer with singleton pattern
 *
 * Provides:
 * - Singleton Payload instance for seeding
 * - Environment variable validation
 * - Graceful error handling and cleanup
 * - Minimal configuration for seeding operations
 *
 * @module seed-engine/core/payload-initializer
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload, type Payload } from 'payload';
import type { InitOptions } from 'payload';
import { logger } from '../utils/logger';
import { ENV_VARS } from '../config';

/**
 * Singleton Payload instance
 */
let payloadInstance: Payload | null = null;

/**
 * Environment variable validation result
 */
interface ValidationResult {
  /** Whether all required variables are present */
  valid: boolean;
  /** List of missing variable names */
  missing: string[];
}

/**
 * Validate required environment variables
 *
 * @returns Validation result with missing variables
 *
 * @example
 * ```typescript
 * const validation = validateEnvironment();
 * if (!validation.valid) {
 *   console.error('Missing required environment variables:', validation.missing);
 *   process.exit(1);
 * }
 * ```
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];

  // Check required environment variables
  if (!process.env[ENV_VARS.DATABASE_URI]) {
    missing.push(ENV_VARS.DATABASE_URI);
  }

  if (!process.env[ENV_VARS.PAYLOAD_SECRET]) {
    missing.push(ENV_VARS.PAYLOAD_SECRET);
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Prevent seeding in production environment
 *
 * @throws Error if NODE_ENV is 'production'
 */
function preventProductionSeeding(): void {
  const nodeEnv = process.env[ENV_VARS.NODE_ENV];

  if (nodeEnv === 'production') {
    throw new Error(
      'SAFETY CHECK FAILED: Seeding is not allowed in production environment. ' +
        'Set NODE_ENV to "development" or "test" to proceed.'
    );
  }
}

/**
 * Get or initialize Payload instance (singleton pattern)
 *
 * This function ensures only one Payload instance is created and reused
 * throughout the seeding process. This is critical for:
 * - Performance: Avoid repeated initialization overhead
 * - Connection pooling: Maintain single database connection pool
 * - Memory efficiency: Prevent resource leaks
 *
 * @returns Promise resolving to Payload instance
 * @throws Error if environment validation fails or initialization errors occur
 *
 * @example
 * ```typescript
 * const payload = await initializePayload();
 * const courses = await payload.find({ collection: 'courses' });
 * ```
 */
export async function initializePayload(): Promise<Payload> {
  // Return existing instance if already initialized
  if (payloadInstance) {
    logger.debug('Reusing existing Payload instance');
    return payloadInstance;
  }

  logger.info('Initializing Payload Local API...');

  // Validate environment variables
  const validation = validateEnvironment();
  if (!validation.valid) {
    const errorMessage = `Missing required environment variables: ${validation.missing.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Prevent production seeding
  try {
    preventProductionSeeding();
  } catch (error) {
    logger.error('Production seeding prevented', error instanceof Error ? error : undefined);
    throw error;
  }

  try {
    // Get path to main payload config (it handles env vars better than seeding config)
    const filename = fileURLToPath(import.meta.url);
    const dirname = path.dirname(filename);
    const configPath = path.resolve(dirname, '../../../payload.config.ts');

    logger.debug('Loading Payload config', { configPath });

    // Initialize Payload with minimal config for seeding
    const initOptions: InitOptions = {
      config: configPath,
      disableOnInit: true, // Skip onInit hooks during seeding
    };

    payloadInstance = await getPayload(initOptions);

    logger.success('Payload Local API initialized successfully');
    return payloadInstance;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to initialize Payload', error instanceof Error ? error : undefined);
    throw new Error(`Payload initialization failed: ${errorMessage}`);
  }
}

/**
 * Clean up Payload instance and close connections
 *
 * Call this function when seeding is complete to ensure proper cleanup:
 * - Close database connections
 * - Release resources
 * - Clear singleton instance
 *
 * @example
 * ```typescript
 * try {
 *   await seedAllCollections();
 * } finally {
 *   await cleanupPayload();
 * }
 * ```
 */
export async function cleanupPayload(): Promise<void> {
  if (!payloadInstance) {
    logger.debug('No Payload instance to clean up');
    return;
  }

  logger.info('Cleaning up Payload instance...');

  try {
    // Close database connections
    if (payloadInstance.db && typeof payloadInstance.db.destroy === 'function') {
      await payloadInstance.db.destroy();
      logger.debug('Database connections closed');
    }

    // Clear singleton instance
    payloadInstance = null;

    logger.success('Payload cleanup completed');
  } catch (error) {
    logger.error('Error during Payload cleanup', error instanceof Error ? error : undefined);
    // Don't rethrow - allow graceful shutdown
  }
}

/**
 * Get current Payload instance without initializing
 *
 * Useful for checking if Payload is already initialized.
 *
 * @returns Current Payload instance or null
 */
export function getPayloadInstance(): Payload | null {
  return payloadInstance;
}

/**
 * Reset Payload instance (for testing purposes)
 *
 * @internal
 */
export function resetPayloadInstance(): void {
  payloadInstance = null;
}
