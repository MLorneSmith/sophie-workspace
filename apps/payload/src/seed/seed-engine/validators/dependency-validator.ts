/**
 * Dependency Validator for Payload CMS Seeding Engine
 *
 * Validates collection dependency order and detects circular dependencies
 * before seeding begins to prevent foreign key constraint violations.
 *
 * @module seed-engine/validators/dependency-validator
 */

import type { CollectionConfig, DependencyValidation } from '../types';

/**
 * Validates collection dependency order and detects issues
 *
 * Checks that:
 * 1. All referenced dependencies exist in the collection configurations
 * 2. No circular dependencies exist
 * 3. Seed order respects dependency constraints
 *
 * @param collections - Array of collection configurations to validate
 * @param seedOrder - Ordered array of collection names (seed execution order)
 * @returns Validation result with any detected issues
 *
 * @example
 * ```typescript
 * const result = validateDependencies(COLLECTION_CONFIGS, SEED_ORDER);
 * if (!result.isValid) {
 *   console.error('Missing:', result.missingDependencies);
 *   console.error('Circular:', result.circularDependencies);
 * }
 * ```
 */
export function validateDependencies(
  collections: Record<string, CollectionConfig>,
  seedOrder: readonly string[],
): DependencyValidation {
  const missingDependencies: string[] = [];
  const circularDependencies: string[] = [];

  // Get all collection names from configurations
  const collectionNames = new Set(Object.keys(collections));

  // Check for missing dependencies (referenced but not defined)
  for (const [collectionName, config] of Object.entries(collections)) {
    for (const dependency of config.dependencies) {
      if (!collectionNames.has(dependency)) {
        const error = `${collectionName} depends on missing collection: ${dependency}`;
        if (!missingDependencies.includes(error)) {
          missingDependencies.push(error);
        }
      }
    }
  }

  // Check for circular dependencies using depth-first search
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  /**
   * Detects circular dependencies using DFS
   * @param collectionName - Current collection being checked
   * @param path - Current dependency path (for error reporting)
   * @returns True if circular dependency detected
   */
  function detectCycle(collectionName: string, path: string[]): boolean {
    if (recursionStack.has(collectionName)) {
      // Found a cycle - construct the cycle path
      const cycleStart = path.indexOf(collectionName);
      const cyclePath = [...path.slice(cycleStart), collectionName].join(' -> ');
      if (!circularDependencies.includes(cyclePath)) {
        circularDependencies.push(cyclePath);
      }
      return true;
    }

    if (visited.has(collectionName)) {
      return false; // Already processed this node
    }

    visited.add(collectionName);
    recursionStack.add(collectionName);

    const config = collections[collectionName];
    if (config) {
      for (const dependency of config.dependencies) {
        if (collectionNames.has(dependency)) {
          detectCycle(dependency, [...path, collectionName]);
        }
      }
    }

    recursionStack.delete(collectionName);
    return false;
  }

  // Run cycle detection for each collection
  for (const collectionName of collectionNames) {
    if (!visited.has(collectionName)) {
      detectCycle(collectionName, []);
    }
  }

  // Validate seed order respects dependencies
  // Note: We check order but only report as missing dependencies if the collection
  // is not in the seed order at all (not just in wrong position)
  const orderErrors = validateSeedOrder(collections, seedOrder);
  const notInOrderErrors = orderErrors.filter((err) => err.includes('is not in seed order'));
  if (notInOrderErrors.length > 0) {
    // Only add errors for dependencies not in seed order at all
    missingDependencies.push(...notInOrderErrors);
  }

  return {
    isValid: missingDependencies.length === 0 && circularDependencies.length === 0,
    missingDependencies,
    circularDependencies,
  };
}

/**
 * Validates that seed order respects dependency constraints
 *
 * Ensures that for each collection, all its dependencies appear earlier
 * in the seed order array.
 *
 * @param collections - Collection configurations with dependencies
 * @param seedOrder - Proposed seed execution order
 * @returns Array of order violation messages (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateSeedOrder(configs, ['courses', 'users']);
 * // Returns: ['courses depends on users but users comes after it']
 * ```
 */
export function validateSeedOrder(
  collections: Record<string, CollectionConfig>,
  seedOrder: readonly string[],
): string[] {
  const errors: string[] = [];
  const orderIndex = new Map<string, number>();

  // Build index map for O(1) lookups
  for (let i = 0; i < seedOrder.length; i++) {
    orderIndex.set(seedOrder[i], i);
  }

  // Check each collection's dependencies
  for (const collectionName of seedOrder) {
    const config = collections[collectionName];
    if (!config) {
      continue; // Skip if not in configurations
    }

    const collectionIndex = orderIndex.get(collectionName);
    if (collectionIndex === undefined) {
      continue;
    }

    for (const dependency of config.dependencies) {
      const dependencyIndex = orderIndex.get(dependency);

      if (dependencyIndex === undefined) {
        // Dependency not in seed order at all
        errors.push(
          `${collectionName} depends on ${dependency}, but ${dependency} is not in seed order`,
        );
      } else if (dependencyIndex >= collectionIndex) {
        // Dependency comes after or at same position
        errors.push(
          `${collectionName} depends on ${dependency}, but ${dependency} comes after it in seed order`,
        );
      }
    }
  }

  return errors;
}

/**
 * Checks if a specific collection has unresolved dependencies
 *
 * Useful for checking individual collections during processing.
 *
 * @param collectionName - Name of collection to check
 * @param collections - All collection configurations
 * @param processedCollections - Set of already processed collection names
 * @returns Array of unresolved dependency names (empty if all resolved)
 *
 * @example
 * ```typescript
 * const processed = new Set(['users', 'media']);
 * const unresolved = getUnresolvedDependencies('courses', configs, processed);
 * // Returns: ['downloads'] if downloads hasn't been processed
 * ```
 */
export function getUnresolvedDependencies(
  collectionName: string,
  collections: Record<string, CollectionConfig>,
  processedCollections: Set<string>,
): string[] {
  const config = collections[collectionName];
  if (!config) {
    return [];
  }

  return config.dependencies.filter((dep) => !processedCollections.has(dep));
}

/**
 * Topologically sorts collections based on dependencies
 *
 * Produces a valid processing order where all dependencies are processed
 * before dependent collections. Useful for generating optimal seed orders.
 *
 * @param collections - Collection configurations to sort
 * @returns Topologically sorted collection names, or null if circular dependency exists
 *
 * @example
 * ```typescript
 * const sortedOrder = topologicalSort(COLLECTION_CONFIGS);
 * if (sortedOrder) {
 *   console.log('Valid order:', sortedOrder);
 * } else {
 *   console.error('Circular dependency detected!');
 * }
 * ```
 */
export function topologicalSort(
  collections: Record<string, CollectionConfig>,
): string[] | null {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  /**
   * DFS visit helper for topological sort
   */
  function visit(collectionName: string): boolean {
    if (recursionStack.has(collectionName)) {
      return false; // Circular dependency detected
    }

    if (visited.has(collectionName)) {
      return true; // Already processed
    }

    recursionStack.add(collectionName);
    visited.add(collectionName);

    const config = collections[collectionName];
    if (config) {
      for (const dependency of config.dependencies) {
        if (!visit(dependency)) {
          return false; // Propagate cycle detection
        }
      }
    }

    recursionStack.delete(collectionName);
    sorted.push(collectionName);
    return true;
  }

  // Visit all collections
  for (const collectionName of Object.keys(collections)) {
    if (!visited.has(collectionName)) {
      if (!visit(collectionName)) {
        return null; // Circular dependency found
      }
    }
  }

  return sorted;
}
