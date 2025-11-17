/**
 * Reference Resolution Engine for Payload CMS Seeding
 *
 * This module provides functionality to:
 * - Parse `{ref:collection:identifier}` patterns in seed data
 * - Maintain an in-memory UUID cache using Map for O(1) lookups
 * - Recursively resolve references throughout data structures
 * - Validate that all references can be resolved before processing
 *
 * @module seed-engine/resolvers/reference-resolver
 */

import { REFERENCE_PATTERN, ENV_VAR_PATTERN } from '../config';
import type { ReferenceCache, SeedRecord } from '../types';

/**
 * Reference resolver class for managing UUID cache and resolving references
 *
 * This class maintains an in-memory cache of UUIDs and provides methods to:
 * - Register UUIDs for specific collection/identifier pairs
 * - Resolve reference patterns to UUIDs
 * - Recursively process data structures to replace all references
 * - Validate that all references can be resolved
 *
 * @example
 * ```typescript
 * const resolver = new ReferenceResolver();
 *
 * // Register UUIDs
 * resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
 *
 * // Resolve a record
 * const record = {
 *   course_id: "{ref:courses:ddm}"
 * };
 * const resolved = resolver.resolve(record);
 * // { course_id: "123e4567-e89b-12d3-a456-426614174000" }
 * ```
 */
export class ReferenceResolver {
  /**
   * In-memory cache mapping "collection:identifier" to UUID
   * Uses Map for O(1) lookups
   */
  private cache: ReferenceCache;

  /**
   * Maximum recursion depth to prevent infinite loops
   */
  private readonly MAX_DEPTH = 100;

  /**
   * Initialize the reference resolver with an empty cache
   */
  constructor() {
    this.cache = new Map();
  }

  /**
   * Register a UUID for a specific collection and identifier
   *
   * @param collection - Collection slug (e.g., "courses", "media")
   * @param identifier - Unique identifier within collection (e.g., "ddm", "/cms/images/thumb.png")
   * @param uuid - UUID to associate with this reference
   *
   * @example
   * ```typescript
   * resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
   * resolver.register('media', '/cms/images/thumb.png', '987fcdeb-51a2-43f7-8d9e-123456789abc');
   * ```
   */
  register(collection: string, identifier: string, uuid: string): void {
    const key = this.createCacheKey(collection, identifier);
    this.cache.set(key, uuid);
  }

  /**
   * Lookup a UUID for a specific collection and identifier
   *
   * @param collection - Collection slug
   * @param identifier - Unique identifier within collection
   * @returns UUID if found, undefined otherwise
   *
   * @example
   * ```typescript
   * const uuid = resolver.lookup('courses', 'ddm');
   * // "123e4567-e89b-12d3-a456-426614174000"
   * ```
   */
  lookup(collection: string, identifier: string): string | undefined {
    const key = this.createCacheKey(collection, identifier);
    return this.cache.get(key);
  }

  /**
   * Recursively resolve all reference patterns in a record
   *
   * This method traverses the entire data structure and replaces all
   * `{ref:collection:identifier}` patterns with their corresponding UUIDs.
   *
   * Handles:
   * - Simple string references: `"{ref:courses:ddm}"` → UUID
   * - Array references: `["{ref:downloads:t1}", "{ref:downloads:t2}"]` → [UUID1, UUID2]
   * - Nested objects: `{"author": {"id": "{ref:users:admin}"}}` → Resolved object
   * - Mixed content: `"Text {ref:users:admin} more text"` → "Text UUID more text"
   *
   * @param record - Record to process (will be cloned, not mutated)
   * @returns New record with all references resolved
   * @throws Error if any reference cannot be resolved
   * @throws Error if maximum recursion depth is exceeded
   *
   * @example
   * ```typescript
   * const record = {
   *   course_id: "{ref:courses:ddm}",
   *   downloads: ["{ref:downloads:t1}", "{ref:downloads:t2}"],
   *   author: { id: "{ref:users:admin}" }
   * };
   * const resolved = resolver.resolve(record);
   * ```
   */
  resolve<T extends SeedRecord>(record: T): T {
    return this.resolveValue(record, 0) as T;
  }

  /**
   * Validate that all references in a record can be resolved
   *
   * This method checks if all reference patterns in the record exist in the cache
   * without actually resolving them. Use this before calling `resolve()` to ensure
   * all dependencies are met.
   *
   * @param record - Record to validate
   * @returns Object with validation results
   * @returns .isValid - Whether all references can be resolved
   * @returns .unresolvedReferences - Array of reference patterns that cannot be resolved
   *
   * @example
   * ```typescript
   * const result = resolver.validate(record);
   * if (!result.isValid) {
   *   console.error('Unresolved references:', result.unresolvedReferences);
   * }
   * ```
   */
  validate(record: SeedRecord): {
    isValid: boolean;
    unresolvedReferences: string[];
  } {
    const unresolvedReferences: string[] = [];
    this.findUnresolvedReferences(record, unresolvedReferences);

    return {
      isValid: unresolvedReferences.length === 0,
      unresolvedReferences,
    };
  }

  /**
   * Get the current cache state
   *
   * @returns Read-only view of the cache
   *
   * @example
   * ```typescript
   * const cache = resolver.getCache();
   * console.log(`Cache size: ${cache.size}`);
   * ```
   */
  getCache(): ReadonlyMap<string, string> {
    return this.cache;
  }

