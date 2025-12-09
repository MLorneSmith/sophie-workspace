/**
 * Core TypeScript type definitions for the Payload CMS Seeding Engine
 *
 * This module provides type-safe interfaces for:
 * - Seed record structure
 * - Collection configuration
 * - Reference resolution and caching
 * - Processing results and error handling
 * - CLI options and progress reporting
 *
 * @module seed-engine/types
 */

/**
 * Base type for seed data records
 *
 * Represents a single record to be seeded into a Payload collection.
 * All fields are dynamic based on the collection schema.
 *
 * @property _ref - Internal identifier for reference resolution (removed before creation)
 * @property _status - Internal status flag for validation (removed before creation)
 *
 * @example
 * ```typescript
 * const record: SeedRecord = {
 *   _ref: "ddm",
 *   slug: "data-driven-marketing",
 *   title: "Data-Driven Marketing",
 *   course: "{ref:courses:ddm}"
 * };
 * ```
 */
export interface SeedRecord {
  /** Internal reference identifier (not persisted to database) */
  _ref?: string;
  /** Internal status flag for validation (not persisted to database) */
  _status?: string;
  /** Dynamic fields based on collection schema */
  [key: string]: unknown;
}

/**
 * Configuration for a Payload collection
 *
 * Defines metadata and processing configuration for seeding a collection.
 *
 * @property name - Collection slug (matches Payload config)
 * @property dataFile - JSON file name in seed-data directory
 * @property processor - Processor type to use for this collection
 * @property dependencies - Collections that must be seeded before this one
 *
 * @example
 * ```typescript
 * const config: CollectionConfig = {
 *   name: "course-lessons",
 *   dataFile: "course-lessons.json",
 *   processor: "content",
 *   dependencies: ["courses", "media", "downloads"]
 * };
 * ```
 */
export interface CollectionConfig {
  /** Collection slug as defined in Payload config */
  name: string;
  /** JSON file name in seed-data directory (e.g., "courses.json") */
  dataFile: string;
  /** Processor type: "content", "downloads", "users", "media" */
  processor: ProcessorType;
  /** Collection slugs that must be seeded before this one */
  dependencies: string[];
}

/**
 * Processor type for collection-specific handling
 *
 * - `content`: Generic content processor for most collections
 * - `downloads`: Specialized processor preserving pre-assigned UUIDs
 * - `users`: User-specific processor with auth logic
 * - `media`: Media file upload processor
 * - `documentation`: Documentation-specific processor for structured content
 */
export type ProcessorType = 'content' | 'downloads' | 'users' | 'media' | 'documentation';

/**
 * In-memory cache for reference resolution
 *
 * Maps reference patterns to created UUIDs for relationship resolution.
 * Uses format "collection:identifier" → UUID.
 *
 * @example
 * ```typescript
 * const cache: ReferenceCache = new Map([
 *   ["courses:ddm", "123e4567-e89b-12d3-a456-426614174000"],
 *   ["downloads:template1", "987fcdeb-51a2-43f7-8d9e-123456789abc"]
 * ]);
 *
 * // Resolve reference
 * const courseId = cache.get("courses:ddm");
 * ```
 */
export type ReferenceCache = Map<string, string>;

/**
 * Result from processing a single record or batch
 *
 * @property success - Whether the operation succeeded
 * @property recordId - UUID of created record (if successful)
 * @property identifier - Reference identifier from _ref field
 * @property error - Error message (if failed)
 * @property duration - Time taken to process in milliseconds
 *
 * @example
 * ```typescript
 * const result: ProcessorResult = {
 *   success: true,
 *   recordId: "123e4567-e89b-12d3-a456-426614174000",
 *   identifier: "ddm",
 *   duration: 245
 * };
 * ```
 */
