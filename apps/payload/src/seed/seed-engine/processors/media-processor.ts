/**
 * Media collection processor with URL-based seeding
 *
 * Specialized processor for the 'media' collection that:
 * - Creates database records with pre-uploaded R2 file URLs
 * - Uses files already uploaded to Cloudflare R2
 * - No local file reading or upload during seeding
 * - Validates URL and metadata presence
 *
 * @module seed-engine/processors/media-processor
 */

import { BaseProcessor } from './base-processor';
import type { ProcessorResult, SeedRecord } from '../types';

/**
 * Specialized processor for media collection with URL-based seeding
 *
 * The media collection uses pre-uploaded files from Cloudflare R2.
 * This processor:
 * 1. **Validates URLs**: Ensures each record has a valid R2 URL
 * 2. **Creates Records**: Database records are created with R2 URLs
 * 3. **No File Upload**: Files are already in R2, no upload during seeding
 *
 * **URL-Based Flow**:
 * ```
 * Files pre-uploaded to R2
 *         ↓
 * Seed data contains R2 URLs
 *         ↓
 * payload.create({ data: { url, filename, ... } })
 *         ↓
 * Database record created with R2 URL
 * ```
 *
 * **Seed data structure**:
 * ```json
 * {
 *   "_ref": "hero-image",
 *   "filename": "hero-image.jpg",
 *   "url": "https://media.{account_id}.r2.cloudflarestorage.com/hero-image.jpg",
 *   "alt": "Hero image",
 *   "type": "image"
 * }
 * ```
 *
 * **Processing logic**:
 * 1. Validate URL and filename presence
 * 2. Create record with URL and metadata
 * 3. Return created record UUID
 *
 * @example
 * ```typescript
 * const processor = new MediaProcessor(
 *   payload,
 *   'media',
 *   referenceCache
 * );
 *
 * const results = await processor.processAll([
 *   {
 *     _ref: "hero-image",
 *     filename: "hero-image.jpg",
 *     url: "https://media.account.r2.cloudflarestorage.com/hero-image.jpg",
 *     alt: "Hero image for testing",
 *     type: "image"
 *   }
 * ]);
 * ```
 */
export class MediaProcessor extends BaseProcessor {

  /**
   * Pre-processing validation for media collection
   *
   * Validates all records before processing:
   * 1. Check required fields (url, filename, alt)
   * 2. Verify URL format is valid
   *
   * @param records - All media records to validate
   * @throws {Error} If any record fails validation
   */
  async preProcess(records: SeedRecord[]): Promise<void> {
    const errors: string[] = [];

    for (const record of records) {
      // Validate required fields
      if (!record.url || typeof record.url !== 'string') {
        errors.push(
          `Record ${record._ref || 'unknown'}: Missing required field 'url'`,
        );
        continue;
      }

      if (!record.filename || typeof record.filename !== 'string') {
        errors.push(
          `Record ${record._ref || 'unknown'}: Missing required field 'filename'`,
        );
        continue;
      }

      if (!record.alt || typeof record.alt !== 'string') {
        errors.push(
          `Record ${record._ref || 'unknown'}: Missing required field 'alt' (accessibility text)`,
        );
        continue;
      }

      // Validate URL format
      try {
        new URL(record.url as string);
      } catch {
        errors.push(
          `Record ${record._ref || 'unknown'}: Invalid URL format '${record.url}'`,
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(`Media validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Create media record with pre-uploaded R2 URL
   *
   * **URL-Based Process**:
   * 1. Validate URL and metadata from seed data
   * 2. Create database record with R2 URL
   * 3. No file upload (files already in R2)
   *
   * @param record - Media record with R2 URL and metadata
   * @returns UUID of created media record
   * @throws {Error} If record creation fails
   *
   * @example
   * ```typescript
   * const uuid = await processor.processRecord({
   *   _ref: "hero-image",
   *   filename: "hero-image.jpg",
   *   url: "https://media.account.r2.cloudflarestorage.com/hero-image.jpg",
   *   alt: "Hero image",
   *   type: "image"
   * });
   * // Database record created with R2 URL
   * ```
   */
  async processRecord(record: SeedRecord): Promise<string> {
    // Clean metadata (remove internal fields)
    const { _ref, _status, ...cleanedRecord } = record;

    // Infer mimeType if missing
    if (!cleanedRecord.mimeType && cleanedRecord.filename) {
      cleanedRecord.mimeType = this.inferMimeType(cleanedRecord.filename as string);
    }

    // Set placeholder filesize if missing (will be updated when file is accessed)
    if (!cleanedRecord.filesize) {
      cleanedRecord.filesize = 0;
    }

    try {
      // Create record with pre-existing R2 file metadata
      // Use draft:true to bypass Payload's upload field validation
      // The s3Storage plugin expects filename/url/mimeType/filesize to come from file uploads,
      // but during seeding we're providing these values directly from pre-existing R2 files
      const created = await this.payload.create({
        collection: this.collectionName as any,
        data: {
          ...cleanedRecord,
          _status: 'published', // Set as published immediately
        },
        draft: true, // Bypass validation for upload-related fields
        overrideAccess: true, // Skip access control during seeding
      });

      // Return created UUID
      const resultId = created.id as string;
      return resultId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create media record for '${record.filename}': ${errorMessage}`,
      );
    }
  }

  /**
   * Infer MIME type from filename extension
   *
   * @param filename - File name with extension
   * @returns MIME type string
   */
  private inferMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'webm': 'video/webm',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Post-processing summary
   *
   * Logs statistics about media processing:
   * - Total records created
   * - Success/failure counts
   *
   * @param results - Processing results from all records
   */
  async postProcess(results: ProcessorResult[]): Promise<void> {
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // This is informational only
    if (failureCount > 0) {
      console.warn(
        `Media processing completed: ${successCount} success, ${failureCount} failed`,
      );
    }
  }
}
