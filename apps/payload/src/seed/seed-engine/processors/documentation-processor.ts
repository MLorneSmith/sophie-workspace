/**
 * Documentation processor for Payload CMS seeding
 *
 * Handles documentation collection with field mapping for:
 * - published → status conversion
 * - createdAt → publishedAt mapping
 * - breadcrumbs → parent relationship extraction
 *
 * @module seed-engine/processors/documentation-processor
 */

import { BaseProcessor } from './base-processor';
import type { SeedRecord } from '../types';

/**
 * Documentation processor with field transformation
 *
 * Transforms documentation records from legacy format to Payload schema:
 * 1. Maps `published: true` → `status: "published"`
 * 2. Maps `createdAt` → `publishedAt` when status is published
 * 3. Extracts parent from breadcrumbs (if exists)
 * 4. Removes deprecated fields (published, breadcrumbs, category)
 *
 * @example
 * ```typescript
 * const processor = new DocumentationProcessor(
 *   payload,
 *   'documentation',
 *   referenceCache
 * );
 *
 * // Input record:
 * {
 *   "published": true,
 *   "createdAt": "2025-10-17T19:28:38.985Z",
 *   "breadcrumbs": [
 *     { "title": "Parent", "slug": "parent" },
 *     { "title": "Child", "slug": "parent/child" }
 *   ]
 * }
 *
 * // Transformed to:
 * {
 *   "status": "published",
 *   "publishedAt": "2025-10-17T19:28:38.985Z"
 * }
 * ```
 */
export class DocumentationProcessor extends BaseProcessor {
  /**
   * Process a documentation record with field transformation
   *
   * Transforms legacy documentation format to match Payload schema:
   * - `published` boolean → `status` enum ("published" | "draft")
   * - `createdAt` → `publishedAt` (when published)
   * - Removes `breadcrumbs`, `category` (not in schema)
   *
   * @param record - Documentation record to process
   * @returns UUID of created documentation record
   * @throws {Error} If record creation fails
   */
  async processRecord(record: SeedRecord): Promise<string> {
    // Transform the record
    const transformedRecord = await this.transformRecord(record);

    try {
      // Create record via Payload Local API
      const created = await this.payload.create({
        collection: this.collectionName as any,
        data: transformedRecord,
        draft: transformedRecord._status === 'draft',
        overrideAccess: true,
        disableVerificationEmail: true,
      });

      return created.id as string;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create ${this.collectionName} record: ${errorMessage}`,
      );
    }
  }

  /**
   * Transform documentation record from legacy format
   *
   * Field mappings:
   * - `published: true` → `status: "published"` + `_status: "published"`
   * - `published: false` → `status: "draft"` + `_status: "draft"`
   * - `createdAt` → `publishedAt` (only when published)
   * - `breadcrumbs` → extract parent from second-to-last item
   * - Remove: `breadcrumbs`, `category`, `updatedAt`
   *
   * Note: The nested-docs plugin auto-generates breadcrumbs based on parent relationships.
   * We extract the parent from the legacy breadcrumbs array and let the plugin rebuild them.
   *
   * @param record - Original record
   * @returns Transformed record matching Payload schema
   * @private
   */
  private async transformRecord(record: SeedRecord): Promise<any> {
    // Extract fields
    const {
      _ref,
      published,
      createdAt,
      updatedAt,
      breadcrumbs,
      category,
      ...rest
    } = record;

    // Determine status from published field
    const isPublished = published === true;
    const status = isPublished ? 'published' : 'draft';

    // Build transformed record
    const transformed: any = {
      ...rest,
      status, // Set status field
      _status: status, // Set _status for Payload versioning
    };

    // Add publishedAt if document is published and has createdAt
    if (isPublished && createdAt) {
      transformed.publishedAt = createdAt;
    }

    // Extract parent from breadcrumbs (if exists and has more than 1 level)
    if (Array.isArray(breadcrumbs) && breadcrumbs.length > 1) {
      // Get the second-to-last breadcrumb (parent)
      const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
      if (parentBreadcrumb && parentBreadcrumb.slug) {
        // Look up parent by slug in reference cache
        // The parent should already be seeded since we process in order
        const parentRef = await this.findParentBySlug(parentBreadcrumb.slug);
        if (parentRef) {
          transformed.parent = parentRef;
        }
      }
    }

    return transformed;
  }

  /**
   * Find parent documentation record by slug
   *
   * The legacy data has breadcrumb slugs like "affiliates", but the actual
   * parent documents have slugs like "affiliates/affiliates" (doubled pattern).
   * This method tries multiple lookup strategies to find the parent.
   *
   * @param breadcrumbSlug - Parent slug from breadcrumbs (e.g., "affiliates")
   * @returns Parent UUID if found, undefined otherwise
   * @private
   */
  private async findParentBySlug(
    breadcrumbSlug: string,
  ): Promise<string | undefined> {
    // Strategy 1: Try the breadcrumb slug as-is (exact match)
    // This handles cases where the slug might already be complete
    let result = await this.queryDocumentBySlug(breadcrumbSlug);
    if (result) return result;

    // Strategy 2: Try the doubled pattern (e.g., "affiliates" → "affiliates/affiliates")
    // This is the common pattern for parent documents in the legacy data
    const doubledSlug = `${breadcrumbSlug}/${breadcrumbSlug}`;
    result = await this.queryDocumentBySlug(doubledSlug);
    if (result) return result;

    // Strategy 3: Try with underscores (e.g., "data-security-and-privacy/data-security-and-privacy")
    // Some parent slugs might use underscores
    const underscoredSegment = breadcrumbSlug.replace(/-/g, '_');
    const underscoredDoubled = `${breadcrumbSlug}/${underscoredSegment}`;
    result = await this.queryDocumentBySlug(underscoredDoubled);
    if (result) return result;

    return undefined;
  }

  /**
   * Query Payload for a documentation record by slug
   *
   * @param slug - Slug to search for
   * @returns Document ID if found, undefined otherwise
   * @private
   */
  private async queryDocumentBySlug(
    slug: string,
  ): Promise<string | undefined> {
    try {
      const result = await this.payload.find({
        collection: 'documentation',
        where: {
          slug: {
            equals: slug,
          },
        },
        limit: 1,
        depth: 0, // Don't populate relationships
      });

      if (result.docs.length > 0) {
        return result.docs[0].id as string;
      }
    } catch (error) {
      // Parent not found - this is expected during seeding
    }

    return undefined;
  }
}