export interface ProcessorResult {
  /** Whether the record was successfully created */
  success: boolean;
  /** UUID of the created record (if successful) */
  recordId?: string;
  /** Reference identifier from _ref field (for cache registration) */
  identifier?: string;
  /** Error message (if failed) */
  error?: string;
  /** Time taken to process this record in milliseconds */
  duration: number;
}

/**
 * Batch processing result for a collection
 *
 * @property collection - Collection slug that was processed
 * @property successCount - Number of successfully created records
 * @property failureCount - Number of failed records
 * @property results - Individual record results
 * @property totalDuration - Total time for entire collection in milliseconds
 *
 * @example
 * ```typescript
 * const batchResult: BatchProcessorResult = {
 *   collection: "courses",
 *   successCount: 1,
 *   failureCount: 0,
 *   results: [{ success: true, recordId: "...", duration: 245 }],
 *   totalDuration: 245
 * };
 * ```
 */
export interface BatchProcessorResult {
  /** Collection slug that was processed */
  collection: string;
  /** Number of successfully created records */
  successCount: number;
  /** Number of failed records */
  failureCount: number;
  /** Individual record processing results */
  results: ProcessorResult[];
  /** Total time for entire collection in milliseconds */
  totalDuration: number;
}

/**
 * CLI options for seed command
 *
 * @property dryRun - Validate only, do not create records
 * @property verbose - Enable detailed logging
 * @property collections - Filter to specific collections (comma-separated)
 * @property maxRetries - Maximum retry attempts for transient failures
 * @property timeout - Operation timeout in milliseconds
 * @property force - Bypass production safety check for intentional remote seeding
 *
 * @example
 * ```typescript
 * const options: SeedOptions = {
 *   dryRun: false,
 *   verbose: true,
 *   collections: ["courses", "course-lessons"],
 *   maxRetries: 3,
 *   timeout: 120000,
 *   force: false
 * };
 * ```
 */
export interface SeedOptions {
  /** Validate only, do not create records */
  dryRun: boolean;
  /** Enable detailed logging (per-record progress) */
  verbose: boolean;
  /** Filter to specific collections (empty array = all collections) */
  collections: string[];
  /** Maximum retry attempts for transient failures (default: 3) */
  maxRetries: number;
  /** Operation timeout in milliseconds (default: 120000) */
  timeout: number;
  /** Bypass production safety check for intentional remote seeding (default: false) */
  force?: boolean;
}

/**
 * Progress report for seeding operation
 *
 * @property currentCollection - Collection currently being processed
 * @property currentRecord - Current record index (1-based)
 * @property totalRecords - Total records in current collection
 * @property completedCollections - Number of completed collections
 * @property totalCollections - Total collections to process
 * @property elapsedTime - Elapsed time in milliseconds
 * @property estimatedTimeRemaining - Estimated time remaining in milliseconds
 *
 * @example
 * ```typescript
 * const progress: ProgressReport = {
 *   currentCollection: "course-lessons",
 *   currentRecord: 15,
 *   totalRecords: 25,
 *   completedCollections: 3,
 *   totalCollections: 10,
 *   elapsedTime: 12500,
 *   estimatedTimeRemaining: 25000
 * };
 * ```
 */
export interface ProgressReport {
  /** Collection currently being processed */
  currentCollection: string;
  /** Current record index (1-based) */
  currentRecord: number;
  /** Total records in current collection */
  totalRecords: number;
  /** Number of completed collections */
  completedCollections: number;
  /** Total collections to process */
  totalCollections: number;
  /** Elapsed time since seeding started (milliseconds) */
  elapsedTime: number;
  /** Estimated time remaining (milliseconds) */
  estimatedTimeRemaining: number | null;
}