  /**
   * Clear the cache
   *
   * Useful for testing or starting a new seeding operation.
   *
   * @example
   * ```typescript
   * resolver.clear();
   * ```
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   *
   * @returns Object with cache statistics
   *
   * @example
   * ```typescript
   * const stats = resolver.getCacheStats();
   * console.log(`Cache contains ${stats.size} entries`);
   * console.log(`Collections: ${stats.collections.join(', ')}`);
   * ```
   */
  getCacheStats(): {
    size: number;
    collections: string[];
    entries: Array<{ collection: string; identifier: string; uuid: string }>;
  } {
    const collections = new Set<string>();
    const entries: Array<{
      collection: string;
      identifier: string;
      uuid: string;
    }> = [];

    for (const [key, uuid] of this.cache.entries()) {
      const [collection, identifier] = this.parseCacheKey(key);
      collections.add(collection);
      entries.push({ collection, identifier, uuid });
    }

    return {
      size: this.cache.size,
      collections: Array.from(collections).sort(),
      entries,
    };
  }

  /**
   * Create a cache key from collection and identifier
   *
   * @param collection - Collection slug
   * @param identifier - Unique identifier
   * @returns Cache key in format "collection:identifier"
   */
  private createCacheKey(collection: string, identifier: string): string {
    return `${collection}:${identifier}`;
  }

  /**
   * Parse a cache key back into collection and identifier
   *
   * @param key - Cache key in format "collection:identifier"
   * @returns Tuple of [collection, identifier]
   */
  private parseCacheKey(key: string): [string, string] {
    const firstColonIndex = key.indexOf(':');
    if (firstColonIndex === -1) {
      throw new Error(`Invalid cache key format: ${key}`);
    }
    const collection = key.substring(0, firstColonIndex);
    const identifier = key.substring(firstColonIndex + 1);
    return [collection, identifier];
  }

  /**
   * Recursively resolve a value (string, array, object, or primitive)
   *
   * @param value - Value to resolve
   * @param depth - Current recursion depth
   * @returns Resolved value
   * @throws Error if maximum recursion depth is exceeded
   */
  private resolveValue(value: unknown, depth: number): unknown {
    // Prevent infinite recursion
    if (depth > this.MAX_DEPTH) {
      throw new Error(
        `Maximum recursion depth (${this.MAX_DEPTH}) exceeded. Possible circular reference.`,
      );
    }

    // Handle null and undefined
    if (value === null || value === undefined) {
      return value;
    }

    // Handle strings (may contain references)
    if (typeof value === 'string') {
      return this.resolveString(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, depth + 1));
    }

    // Handle objects
    if (typeof value === 'object') {
      const resolved: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        resolved[key] = this.resolveValue(val, depth + 1);
      }
      return resolved;
    }

    // Handle primitives (numbers, booleans, etc.)
    return value;
  }

  /**
   * Resolve reference patterns in a string
   *
   * Supports:
   * - Full string reference: `"{ref:courses:ddm}"` → UUID
   * - Embedded references: `"Text {ref:users:admin} more text"` → "Text UUID more text"
   * - Multiple references: `"{ref:users:1} and {ref:users:2}"` → "UUID1 and UUID2"
   * - Environment variables: `"{env:SEED_USER_PASSWORD}"` → value from process.env
   *
   * @param str - String to resolve
   * @returns Resolved string or UUID
   * @throws Error if any reference cannot be resolved
   */
  private resolveString(str: string): string {
    // First, resolve environment variables
    let resolved = str.replace(ENV_VAR_PATTERN, (match, varName: string) => {
      const value = process.env[varName];
      if (value === undefined) {
        throw new Error(
          `Unresolved environment variable: ${match}. ` +
            `Ensure environment variable "${varName}" is set.`,
        );
      }
      return value;
    });

    // Check if entire string is a single reference (common case optimization)
    const singleMatch = resolved.match(/^\{ref:([^:]+):([^}]+)\}$/);
    if (singleMatch) {
      const [, collection, identifier] = singleMatch;
      const uuid = this.lookup(collection, identifier);
      if (!uuid) {
        throw new Error(
          `Unresolved reference: {ref:${collection}:${identifier}}. ` +
            `Ensure collection "${collection}" with identifier "${identifier}" has been seeded.`,
        );
      }
      return uuid;
    }

    // Handle multiple or embedded references
    resolved = resolved.replace(
      REFERENCE_PATTERN,
      (match, collection, identifier) => {
        const uuid = this.lookup(collection, identifier);
        if (!uuid) {
          throw new Error(
            `Unresolved reference: ${match}. ` +
              `Ensure collection "${collection}" with identifier "${identifier}" has been seeded.`,
          );
        }
        return uuid;
      },
    );

    return resolved;
  }

  /**
   * Recursively find all unresolved references in a value
   *
   * @param value - Value to check
   * @param unresolvedReferences - Array to collect unresolved references
   */
  private findUnresolvedReferences(
    value: unknown,
    unresolvedReferences: string[],
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'string') {
      // Reset regex lastIndex to ensure we find all matches
      const pattern = new RegExp(REFERENCE_PATTERN.source, 'g');
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(value)) !== null) {
        const [fullMatch, collection, identifier] = match;
        const uuid = this.lookup(collection, identifier);
        if (!uuid) {
          unresolvedReferences.push(fullMatch);
        }
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        this.findUnresolvedReferences(item, unresolvedReferences);
      }
      return;
    }

    if (typeof value === 'object') {
      for (const val of Object.values(value)) {
        this.findUnresolvedReferences(val, unresolvedReferences);
      }
    }
  }
}

/**
 * Create a new reference resolver instance
 *
 * Convenience function for creating a resolver without using `new`.
 *
 * @returns New ReferenceResolver instance
 *
 * @example
 * ```typescript
 * const resolver = createReferenceResolver();
 * ```
 */
export function createReferenceResolver(): ReferenceResolver {
  return new ReferenceResolver();
}
