import { findDownloadsForCollection } from '../../../db/relationship-helpers'

/**
 * Hook to add downloads to a document after it's read
 * This works around the relationship column issues by using our custom view-based lookup
 */
export const useDownloadsHook = (collectionType: string) => {
  return async ({ req, doc }: { req: any; doc: Record<string, any> }) => {
    // Skip if no document ID or no request payload
    if (!doc?.id || !req?.payload) {
      return doc
    }

    try {
      // Find downloads for this document using our custom helper
      const downloads = await findDownloadsForCollection(req.payload, doc.id, collectionType)

      // Return document with downloads attached
      return {
        ...doc,
        downloads,
      }
    } catch (error) {
      console.error(`Error getting downloads for ${collectionType}:`, error)
      return doc
    }
  }
}
