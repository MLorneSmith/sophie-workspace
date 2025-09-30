/**
 * JSON Data Loader for Payload CMS Seeding Engine
 *
 * This module handles loading and validating seed data from JSON files.
 * Provides comprehensive error handling with detailed context.
 *
 * @module seed-engine/loaders/json-loader
 */

import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { SeedRecord } from '../types';
import { COLLECTION_CONFIGS, SEED_DATA_DIR } from '../config';

/**
 * Error thrown when JSON parsing fails
 */
export class JSONParseError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly lineNumber?: number,
    public readonly columnNumber?: number,
  ) {
    super(message);
    this.name = 'JSONParseError';
  }
}

/**
 * Error thrown when a JSON file is not found
 */
export class FileNotFoundError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
  ) {
    super(message);
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error thrown when JSON structure validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly issues: string[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Result of loading a collection
 */
export interface LoadResult {
  /** Collection name */
  collection: string;
  /** Loaded and validated records */
  records: SeedRecord[];
  /** Source file path */
  filePath: string;
  /** Number of records loaded */
  recordCount: number;
}

/**
 * Extract line and column numbers from JSON parse error
 *
 * Parses error messages from JSON.parse() to extract position information.
 *
 * @param error - Error from JSON.parse()
 * @returns Object with line and column numbers, or undefined if not found
 *
 * @example
 * ```typescript
 * try {
 *   JSON.parse('{ invalid json }');
 * } catch (err) {
 *   const pos = extractPosition(err);
 *   console.log(pos); // { line: 1, column: 3 }
 * }
 * ```
 */
function extractPosition(error: Error): { line: number; column: number } | undefined {
  // JSON.parse error format: "Unexpected token ... at position N"
  // or "Unexpected end of JSON input"
  const posMatch = error.message.match(/at position (\d+)/);
  if (!posMatch) {
    return undefined;
  }

  // Position is character index in string
  // We can't reliably convert to line/column without the original text
  const position = parseInt(posMatch[1], 10);
  return { line: 1, column: position };
}

/**
 * Parse JSON with enhanced error reporting
 *
 * Wraps JSON.parse() to provide better error messages with file context.
 *
 * @param content - JSON string to parse
 * @param filePath - Source file path for error reporting
 * @returns Parsed JSON data
 * @throws {JSONParseError} If parsing fails
 *
 * @example
 * ```typescript
 * const data = parseJSON('{"valid": "json"}', 'data.json');
 * console.log(data); // { valid: 'json' }
 * ```
 */
function parseJSON(content: string, filePath: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof Error) {
      const position = extractPosition(error);
      const message = position
        ? `Failed to parse JSON at line ${position.line}, column ${position.column}: ${error.message}`
        : `Failed to parse JSON: ${error.message}`;

      throw new JSONParseError(
        message,
        filePath,
        position?.line,
        position?.column,
      );
    }
    throw error;
  }
}

/**
 * Validate JSON structure for a collection
 *
 * Checks that the parsed data:
 * - Is an array
 * - Contains objects
 * - Each object has required identifier field (_ref or slug)
 * - Critical fields have correct types
 *
 * @param data - Parsed JSON data
 * @param collection - Collection name for error messages
 * @param filePath - Source file path for error reporting
 * @returns Array of validation issues (empty if valid)
 *
 * @example
 * ```typescript
 * const data = [{ _ref: 'test', title: 'Test' }];
 * const issues = validateStructure(data, 'posts', 'posts.json');
 * console.log(issues.length); // 0 (valid)
 * ```
 */
function validateStructure(
  data: unknown,
  collection: string,
  filePath: string,
): string[] {
  const issues: string[] = [];

  // Check if data is an array
  if (!Array.isArray(data)) {
    issues.push('Root element must be an array');
    return issues; // Fatal error, can't continue validation
  }

  // Check if array is empty
  if (data.length === 0) {
    issues.push('Array is empty - no records to seed');
    return issues; // Not fatal, but worth reporting
  }

  // Validate each record
  data.forEach((record, index) => {
    if (typeof record !== 'object' || record === null) {
      issues.push(`Record at index ${index} is not an object`);
      return;
    }

    // Check for identifier field (_ref or slug)
    const hasRef = '_ref' in record;
    const hasSlug = 'slug' in record;

    if (!hasRef && !hasSlug) {
      issues.push(
        `Record at index ${index} is missing identifier field (_ref or slug)`,
      );
    }

    // Validate _ref format if present
    if (hasRef && typeof record._ref !== 'string') {
      issues.push(`Record at index ${index} has invalid _ref type (expected string)`);
    }

    // Validate slug format if present
    if (hasSlug && typeof record.slug !== 'string') {
      issues.push(`Record at index ${index} has invalid slug type (expected string)`);
    }

    // Type validation for common critical fields
    if ('status' in record && typeof record.status !== 'string') {
      issues.push(`Record at index ${index} has invalid status type (expected string)`);
    }

    if ('publishedAt' in record && typeof record.publishedAt !== 'string') {
      issues.push(
        `Record at index ${index} has invalid publishedAt type (expected string)`,
      );
    }

    // Validate title if present (common field)
    if ('title' in record && typeof record.title !== 'string') {
      issues.push(`Record at index ${index} has invalid title type (expected string)`);
    }
  });

  return issues;
}

