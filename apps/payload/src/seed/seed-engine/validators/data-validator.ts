/**
 * Data Validator for Payload CMS Seeding Engine
 *
 * Validates seed data structure, reference patterns, and required fields
 * before processing to catch data quality issues early.
 *
 * @module seed-engine/validators/data-validator
 */

import type { ReferenceValidation, SeedRecord } from '../types';
import { CIRCULAR_REFERENCES, REFERENCE_PATTERN } from '../config';

/**
 * Validates reference patterns in seed data
 *
 * Checks that all `{ref:collection:identifier}` patterns are:
 * 1. Syntactically valid (correct format)
 * 2. Reference existing collections
 * 3. Have corresponding records with matching _ref values
 *
 * @param records - Array of seed records to validate
 * @param collectionName - Name of the collection being validated
 * @param allCollections - Set of all valid collection names
 * @param referenceMap - Map of all available references (collection:identifier → true)
 * @returns Validation result with any detected issues
 *
 * @example
 * ```typescript
 * const result = validateReferences(
 *   courseLessons,
 *   'course-lessons',
 *   new Set(['courses', 'media']),
 *   new Map([['courses:ddm', true]])
 * );
 * ```
 */
export function validateReferences(
  records: SeedRecord[],
  collectionName: string,
  allCollections: Set<string>,
  referenceMap: Map<string, boolean>,
): ReferenceValidation {
  const invalidReferences: string[] = [];
  const unresolvedReferences: string[] = [];

  // Pattern to detect malformed {ref:...} patterns (missing parts)
  const malformedPattern = /\{ref:[^}]*\}/g;

  // Get circular reference fields for this collection (if any)
  const circularRefFields = CIRCULAR_REFERENCES[collectionName]?.fields ?? [];

  for (const record of records) {
    const recordStr = JSON.stringify(record);

    // First, check for malformed patterns
    const allRefPatterns = [...recordStr.matchAll(malformedPattern)];
    const validMatches = [...recordStr.matchAll(REFERENCE_PATTERN)];

    // If we have more malformed patterns than valid ones, report invalid patterns
    if (allRefPatterns.length > validMatches.length) {
      for (const malformed of allRefPatterns) {
        const pattern = malformed[0];
        // Check if this pattern is NOT in valid matches
        const isValid = validMatches.some((m) => m[0] === pattern);
        if (!isValid) {
          const error = `${collectionName}[${record._ref || 'unknown'}]: Invalid reference pattern "${pattern}" - must be {ref:collection:identifier}`;
          if (!invalidReferences.includes(error)) {
            invalidReferences.push(error);
          }
        }
      }
    }

    // Now validate the properly formatted references
    for (const match of validMatches) {
      const fullPattern = match[0]; // e.g., "{ref:courses:ddm}"
      const referencedCollection = match[1]; // e.g., "courses"
      const identifier = match[2]; // e.g., "ddm"

      // Skip validation for known circular reference fields
      // Check if this reference pattern exists in any circular reference field
      const isCircularRef = circularRefFields.some((field) => {
        const fieldValue = record[field];
        return fieldValue !== undefined &&
               typeof fieldValue === 'string' &&
               fieldValue.includes(fullPattern);
      });

      if (isCircularRef) {
        continue;
      }

      // Check if reference pattern is syntactically valid
      if (!referencedCollection || !identifier) {
        const error = `${collectionName}[${record._ref || 'unknown'}]: Invalid reference pattern "${fullPattern}"`;
        if (!invalidReferences.includes(error)) {
          invalidReferences.push(error);
        }
        continue;
      }

      // Check if referenced collection exists
      if (!allCollections.has(referencedCollection)) {
        const error = `${collectionName}[${record._ref || 'unknown'}]: References unknown collection "${referencedCollection}" in "${fullPattern}"`;
        if (!invalidReferences.includes(error)) {
          invalidReferences.push(error);
        }
        continue;
      }

      // Check if reference can be resolved (target record exists)
      const refKey = `${referencedCollection}:${identifier}`;
      if (!referenceMap.has(refKey)) {
        const error = `${collectionName}[${record._ref || 'unknown'}]: Unresolved reference "${fullPattern}" - no record with _ref="${identifier}" in ${referencedCollection}`;
        if (!unresolvedReferences.includes(error)) {
          unresolvedReferences.push(error);
        }
      }
    }
  }

  return {
    isValid: invalidReferences.length === 0 && unresolvedReferences.length === 0,
    invalidReferences,
    unresolvedReferences,
  };
}

