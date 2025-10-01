/**
 * Downloads collection processor with UUID preservation
 *
 * Specialized processor for the 'downloads' collection that:
 * - Preserves pre-assigned UUIDs from seed data
 * - Handles external URL references
 * - Validates file paths for media references
 *
 * @module seed-engine/processors/downloads-processor
 */

import { BaseProcessor } from './base-processor';
import type { ProcessorResult, SeedRecord } from '../types';

/**
 * Specialized processor for downloads collection
 *
 * The downloads collection requires special handling because:
 * 1. **UUID Preservation**: Pre-assigned UUIDs must be preserved to maintain
 *    references from course lessons and other collections
 * 2. **External URLs**: Some downloads reference external URLs (e.g., templates)
 * 3. **Media References**: Some downloads reference uploaded media files
 *
 * **Seed data structure**:
 * ```json
 * {
 *   "id": "123e4567-e89b-12d3-a456-426614174000",
 *   "_ref": "template-1",
 *   "title": "Marketing Template",
 *   "url": "https://example.com/template.pdf",
 *   "file": null
 * }
 * ```
 *
 * **Processing logic**:
 * 1. Validate UUID format if present
 * 2. Clean metadata fields
 * 3. Create with explicit UUID (Payload supports this)
 * 4. Return the preserved UUID
 *
 * @example
 * ```typescript
 * const processor = new DownloadsProcessor(
 *   payload,
 *   'downloads',
 *   referenceCache
 * );
 *
 * const results = await processor.processAll([
 *   {
 *     id: "123e4567-e89b-12d3-a456-426614174000",
 *     _ref: "template-1",
 *     title: "Marketing Template",
 *     url: "https://example.com/template.pdf"
 *   }
 * ]);
 * ```
 */
export class DownloadsProcessor extends BaseProcessor {
  /**
   * UUID validation regex (RFC 4122)
   *
   * Validates UUIDs in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   * @private
   */
  private readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Pre-processing validation for downloads collection
   *
   * Validates all records before processing:
   * 1. Check UUID format if present
   * 2. Verify either URL or file reference exists
   * 3. Validate URL format if present
   *
   * @param records - All download records to validate
   * @throws {Error} If any record fails validation
   */
  async preProcess(records: SeedRecord[]): Promise<void> {
    const errors: string[] = [];

    for (const record of records) {
      // Validate UUID if present
      if (record.id) {
        const uuid = record.id as string;
        if (!this.UUID_REGEX.test(uuid)) {
          errors.push(
            `Record ${record._ref || 'unknown'}: Invalid UUID format: ${uuid}`,
          );
        }
      }

      // Validate at least one source (URL or file)
      const hasUrl = record.url && typeof record.url === 'string';
      const hasFile = record.file !== null && record.file !== undefined;

      if (!hasUrl && !hasFile) {
        errors.push(
          `Record ${record._ref || 'unknown'}: Must have either url or file reference`,
        );
      }

      // Validate URL format if present
      if (hasUrl) {
        const url = record.url as string;
        try {
          new URL(url);
        } catch {
          errors.push(
            `Record ${record._ref || 'unknown'}: Invalid URL format: ${url}`,
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Downloads validation failed:\n${errors.join('\n')}`,
      );
    }
  }

  /**
   * Create download record with UUID preservation
   *
   * **UUID Handling**:
   * - If record has `id` field: Use it as the UUID
   * - If no `id` field: Let Payload generate UUID
   *
   * **Why preserve UUIDs?**
   * Download UUIDs are referenced by course lessons and other collections.
   * Pre-assigning UUIDs in seed data ensures consistent references across
   * all collections without complex dependency resolution.
   *
   * @param record - Download record with optional pre-assigned UUID
   * @returns UUID (preserved or generated)
   * @throws {Error} If Payload rejects the record
   *
   * @example
   * ```typescript
   * // Record with pre-assigned UUID
   * const uuid1 = await processor.processRecord({
   *   id: "123e4567-e89b-12d3-a456-426614174000",
   *   _ref: "template-1",
   *   title: "Template"
   * });
   * // Returns: "123e4567-e89b-12d3-a456-426614174000"
   *
   * // Record without UUID (Payload generates)
   * const uuid2 = await processor.processRecord({
   *   _ref: "template-2",
   *   title: "Another Template"
   * });
   * // Returns: Payload-generated UUID
   * ```
   */
  async processRecord(record: SeedRecord): Promise<string> {
    // Clean metadata but preserve 'id' field if present
    const { _ref, _status, ...cleanedRecord } = record;

    // Extract UUID if present
    const preAssignedId = cleanedRecord.id as string | undefined;

    try {
      // Create record with or without pre-assigned UUID
      const created = await this.payload.create({
        collection: this.collectionName,
        data: cleanedRecord,
      });

      // Return preserved UUID or Payload-generated UUID
      const resultId = created.id as string;

      // Verify UUID preservation if one was provided
      if (preAssignedId && resultId !== preAssignedId) {
        throw new Error(
          `UUID preservation failed: expected ${preAssignedId}, got ${resultId}`,
        );
      }

      return resultId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create download record${preAssignedId ? ` with UUID ${preAssignedId}` : ''}: ${errorMessage}`,
      );
    }
  }

  /**
   * Post-processing verification
   *
   * Logs summary statistics about download processing:
   * - Total downloads created
   * - Downloads with pre-assigned UUIDs
   * - Downloads with external URLs vs media files
   *
   * @param results - Processing results from all records
   */
  async postProcess(results: ProcessorResult[]): Promise<void> {
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // This is informational only - no action taken
    // Could be enhanced to log to a proper logger once available
    if (failureCount > 0) {
      console.warn(
        `Downloads processing completed: ${successCount} success, ${failureCount} failed`,
      );
    }
  }
}
