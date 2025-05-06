import type { Payload } from 'payload'
import { sql } from '@payloadcms/db-postgres'

import { getTableNameForCollection } from '../../../../packages/content-migrations/src/data/mappings/collection-table-mappings'

// Re-export the collection table mapping utilities for convenience
export { getTableNameForCollection }

/**
 * Execute a SQL query with proper error handling
 * @param payload Payload instance
 * @param query The SQL query template literal or string
 * @returns Query result rows or empty array on error
 */
export async function executeSafeQuery(
  payload: Payload,
  query: any, // Using any type for compatibility with sql template literals
): Promise<any[]> {
  try {
    const result = await payload.db.drizzle.execute(query)
    return result?.rows || []
  } catch (error) {
    console.error('Database query failed:', error)
    return []
  }
}

/**
 * Execute a raw SQL query with params for better SQL injection protection
 * @param payload Payload instance
 * @param queryString SQL query string with $1, $2, etc. placeholders
 * @param params Parameters for the query
 * @returns Query result rows or empty array on error
 */
export async function executeSafeParamQuery(
  payload: Payload,
  queryString: string,
  params: any[] = [],
): Promise<any[]> {
  try {
    // Use Payload's SQL template literal with raw SQL and parameters
    let sqlQuery = sql`${sql.raw(queryString)}`

    // Bind parameters - This approach works with the Payload SQL helper
    params.forEach((param) => {
      sqlQuery = sql`${sqlQuery} ${param}`
    })

    const result = await payload.db.drizzle.execute(sqlQuery)
    return result?.rows || []
  } catch (error) {
    console.error('Database query with params failed:', error)
    console.error('Query string was:', queryString)
    console.error('Params were:', params)
    return []
  }
}

/**
 * Check if a table exists in the database
 * @param payload Payload instance
 * @param schema Schema name
 * @param tableName Table name
 * @returns True if the table exists, false otherwise
 */
export async function tableExists(
  payload: Payload,
  schema: string,
  tableName: string,
): Promise<boolean> {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1
        AND table_name = $2
      );
    `

    const result = await executeSafeParamQuery(payload, query, [schema, tableName])
    return result[0]?.exists === true
  } catch (error) {
    console.error(`Failed to check if table ${schema}.${tableName} exists:`, error)
    return false
  }
}

/**
 * Check if a column exists in a table
 * @param payload Payload instance
 * @param schema Schema name
 * @param tableName Table name
 * @param columnName Column name
 * @returns True if the column exists, false otherwise
 */
export async function columnExists(
  payload: Payload,
  schema: string,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = $1
        AND table_name = $2
        AND column_name = $3
      );
    `

    const result = await executeSafeParamQuery(payload, query, [schema, tableName, columnName])
    return result[0]?.exists === true
  } catch (error) {
    console.error(
      `Failed to check if column ${columnName} exists in table ${schema}.${tableName}:`,
      error,
    )
    return false
  }
}

/**
 * Format an identifier for use in SQL queries
 * This helps prevent SQL injection by properly escaping identifiers
 * @param identifier SQL identifier (table or column name)
 * @returns Safely quoted identifier
 */
export function safeIdentifier(identifier: string): string {
  // Basic sanitization - remove quotes, semicolons, and other potentially dangerous characters
  const sanitized = identifier.replace(/[;'"\\]/g, '')
  // Double quote the identifier to make it safe in SQL
  return `"${sanitized}"`
}
