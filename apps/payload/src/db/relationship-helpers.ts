/**
 * Simplified relationship helpers for downloads
 *
 * This module provides streamlined functions for working with download relationships
 * following the one-way relationship model from content to downloads.
 */

import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
// Import with proper type definitions
import {
  DOWNLOAD_ID_MAP,
  getDownloadIdByKey,
} from '../../../../packages/content-migrations/src/data/mappings/download-mappings.js'
import { getDownloadIdsForLesson } from '../../../../packages/content-migrations/src/data/mappings/lesson-downloads-mappings.js'

/**
 * Get all downloads associated with a specific collection item
 * Uses direct SQL and predefined mappings
 */
export async function getDownloadsForCollection(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<string[]> {
  // Skip processing entirely for quizzes - they don't need downloads
  if (collectionType === 'course_quizzes') {
    return []
  }

  console.log(`Fetching downloads for ${collectionType} with ID ${collectionId}`)

  try {
    // APPROACH 1: Try direct SQL query against specific relationship tables
    try {
      const results = await getDownloadsViaDirectSQL(payload, collectionId, collectionType)
      if (results.length > 0) {
        console.log(`Found ${results.length} downloads via direct SQL`)
        return results
      }
    } catch (sqlError) {
      console.error(`Error using direct SQL approach:`, sqlError)
      // Continue to next approach
    }

    // APPROACH 2: Try known mappings (predefined relationships)
    try {
      const results = await getDownloadsViaPredefinedMappings(collectionType, collectionId, payload)
      if (results.length > 0) {
        console.log(`Found ${results.length} downloads via predefined mappings`)
        return results
      }
    } catch (mappingError) {
      console.error(`Error using predefined mappings approach:`, mappingError)
    }

    // If no approach worked, return empty array
    console.log(`No downloads found for ${collectionType} with ID ${collectionId}`)
    return []
  } catch (error) {
    // Final catch-all to ensure we never throw errors
    console.error(`Unexpected error in getDownloadsForCollection:`, error)
    return []
  }
}

/**
 * Get downloads using direct SQL
 * This targets the specific relationship tables directly
 */
async function getDownloadsViaDirectSQL(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<string[]> {
  try {
    // Determine the relationship table name
    const relationshipTable = `${collectionType}_downloads`

    // First check if the relationship table exists
    const tableExistsResult = await payload.db.drizzle.execute(
      sql.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'payload' 
        AND table_name = '${relationshipTable.replace(/'/g, "''")}'
      ) as exists
      `),
    )

    // If table doesn't exist, return empty array immediately
    if (!tableExistsResult?.rows?.[0]?.exists) {
      console.log(`Table ${relationshipTable} does not exist, skipping direct SQL approach`)
      return []
    }

    // Map collection types to their actual column names in the relationship table
    const collectionColumnMap: Record<string, string> = {
      course_lessons: 'lesson_id',
      // course_quizzes mapping removed - quizzes don't need downloads
      // Add other collection types as needed
    }

    // Get the correct column name for this collection type
    const collectionIdColumn = collectionColumnMap[collectionType] || `${collectionType}_id`

    // Check if the columns exist in the table
    const columnsExistResult = await payload.db.drizzle.execute(
      sql.raw(`
      SELECT 
        column_name
      FROM information_schema.columns
      WHERE table_schema = 'payload'
      AND table_name = '${relationshipTable.replace(/'/g, "''")}'
      `),
    )

    // Extract column names
    const columnNames = columnsExistResult?.rows?.map((row) => row.column_name as string) || []

    // If the columns we need don't exist, return empty array
    if (!columnNames.includes('download_id') && !columnNames.includes('downloads_id')) {
      console.log(
        `Table ${relationshipTable} is missing required columns, skipping direct SQL approach`,
      )
      return []
    }

    // Determine which column to use for joining
    const downloadIdColumn = columnNames.includes('download_id') ? 'download_id' : 'downloads_id'

    // Use a simpler direct approach without using $1 parameters - ensuring proper SQL syntax
    const query = `
      SELECT d.id 
      FROM payload.downloads d
      JOIN payload."${relationshipTable}" r ON d.id::uuid = r.${downloadIdColumn}::uuid
      WHERE r.${collectionIdColumn} = '${collectionId.replace(/'/g, "''")}'
    `

    console.log(`Executing SQL query: ${query}`)

    const result = await payload.db.drizzle.execute(sql.raw(query))

    if (!result || !result.rows || !Array.isArray(result.rows)) {
      return []
    }

    return result.rows.map((row) => row.id as string)
  } catch (error) {
    console.error(
      `Error in getDownloadsViaDirectSQL for ${collectionType} with ID ${collectionId}:`,
      error,
    )
    throw error // Let the calling function handle fallback
  }
}

/**
 * Get downloads from predefined mappings
 * This uses lesson-specific mappings where possible
 */
async function getDownloadsViaPredefinedMappings(
  collectionType: string,
  collectionId: string,
  payload: Payload,
): Promise<string[]> {
  try {
    // If this is a course lesson, try to get the lesson slug
    if (collectionType === 'course_lessons') {
      try {
        // Get the lesson's slug from the database
        const result = await payload.db.drizzle.execute(
          sql.raw(`
            SELECT slug FROM payload.course_lessons
            WHERE id = '${collectionId.replace(/'/g, "''")}'
          `),
        )

        if (result?.rows?.[0]?.slug) {
          // Ensure we have a valid string slug
          const slugValue = result.rows[0].slug
          const lessonSlug = typeof slugValue === 'string' ? slugValue : String(slugValue || '')
          console.log(`Found lesson slug: ${lessonSlug}`)

          // Get download IDs for this specific lesson using the validated string
          const downloadIds = getDownloadIdsForLesson(lessonSlug)
          if (downloadIds.length > 0) {
            console.log(`Found ${downloadIds.length} downloads for lesson ${lessonSlug}`)
            return downloadIds
          }
        }
      } catch (slugError) {
        console.log('Error getting lesson slug:', slugError)
        // Continue to fallback
      }
    }

    // Don't return default downloads as fallback anymore
    // Only return downloads that are explicitly mapped to this lesson
    console.log(`No explicit download mappings found, returning empty array`)
    return []
  } catch (error) {
    console.error(
      `Error in getDownloadsViaPredefinedMappings for ${collectionType} with ID ${collectionId}:`,
      error,
    )
    return [] // Return empty array instead of throwing
  }
}

/**
 * Check if a collection has a specific download
 * Uses simplified direct approach
 */
export async function collectionHasDownload(
  payload: Payload,
  collectionId: string,
  collectionType: string,
  downloadId: string,
): Promise<boolean> {
  try {
    // Get all downloads and check if the specific one is included
    const downloadIds = await getDownloadsForCollection(payload, collectionId, collectionType)
    return downloadIds.includes(downloadId)
  } catch (error) {
    console.error(`Error in collectionHasDownload:`, error)
    return false // Default to false on error
  }
}

/**
 * Generate a safe download URL for any ID type
 */
function getDownloadUrl(id: any): string {
  // Default value if we can't extract anything useful
  let idStr = 'unknown'

  try {
    if (typeof id === 'string') {
      idStr = id.substring(0, 8)
    } else if (typeof id === 'object' && id !== null) {
      if (id.id && typeof id.id === 'string') {
        idStr = id.id.substring(0, 8)
      } else if (id.value && typeof id.value === 'string') {
        idStr = id.value.substring(0, 8)
      } else {
        idStr = String(id).substring(0, 8)
      }
    } else {
      idStr = String(id || '').substring(0, 8)
    }
  } catch (e) {
    console.error('Error generating download URL:', e)
  }

  return `https://downloads.slideheroes.com/${idStr}.pdf`
}

