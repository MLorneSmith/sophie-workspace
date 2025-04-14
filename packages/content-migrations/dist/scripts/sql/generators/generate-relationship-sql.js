/**
 * Generator for relationship tables SQL
 */
import { generateRelationshipTableSql } from '../utils/relationship-columns.js';
/**
 * Creates SQL to ensure all relationship tables exist with the required columns
 * @returns SQL that creates relationship tables with all required columns
 */
export function generateRelationshipTablesSql() {
    // List of all relationship tables we need to ensure exist
    const relationshipTables = [
        'documentation_rels',
        'posts_rels',
        'surveys_rels',
        'survey_questions_rels',
        'courses_rels',
        'course_lessons_rels',
        'course_quizzes_rels',
        'quiz_questions_rels',
        'downloads_rels',
        'payload_locked_documents_rels',
        'payload_preferences_rels',
    ];
    // Start building the SQL
    let sql = `-- Ensure all relationship tables exist with required columns
-- This file is generated from the relationship table generator

-- Start a transaction
BEGIN;

`;
    // Generate SQL for each relationship table
    for (const table of relationshipTables) {
        sql += `-- Ensure relationship table ${table} exists with all required columns
${generateRelationshipTableSql(table)}
`;
    }
    // End the transaction
    sql += `-- Commit the transaction
COMMIT;
`;
    return sql;
}
/**
 * Helper to create a relationship entry SQL with all required fields
 *
 * @param parentId The ID of the parent record
 * @param field The field name for the relationship
 * @param value The value of the relationship (target ID)
 * @param tableName The relationship table name
 * @returns SQL string for creating a relationship entry
 */
export function generateRelationshipEntrySql(parentId, field, value, tableName, specificIdField) {
    let sql = `INSERT INTO payload.${tableName} (
  id,
  _parent_id,
  field,
  value,
`;
    // Add specific ID field if provided
    if (specificIdField) {
        sql += `  ${specificIdField},
`;
    }
    sql += `  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${parentId}',
  '${field}',
  '${value}',
`;
    // Add value for specific ID field if provided
    if (specificIdField) {
        sql += `  '${value}',
`;
    }
    sql += `  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists
`;
    return sql;
}