/**
 * Validates required fields are present in all records
 *
 * Checks that critical fields needed for seeding are present and non-empty.
 *
 * @param records - Array of seed records to validate
 * @param collectionName - Name of the collection being validated
 * @param requiredFields - Array of field names that must be present
 * @returns Array of validation error messages (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateRequiredFields(
 *   courses,
 *   'courses',
 *   ['slug', 'title']
 * );
 * ```
 */
export function validateRequiredFields(
  records: SeedRecord[],
  collectionName: string,
  requiredFields: string[],
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const recordId = record._ref || `record-${i}`;

    for (const field of requiredFields) {
      const value = record[field];

      if (value === undefined || value === null) {
        errors.push(`${collectionName}[${recordId}]: Missing required field "${field}"`);
      } else if (typeof value === 'string' && value.trim() === '') {
        errors.push(`${collectionName}[${recordId}]: Required field "${field}" is empty`);
      }
    }
  }

  return errors;
}

/**
 * Validates field types for critical fields
 *
 * Ensures fields have expected data types to prevent runtime errors.
 *
 * @param records - Array of seed records to validate
 * @param collectionName - Name of the collection being validated
 * @param fieldTypes - Map of field names to expected types
 * @returns Array of validation error messages (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateFieldTypes(
 *   courses,
 *   'courses',
 *   new Map([
 *     ['slug', 'string'],
 *     ['publishedAt', 'string'],
 *     ['downloads', 'array']
 *   ])
 * );
 * ```
 */
export function validateFieldTypes(
  records: SeedRecord[],
  collectionName: string,
  fieldTypes: Map<string, string>,
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const recordId = record._ref || `record-${i}`;

    for (const [field, expectedType] of fieldTypes.entries()) {
      const value = record[field];

      if (value === undefined || value === null) {
        continue; // Field is optional, skip type check
      }

      const actualType = Array.isArray(value) ? 'array' : typeof value;

      if (actualType !== expectedType) {
        errors.push(
          `${collectionName}[${recordId}]: Field "${field}" has type "${actualType}", expected "${expectedType}"`,
        );
      }
    }
  }

  return errors;
}

/**
 * Validates Lexical content structure
 *
 * Ensures Lexical editor content has the required root structure.
 *
 * @param records - Array of seed records to validate
 * @param collectionName - Name of the collection being validated
 * @param contentFields - Array of field names that contain Lexical content
 * @returns Array of validation error messages (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateLexicalContent(
 *   posts,
 *   'posts',
 *   ['content']
 * );
 * ```
 */
export function validateLexicalContent(
  records: SeedRecord[],
  collectionName: string,
  contentFields: string[],
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const recordId = record._ref || `record-${i}`;

    for (const field of contentFields) {
      const content = record[field];

      if (content === undefined || content === null) {
        continue; // Field is optional
      }

      // Check if content is an object with root property
      if (typeof content !== 'object' || content === null) {
        errors.push(
          `${collectionName}[${recordId}]: Field "${field}" should be an object with root property`,
        );
        continue;
      }

      const contentObj = content as Record<string, unknown>;

      if (!contentObj.root || typeof contentObj.root !== 'object') {
        errors.push(
          `${collectionName}[${recordId}]: Lexical field "${field}" missing valid root node`,
        );
        continue;
      }

      const root = contentObj.root as Record<string, unknown>;

      // Validate root node structure
      if (root.type !== 'root') {
        errors.push(
          `${collectionName}[${recordId}]: Lexical field "${field}" root.type should be "root", got "${root.type}"`,
        );
      }

      if (!Array.isArray(root.children)) {
        errors.push(
          `${collectionName}[${recordId}]: Lexical field "${field}" root.children should be an array`,
        );
      }
    }
  }

  return errors;
}