/**
 * Resolve file path for a collection
 *
 * Constructs absolute path to JSON file from collection name.
 * Uses configuration to determine correct file name.
 *
 * @param collection - Collection name
 * @returns Absolute path to JSON file
 * @throws {Error} If collection is not configured
 *
 * @example
 * ```typescript
 * const path = resolveFilePath('courses');
 * console.log(path); // /absolute/path/to/seed-data/courses.json
 * ```
 */
function resolveFilePath(collection: string): string {
  const config = COLLECTION_CONFIGS[collection];
  if (!config) {
    throw new Error(`Collection "${collection}" is not configured`);
  }

  // Use import.meta.url in ESM or resolve from current file in CommonJS
  // Since we're in loaders/ directory, seed-data is ../seed-data
  // But we need to navigate from the compiled output location
  // The safest approach is to use file:// URL or resolve from known base

  // Calculate path relative to this source file location
  // loaders/json-loader.ts -> ../seed-data
  const seedDataPath = resolve(__dirname, '..', '..', 'seed-data');

  // Join with data file name
  return join(seedDataPath, config.dataFile);
}

/**
 * Load a single collection from JSON file
 *
 * Reads, parses, and validates JSON seed data for a collection.
 * Provides comprehensive error handling with detailed context.
 *
 * @param collection - Collection name (must be configured in COLLECTION_CONFIGS)
 * @returns Load result with records and metadata
 * @throws {FileNotFoundError} If JSON file doesn't exist
 * @throws {JSONParseError} If JSON parsing fails
 * @throws {ValidationError} If structure validation fails
 *
 * @example
 * ```typescript
 * const result = await loadCollection('courses');
 * console.log(`Loaded ${result.recordCount} courses`);
 * result.records.forEach(course => {
 *   console.log(course.title);
 * });
 * ```
 */
export async function loadCollection(collection: string): Promise<LoadResult> {
  // Resolve file path
  const filePath = resolveFilePath(collection);

  // Read file
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new FileNotFoundError(
        `JSON file not found for collection "${collection}": ${filePath}`,
        filePath,
      );
    }
    throw error;
  }

  // Parse JSON
  const data = parseJSON(content, filePath);

  // Validate structure
  const issues = validateStructure(data, collection, filePath);
  if (issues.length > 0) {
    throw new ValidationError(
      `Validation failed for collection "${collection}"`,
      filePath,
      issues,
    );
  }

  // Type assertion is safe after validation
  const records = data as SeedRecord[];

  return {
    collection,
    records,
    filePath,
    recordCount: records.length,
  };
}

/**
 * Load all collections defined in seed order
 *
 * Loads all configured collections in dependency order.
 * Continues loading even if individual collections fail (collects errors).
 *
 * @returns Array of load results for successful collections
 * @throws {AggregateError} If any collections fail to load (contains all errors)
 *
 * @example
 * ```typescript
 * try {
 *   const results = await loadAllCollections();
 *   console.log(`Loaded ${results.length} collections`);
 *   const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);
 *   console.log(`Total records: ${totalRecords}`);
 * } catch (error) {
 *   if (error instanceof AggregateError) {
 *     error.errors.forEach(err => console.error(err.message));
 *   }
 * }
 * ```
 */
export async function loadAllCollections(): Promise<LoadResult[]> {
  const collections = Object.keys(COLLECTION_CONFIGS);
  const results: LoadResult[] = [];
  const errors: Error[] = [];

  for (const collection of collections) {
    try {
      const result = await loadCollection(collection);
      results.push(result);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error);
      } else {
        errors.push(new Error(`Unknown error loading collection "${collection}"`));
      }
    }
  }

  // If any collections failed, throw aggregate error
  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `Failed to load ${errors.length} of ${collections.length} collections`,
    );
  }

  return results;
}

/**
 * Load specific collections by name
 *
 * Loads only the specified collections (useful for testing or partial seeding).
 *
 * @param collections - Array of collection names to load
 * @returns Array of load results for successful collections
 * @throws {AggregateError} If any collections fail to load (contains all errors)
 *
 * @example
 * ```typescript
 * const results = await loadCollections(['courses', 'course-lessons']);
 * console.log(`Loaded ${results.length} collections`);
 * ```
 */
export async function loadCollections(collections: string[]): Promise<LoadResult[]> {
  const results: LoadResult[] = [];
  const errors: Error[] = [];

  for (const collection of collections) {
    try {
      const result = await loadCollection(collection);
      results.push(result);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error);
      } else {
        errors.push(new Error(`Unknown error loading collection "${collection}"`));
      }
    }
  }

  // If any collections failed, throw aggregate error
  if (errors.length > 0) {
    throw new AggregateError(
      errors,
      `Failed to load ${errors.length} of ${collections.length} collections`,
    );
  }

  return results;
}
