/**
 * Configuration constants for the Payload CMS Seeding Engine
 *
 * This module defines:
 * - Collection seeding order based on dependencies
 * - Default options and timeouts
 * - Error retry configuration
 *
 * @module seed-engine/config
 */

import type { CollectionConfig } from './types';

/**
 * Seed order based on foreign key dependencies
 *
 * Collections are processed in this exact order to ensure all referenced
 * records exist before dependent records are created.
 *
 * **Dependency Levels**:
 * - Level 0: Independent collections (no foreign keys)
 * - Level 1: Depend only on Level 0
 * - Level 2: Depend on Level 0-1
 * - Level 3: Depend on Level 0-2
 * - Level 4: Depend on Level 0-3
 *
 * @example
 * ```typescript
 * // Process collections in order
 * for (const collection of SEED_ORDER) {
 *   await seedCollection(collection);
 * }
 * ```
 */
export const SEED_ORDER: readonly string[] = [
  // Level 0: Independent collections (no dependencies)
  'users', // User accounts
  'media', // Media files and uploads
  'downloads', // Downloadable resources

  // Level 1: Depend on Level 0 (media, downloads, users)
  'posts', // Blog posts (may reference media)
  'courses', // Course definitions (may reference media/downloads)
  'private', // Private posts (may reference media/downloads)

  // Level 2: Depend on Level 0-1 (courses, media, downloads)
  'course-lessons', // Course lessons (reference courses, media, downloads)
  'documentation', // Help documentation (may reference media)

  // Level 3: Depend on Level 0-2 (lessons, courses)
  'course-quizzes', // Quizzes (reference courses)
  'surveys', // Surveys (may reference courses or lessons)

  // Level 4: Depend on Level 0-3 (quizzes, surveys)
  'quiz-questions', // Quiz questions (reference quizzes)
  'survey-questions', // Survey questions (reference surveys)
] as const;

/**
 * Collection configurations with metadata
 *
 * Maps collection slugs to their configuration including processor type,
 * data file location, and explicit dependencies.
 *
 * @example
 * ```typescript
 * const config = COLLECTION_CONFIGS['course-lessons'];
 * console.log(config.dependencies); // ['courses', 'media', 'downloads']
 * ```
 */
export const COLLECTION_CONFIGS: Record<string, CollectionConfig> = {
  users: {
    name: 'users',
    dataFile: 'users.json',
    processor: 'users',
    dependencies: [],
  },
  media: {
    name: 'media',
    dataFile: 'media.json',
    processor: 'media',
    dependencies: [],
  },
  downloads: {
    name: 'downloads',
    dataFile: 'downloads.json',
    processor: 'downloads',
    dependencies: [],
  },
  posts: {
    name: 'posts',
    dataFile: 'posts.json',
    processor: 'content',
    dependencies: ['media'],
  },
  courses: {
    name: 'courses',
    dataFile: 'courses.json',
    processor: 'content',
    dependencies: ['media', 'downloads'],
  },
  'course-lessons': {
    name: 'course-lessons',
    dataFile: 'course-lessons.json',
    processor: 'content',
    dependencies: ['courses', 'media', 'downloads'],
  },
  documentation: {
    name: 'documentation',
    dataFile: 'documentation.json',
    processor: 'content',
    dependencies: ['media'],
  },
  'course-quizzes': {
    name: 'course-quizzes',
    dataFile: 'course-quizzes.json',
    processor: 'content',
    dependencies: ['courses'],
  },
  surveys: {
    name: 'surveys',
    dataFile: 'surveys.json',
    processor: 'content',
    dependencies: ['courses', 'course-lessons'],
  },
  'quiz-questions': {
    name: 'quiz-questions',
    dataFile: 'quiz-questions.json',
    processor: 'content',
    dependencies: ['course-quizzes'],
  },
  'survey-questions': {
    name: 'survey-questions',
    dataFile: 'survey-questions.json',
    processor: 'content',
    dependencies: ['surveys'],
  },
  private: {
    name: 'private',
    dataFile: 'private.json',
    processor: 'content',
    dependencies: ['media', 'downloads'],
  },
};

/**
 * Default seeding options
 *
 * These defaults are used when options are not explicitly provided via CLI.
 *
 * @property MAX_RETRIES - Maximum retry attempts for transient failures
 * @property TIMEOUT_MS - Operation timeout in milliseconds
 * @property RETRY_DELAY_MS - Initial retry delay in milliseconds (doubles each attempt)
 * @property MAX_RETRY_DELAY_MS - Maximum retry delay (cap for exponential backoff)
 */
export const DEFAULT_OPTIONS = {
  /** Maximum retry attempts for transient failures (network, locks) */
  MAX_RETRIES: 3,

  /** Operation timeout in milliseconds (2 minutes) */
  TIMEOUT_MS: 120000,

  /** Initial retry delay in milliseconds (exponential backoff starts here) */
  RETRY_DELAY_MS: 1000,

  /** Maximum retry delay in milliseconds (cap at 10 seconds) */
  MAX_RETRY_DELAY_MS: 10000,
} as const;

/**
 * Reference pattern regex for validation and resolution
 *
 * Matches: {ref:collection:identifier}
 * - collection: Collection slug
 * - identifier: Unique identifier within collection (_ref field value)
 *
 * @example
 * ```typescript
 * const pattern = "{ref:courses:ddm}";
 * const match = pattern.match(REFERENCE_PATTERN);
 * console.log(match[1]); // "courses"
 * console.log(match[2]); // "ddm"
 * ```
 */
export const REFERENCE_PATTERN = /\{ref:([^:]+):([^}]+)\}/g;

/**
 * Environment variable pattern regex for substitution
 *
 * Matches: {env:VAR_NAME}
 * - VAR_NAME: Environment variable name
 *
 * @example
 * ```typescript
 * const pattern = "{env:SEED_USER_PASSWORD}";
 * const match = pattern.match(ENV_VAR_PATTERN);
 * console.log(match[1]); // "SEED_USER_PASSWORD"
 * ```
 */
export const ENV_VAR_PATTERN = /\{env:([^}]+)\}/g;

/**
 * Environment variable names
 *
 * Required environment variables for seeding operation.
 */
export const ENV_VARS = {
  /** PostgreSQL connection string */
  DATABASE_URI: 'DATABASE_URI',

  /** Payload secret key for encryption */
  PAYLOAD_SECRET: 'PAYLOAD_SECRET',

  /** Node environment (prevents production seeding) */
  NODE_ENV: 'NODE_ENV',

  /** Default password for seeded user accounts */
  SEED_USER_PASSWORD: 'SEED_USER_PASSWORD',
} as const;

/**
 * Logging levels
 *
 * Controls verbosity of seeding output.
 */
export enum LogLevel {
  /** Minimal output (errors only) */
  ERROR = 'error',

  /** Standard output (info + errors) */
  INFO = 'info',

  /** Detailed output (debug + info + errors) */
  DEBUG = 'debug',

  /** Maximum verbosity (trace + debug + info + errors) */
  TRACE = 'trace',
}

/**
 * Progress update interval in milliseconds
 *
 * How often to update progress bars and reports during seeding.
 */
export const PROGRESS_UPDATE_INTERVAL_MS = 100;

/**
 * Seed data directory path (relative to seed-engine)
 *
 * Location of JSON seed files.
 */
export const SEED_DATA_DIR = '../seed-data';

/**
 * Batch size for bulk operations (future enhancement)
 *
 * Currently unused - seeding is sequential.
 * Reserved for future batch processing optimization.
 */
export const BATCH_SIZE = 50;