/**
 * Validates that _ref identifiers are unique within a collection
 *
 * Ensures no duplicate identifiers exist, which would break reference resolution.
 *
 * @param records - Array of seed records to validate
 * @param collectionName - Name of the collection being validated
 * @returns Array of validation error messages (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateUniqueRefs(courses, 'courses');
 * ```
 */
export function validateUniqueRefs(records: SeedRecord[], collectionName: string): string[] {
  const errors: string[] = [];
  const seen = new Map<string, number[]>();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const ref = record._ref;

    if (ref === undefined || ref === null) {
      continue; // _ref is optional
    }

    if (typeof ref !== 'string') {
      errors.push(
        `${collectionName}[record-${i}]: _ref should be a string, got ${typeof ref}`,
      );
      continue;
    }

    if (ref.trim() === '') {
      errors.push(`${collectionName}[record-${i}]: _ref cannot be empty`);
      continue;
    }

    if (!seen.has(ref)) {
      seen.set(ref, []);
    }
    seen.get(ref)?.push(i);
  }

  // Check for duplicates
  for (const [ref, indices] of seen.entries()) {
    if (indices.length > 1) {
      errors.push(
        `${collectionName}: Duplicate _ref "${ref}" found at indices: ${indices.join(', ')}`,
      );
    }
  }

  return errors;
}

/**
 * Builds a reference map from all seed data
 *
 * Creates a map of all available references for validation purposes.
 * Used to check if references can be resolved.
 *
 * @param allRecords - Map of collection name to array of records
 * @returns Map of reference keys (collection:identifier) to true
 *
 * @example
 * ```typescript
 * const refMap = buildReferenceMap({
 *   courses: [{ _ref: 'ddm', ... }],
 *   media: [{ _ref: 'hero-image', ... }]
 * });
 * // Returns: Map { 'courses:ddm' => true, 'media:hero-image' => true }
 * ```
 */
export function buildReferenceMap(
  allRecords: Record<string, SeedRecord[]>,
): Map<string, boolean> {
  const refMap = new Map<string, boolean>();

  for (const [collectionName, records] of Object.entries(allRecords)) {
    for (const record of records) {
      if (record._ref) {
        const refKey = `${collectionName}:${record._ref}`;
        refMap.set(refKey, true);
      }
    }
  }

  return refMap;
}

/**
 * Validates all data for a collection
 *
 * Comprehensive validation including:
 * - Unique _ref identifiers
 * - Required fields
 * - Field types
 * - Reference patterns
 * - Lexical content structure
 *
 * @param records - Array of seed records to validate
 * @param collectionName - Name of the collection being validated
 * @param config - Validation configuration
 * @returns Object with isValid flag and array of all errors
 *
 * @example
 * ```typescript
 * const result = validateCollectionData(
 *   courses,
 *   'courses',
 *   {
 *     requiredFields: ['slug', 'title'],
 *     fieldTypes: new Map([['slug', 'string']]),
 *     contentFields: ['content'],
 *     allCollections: new Set(['media', 'downloads']),
 *     referenceMap: refMap
 *   }
 * );
 * ```
 */
export function validateCollectionData(
  records: SeedRecord[],
  collectionName: string,
  config: {
    requiredFields?: string[];
    fieldTypes?: Map<string, string>;
    contentFields?: string[];
    allCollections?: Set<string>;
    referenceMap?: Map<string, boolean>;
  },
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate unique refs
  errors.push(...validateUniqueRefs(records, collectionName));

  // Validate required fields
  if (config.requiredFields) {
    errors.push(...validateRequiredFields(records, collectionName, config.requiredFields));
  }

  // Validate field types
  if (config.fieldTypes) {
    errors.push(...validateFieldTypes(records, collectionName, config.fieldTypes));
  }

  // Validate Lexical content
  if (config.contentFields) {
    errors.push(...validateLexicalContent(records, collectionName, config.contentFields));
  }

  // Validate references
  if (config.allCollections && config.referenceMap) {
    const refValidation = validateReferences(
      records,
      collectionName,
      config.allCollections,
      config.referenceMap,
    );
    errors.push(...refValidation.invalidReferences);
    errors.push(...refValidation.unresolvedReferences);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
