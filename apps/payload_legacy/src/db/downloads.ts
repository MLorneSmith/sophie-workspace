import type { Payload } from 'payload'
import {
  getDownloadsForCollection as getDownloadsHelper,
  collectionHasDownload as collectionHasDownloadHelper,
  findDownloadsForCollection as findDownloadsHelper,
} from './relationship-helpers'

/**
 * Get all downloads associated with a collection
 *
 * Note: This is a compatibility wrapper around the simplified helper functions
 * that use direct SQL and predefined mappings with the one-way relationship model.
 */
export async function getDownloadsForCollection(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<string[]> {
  try {
    // Use the simplified helper
    return await getDownloadsHelper(payload, collectionId, collectionType)
  } catch (error) {
    console.error('Error getting downloads for collection:', error)
    return []
  }
}

/**
 * Check if a specific download is associated with a collection
 *
 * Note: This is a compatibility wrapper around the simplified helper functions
 * that use direct SQL and predefined mappings with the one-way relationship model.
 */
export async function collectionHasDownload(
  payload: Payload,
  collectionId: string,
  collectionType: string,
  downloadId: string,
): Promise<boolean> {
  try {
    // Use the simplified helper
    return await collectionHasDownloadHelper(payload, collectionId, collectionType, downloadId)
  } catch (error) {
    console.error('Error checking if collection has download:', error)
    return false
  }
}

/**
 * Find all downloads for a collection and return the actual download documents
 *
 * Note: This is a compatibility wrapper around the simplified helper functions
 * that use direct SQL and predefined mappings with the one-way relationship model.
 */
export async function findDownloadsForCollection(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<any[]> {
  // Skip processing entirely for quizzes - they don't need downloads
  if (collectionType === 'course_quizzes') {
    return []
  }

  try {
    // Use the simplified helper
    return await findDownloadsHelper(payload, collectionId, collectionType)
  } catch (error) {
    console.error('Error finding downloads for collection:', error)
    return []
  }
}
