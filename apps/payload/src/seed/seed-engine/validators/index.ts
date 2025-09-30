/**
 * Validators Module Entry Point
 *
 * Exports all validation functions for the Payload CMS Seeding Engine.
 * Provides pre-seed validation to catch data quality issues early.
 *
 * @module seed-engine/validators
 */

// Dependency validation exports
export {
  getUnresolvedDependencies,
  topologicalSort,
  validateDependencies,
  validateSeedOrder,
} from './dependency-validator';

// Data validation exports
export {
  buildReferenceMap,
  validateCollectionData,
  validateFieldTypes,
  validateLexicalContent,
  validateReferences,
  validateRequiredFields,
  validateUniqueRefs,
} from './data-validator';

// Post-seed validation exports
export {
  checkOrphanedRelationships,
  validatePostSeed,
  verifyLexicalContent,
  verifyRecordCounts,
  verifyRelationshipIntegrity,
} from './post-seed-validator';
export type {
  ExpectedCounts,
  PostSeedValidationConfig,
  PostSeedValidationResult,
} from './post-seed-validator';
