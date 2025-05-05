/**
 * Default configurations for known important relationships
 */
export const COMMON_RELATIONSHIP_CONFIGS = [
    {
        sourceCollection: 'course_quizzes',
        relationshipPath: 'questions',
        targetCollection: 'quiz_questions',
        relationType: 'hasMany',
        maintainOrder: true,
    },
    {
        sourceCollection: 'course_lessons',
        relationshipPath: 'quiz',
        targetCollection: 'course_quizzes',
        relationType: 'hasOne',
    },
    {
        sourceCollection: 'surveys',
        relationshipPath: 'questions',
        targetCollection: 'survey_questions',
        relationType: 'hasMany',
        maintainOrder: true,
    },
    {
        sourceCollection: 'posts',
        relationshipPath: 'images',
        targetCollection: 'media',
        relationType: 'hasMany',
        maintainOrder: true,
    },
    {
        sourceCollection: 'private',
        relationshipPath: 'images',
        targetCollection: 'media',
        relationType: 'hasMany',
        maintainOrder: true,
    },
    {
        sourceCollection: 'courses',
        relationshipPath: 'downloads',
        targetCollection: 'downloads',
        relationType: 'hasMany',
        maintainOrder: true,
    },
    {
        sourceCollection: 'course_lessons',
        relationshipPath: 'downloads',
        targetCollection: 'downloads',
        relationType: 'hasMany',
        maintainOrder: true,
    },
];
/**
 * Relationship table naming patterns to search for
 */
export const RELATIONSHIP_TABLE_PATTERNS = ['%_rels', '%.%_rels'];
/**
 * UUID-format table pattern for regex matching
 */
export const UUID_TABLE_PATTERN = '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
/**
 * Required columns for UUID relationship tables
 */
export const REQUIRED_UUID_TABLE_COLUMNS = ['id', 'parent_id', 'path', 'order'];
/**
 * Maximum number of items to process in a batch
 */
export const BATCH_LIMIT = 100;
/**
 * Default timeout for database operations in milliseconds
 */
export const DB_OPERATION_TIMEOUT = 30000;
/**
 * Paths to be excluded from relationship processing
 */
export const EXCLUDED_RELATIONSHIP_PATHS = [
    'createdBy',
    'updatedBy',
    '_status',
];
/**
 * Mapping file path relative to project root
 */
export const RELATIONSHIP_MAP_FILE_PATH = 'src/data/mappings/relationship-map.json';