/**
 * Find all downloads for a collection and return the actual download documents
 * Uses simplified direct approach with database fetching
 */
export async function findDownloadsForCollection(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<any[]> {
  try {
    // Get download IDs using our simplified approach
    const downloadIds = await getDownloadsForCollection(payload, collectionId, collectionType)

    if (!downloadIds.length) {
      return []
    }

    // Try to get the actual download documents from the database
    try {
      const idList = downloadIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')
      const query = `
        SELECT id, filename, filesize, "mimetype", url, title, description
        FROM payload.downloads
        WHERE id IN (${idList})
      `

      console.log(`Fetching actual download documents with query: ${query}`)
      const result = await payload.db.drizzle.execute(sql.raw(query))

      if (result?.rows?.length > 0) {
        console.log(`Found ${result.rows.length} actual download documents`)
        return result.rows
      }

      console.log(`No actual download documents found, returning empty array`)
      return []
    } catch (dbError) {
      console.error('Error fetching actual download documents:', dbError)
      // Return empty array if query fails
      return []
    }
  } catch (error) {
    console.error(`Error in findDownloadsForCollection:`, error)
    return [] // Return empty array instead of throwing
  }
}

/**
 * Enhanced diagnostic function to help identify column name issues
 */
export async function diagnoseRelationshipTables(
  payload: Payload,
  collectionType: string,
): Promise<any> {
  try {
    // Get information about relationship tables
    const relationshipTable = `${collectionType}_downloads`
    const result = await payload.db.drizzle.execute(
      sql.raw(`
        SELECT 
          table_name,
          column_name,
          data_type
        FROM information_schema.columns
        WHERE table_schema = 'payload'
        AND table_name = '${relationshipTable}'
        ORDER BY ordinal_position
      `),
    )

    // Check if expected column names exist
    const columns = result?.rows || []
    const columnNames = columns.map((col: any) => col.column_name)

    // Determine expected column names
    const expectedCollectionIdColumn = `${collectionType}_id`
    const expectedColumns = ['id', 'download_id', 'downloads_id', 'lesson_id']

    // Check which expected columns are missing
    const missingColumns = expectedColumns.filter((col) => !columnNames.includes(col))

    // Log useful diagnostic information
    console.log(`Table ${relationshipTable} columns:`, columnNames.join(', '))
    if (missingColumns.length > 0) {
      console.log(`Missing expected columns: ${missingColumns.join(', ')}`)
    }

    // If the standard collection ID column is missing, suggest alternatives
    if (!columnNames.includes(expectedCollectionIdColumn)) {
      const possibleAlternatives = columnNames.filter((col) => col.endsWith('_id'))
      console.log(
        `Column ${expectedCollectionIdColumn} not found. Possible alternatives: ${possibleAlternatives.join(', ')}`,
      )
    }

    // Return enhanced diagnostic info
    return {
      relationshipTable: {
        name: relationshipTable,
        columns: columns,
        columnNames: columnNames,
        missingExpectedColumns: missingColumns,
        expectedCollectionIdColumn: expectedCollectionIdColumn,
        hasExpectedCollectionIdColumn: columnNames.includes(expectedCollectionIdColumn),
        possibleAlternativeIdColumns: columnNames.filter((col) => col.endsWith('_id')),
      },
    }
  } catch (error: any) {
    console.error(`Error in diagnoseRelationshipTables:`, error)
    return {
      relationshipTable: {
        name: '',
        columns: [],
        error: error.message || 'Unknown error',
      },
    }
  }
}