/**
 * Final summary report for seeding operation
 *
 * @property totalRecords - Total records across all collections
 * @property successCount - Total successful records
 * @property failureCount - Total failed records
 * @property totalDuration - Total execution time in milliseconds
 * @property averageSpeed - Average records per second
 * @property collectionResults - Results grouped by collection
 * @property slowestCollections - Top 3 slowest collections by duration
 *
 * @example
 * ```typescript
 * const summary: SeedingSummary = {
 *   totalRecords: 316,
 *   successCount: 316,
 *   failureCount: 0,
 *   totalDuration: 82450,
 *   averageSpeed: 3.8,
 *   collectionResults: [
 *     { collection: "courses", successCount: 1, failureCount: 0, totalDuration: 245 }
 *   ],
 *   slowestCollections: [
 *     { collection: "course-lessons", duration: 6210 }
 *   ]
 * };
 * ```
 */
export interface SeedingSummary {
  /** Total records processed across all collections */
  totalRecords: number;
  /** Total successful records */
  successCount: number;
  /** Total failed records */
  failureCount: number;
  /** Total execution time in milliseconds */
  totalDuration: number;
  /** Average records per second */
  averageSpeed: number;
  /** Results grouped by collection */
  collectionResults: BatchProcessorResult[];
  /** Top 3 slowest collections by duration */
  slowestCollections: Array<{ collection: string; duration: number }>;
}

/**
 * Error classification for retry logic
 *
 * - `transient`: Temporary error (network, locks) - retry with backoff
 * - `validation`: Data validation error - skip record, log warning
 * - `critical`: Configuration or reference error - stop immediately
 */
export type ErrorType = 'transient' | 'validation' | 'critical';

/**
 * Structured error information
 *
 * @property type - Error classification for retry logic
 * @property message - Human-readable error message
 * @property details - Additional error context
 * @property record - Record that caused the error (if applicable)
 * @property collection - Collection being processed
 *
 * @example
 * ```typescript
 * const error: SeedingError = {
 *   type: "critical",
 *   message: "Unresolved reference: {ref:courses:unknown}",
 *   details: { pattern: "{ref:courses:unknown}", cache: [] },
 *   record: { _ref: "lesson-1", ... },
 *   collection: "course-lessons"
 * };
 * ```
 */
export interface SeedingError {
  /** Error classification for retry logic */
  type: ErrorType;
  /** Human-readable error message */
  message: string;
  /** Additional error context (stack trace, validation details, etc.) */
  details?: unknown;
  /** Record that caused the error (if applicable) */
  record?: SeedRecord;
  /** Collection being processed */
  collection: string;
}

/**
 * Reference pattern validation result
 *
 * @property isValid - Whether all references are syntactically valid
 * @property invalidReferences - List of invalid reference patterns found
 * @property unresolvedReferences - List of references that cannot be resolved
 *
 * @example
 * ```typescript
 * const validation: ReferenceValidation = {
 *   isValid: false,
 *   invalidReferences: ["{ref:courses}"],
 *   unresolvedReferences: ["{ref:courses:unknown}"]
 * };
 * ```
 */
export interface ReferenceValidation {
  /** Whether all references are syntactically valid */
  isValid: boolean;
  /** List of invalid reference patterns (syntax errors) */
  invalidReferences: string[];
  /** List of references that cannot be resolved (missing in data) */
  unresolvedReferences: string[];
}

/**
 * Dependency validation result
 *
 * @property isValid - Whether dependency order is valid
 * @property missingDependencies - Collections referenced but not defined
 * @property circularDependencies - Circular dependency chains detected
 *
 * @example
 * ```typescript
 * const depValidation: DependencyValidation = {
 *   isValid: true,
 *   missingDependencies: [],
 *   circularDependencies: []
 * };
 * ```
 */
export interface DependencyValidation {
  /** Whether dependency order is valid */
  isValid: boolean;
  /** Collections referenced but not defined in seed order */
  missingDependencies: string[];
  /** Circular dependency chains detected (e.g., ["A -> B -> C -> A"]) */
  circularDependencies: string[];
}

/**
 * Payload Local API instance type
 *
 * This type is imported from Payload CMS.
 * Defines the initialized Payload instance for Local API operations.
 */
export type { Payload } from 'payload';
