/**
 * Type definitions for relationship management system
 */

/**
 * Describes a relationship between collections
 */
export interface RelationshipInfo {
  sourceCollection: string;
  sourceField: string;
  targetCollection: string;
  relationType: 'hasOne' | 'hasMany';
  relationshipPath: string;
  isRequired: boolean;
  foreignKeyField?: string;
  relationshipTable?: string;
}

/**
 * Comprehensive map of all relationships in the system
 */
export interface RelationshipMap {
  collections: Record<
    string,
    {
      name: string;
      relationships: RelationshipInfo[];
    }
  >;
  relationshipTables: string[];
  uuidTables: string[];
}

/**
 * Configuration for relationship fixes
 */
export interface RelationshipFixConfig {
  sourceCollection: string;
  relationshipPath: string;
  targetCollection: string;
  relationType: 'hasOne' | 'hasMany';
  skipIfMissing?: boolean;
  maintainOrder?: boolean;
  columnNameOverride?: string;
}

/**
 * Results from fixing quiz-question relationships
 */
export interface QuizQuestionFixResult {
  processedQuizzes: number;
  fixedQuestions: number;
  reorderedQuestions: number;
  addedToQuizzes: number;
  addedToRelTables: number;
  cleanedOrphans: number;
  errors: Array<{ quiz: string; error: string }>;
}

/**
 * Results from fixing multi-collection relationships
 */
export interface MultiCollectionFixResult {
  processedCollections: number;
  processedRelationships: number;
  fixedDirectReferences: number;
  fixedRelTables: number;
  deletedOrphans: number;
  errors: Array<{ collection: string; relation: string; error: string }>;
}

/**
 * Results from relationship verification
 */
export interface VerificationResult {
  totalRelationships: number;
  checkedRelationships: number;
  inconsistentRelationships: {
    collection: string;
    field: string;
    targetCollection: string;
    issueType: 'missing_in_direct' | 'missing_in_rel_table' | 'ordering_issue';
    count: number;
  }[];
  summary: {
    passedCount: number;
    failedCount: number;
    passRate: number;
  };
}

/**
 * Options for repair orchestration
 */
export interface RepairOptions {
  skipVerification?: boolean;
  skipQuizFix?: boolean;
  skipMultiFix?: boolean;
  skipFallbackSystem?: boolean;
  logToFile?: boolean;
}
