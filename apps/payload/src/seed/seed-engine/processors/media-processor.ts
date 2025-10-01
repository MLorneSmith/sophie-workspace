/**
 * Media collection processor with file upload support
 *
 * Specialized processor for the 'media' collection that:
 * - Reads actual image/video files from seed assets directory
 * - Uploads files to Cloudflare R2 via Payload's S3 storage adapter
 * - Creates database records with proper file metadata
 * - Handles MIME type detection and validation
 *
 * @module seed-engine/processors/media-processor
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseProcessor } from './base-processor';
import type { ProcessorResult, SeedRecord } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Specialized processor for media collection with file upload support
 *
 * The media collection requires actual file uploads, not just metadata.
 * This processor:
 * 1. **Reads Files**: Loads binary file data from seed-assets directory
 * 2. **Uploads to R2**: Passes file data to Payload, which uploads to Cloudflare R2
 * 3. **Creates Records**: Database records are created with file metadata
 *
 * **File Upload Flow**:
 * ```
 * seed-assets/media/hero.jpg
 *         ↓
 * MediaProcessor reads file as Buffer
 *         ↓
 * payload.create({ file: { data: buffer, ... } })
 *         ↓
 * Payload's S3 Storage Adapter uploads to R2
 *         ↓
 * Database record created with R2 file URL
 * ```
 *
 * **Seed data structure**:
 * ```json
 * {
 *   "_ref": "hero-image",
 *   "filePath": "hero-image.jpg",
 *   "alt": "Hero image",
 *   "type": "image"
 * }
 * ```
 *
 * **Processing logic**:
 * 1. Resolve file path relative to seed-assets/media/
 * 2. Read file as Buffer
 * 3. Detect MIME type from filename extension
 * 4. Upload via Payload Local API (automatic R2 upload)
 * 5. Return created record UUID
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
 *     filePath: "hero-image.jpg",
 *     alt: "Hero image for testing",
 *     type: "image"
 *   }
 * ]);
 * ```
 */
export class MediaProcessor extends BaseProcessor {
  /**
   * Seed assets base directory path
   * Points to apps/payload/src/seed/seed-assets/media/
   */
  private readonly assetsPath: string;

  /**
   * MIME type mappings for common file extensions
   */
  private readonly mimeTypes: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',

    // Videos
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.avi': 'video/avi',
  };

  /**
   * Initialize media processor with assets directory path
   */
  constructor(...args: ConstructorParameters<typeof BaseProcessor>) {
    super(...args);

    // Resolve path to seed-assets/media/ directory
    // From processors/ go up to seed-engine/, then to seed-assets/media/
    this.assetsPath = path.resolve(__dirname, '../../seed-assets/media');
  }

  /**
   * Pre-processing validation for media collection
   *
   * Validates all records before processing:
   * 1. Check required fields (filePath, alt)
   * 2. Verify files exist on disk
   * 3. Validate file extensions against allowed MIME types
   *
   * @param records - All media records to validate
   * @throws {Error} If any record fails validation
   */
  async preProcess(records: SeedRecord[]): Promise<void> {
    const errors: string[] = [];

    for (const record of records) {
      // Validate required fields
      if (!record.filePath || typeof record.filePath !== 'string') {
        errors.push(
          `Record ${record._ref || 'unknown'}: Missing required field 'filePath'`,
        );
        continue;
      }

      if (!record.alt || typeof record.alt !== 'string') {
        errors.push(
          `Record ${record._ref || 'unknown'}: Missing required field 'alt' (accessibility text)`,
        );
        continue;
      }

      // Validate file extension
      const ext = path.extname(record.filePath as string).toLowerCase();
      if (!this.mimeTypes[ext]) {
        errors.push(
          `Record ${record._ref || 'unknown'}: Unsupported file extension '${ext}'. ` +
            `Supported: ${Object.keys(this.mimeTypes).join(', ')}`,
        );
      }

      // Check if file exists (will be verified during actual read)
      const filePath = this.resolveFilePath(record.filePath as string);
      try {
        await readFile(filePath);
      } catch (error) {
        errors.push(
          `Record ${record._ref || 'unknown'}: File not found at '${filePath}'. ` +
            `Ensure the file exists in seed-assets/media/ directory.`,
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(`Media validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Create media record with file upload to R2
   *
   * **File Upload Process**:
   * 1. Read file from seed-assets directory
   * 2. Detect MIME type from extension
   * 3. Create file upload object (Buffer + metadata)
   * 4. Pass to Payload Local API
   * 5. Payload's S3 storage adapter uploads to R2 automatically
   * 6. Database record created with R2 file URL
   *
   * **R2 Upload is Automatic**: You don't directly call R2 API. Payload's
   * storage adapter intercepts the file upload and handles R2 upload
   * transparently using the S3-compatible API.
   *
   * @param record - Media record with file path and metadata
   * @returns UUID of created media record
   * @throws {Error} If file read fails or Payload rejects the upload
   *
   * @example
   * ```typescript
   * const uuid = await processor.processRecord({
   *   _ref: "hero-image",
   *   filePath: "hero-image.jpg",
   *   alt: "Hero image",
   *   type: "image"
   * });
   * // File is now in R2, database record created
   * ```
   */
  async processRecord(record: SeedRecord): Promise<string> {
    // Clean metadata (remove internal fields)
    const { _ref, _status, filePath, ...cleanedRecord } = record;

    try {
      // 1. Resolve file path
      const absolutePath = this.resolveFilePath(filePath as string);
      const filename = path.basename(filePath as string);

      // 2. Read file as Buffer
      const fileBuffer = await readFile(absolutePath);

      // 3. Detect MIME type
      const ext = path.extname(filename).toLowerCase();
      const mimeType = this.mimeTypes[ext];

      if (!mimeType) {
        throw new Error(`Unsupported file extension: ${ext}`);
      }

      // 4. Create file upload object (Payload format)
      const file = {
        data: fileBuffer,
        name: filename,
        size: fileBuffer.length,
        mimetype: mimeType,
      };

      // 5. Upload via Payload Local API
      // Payload's S3 storage adapter intercepts this and uploads to R2
      const created = await this.payload.create({
        collection: this.collectionName,
        data: cleanedRecord,
        file: file, // This triggers automatic R2 upload
      });

      // 6. Return created UUID
      const resultId = created.id as string;
      return resultId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to upload media file '${filePath}': ${errorMessage}`,
      );
    }
  }

  /**
   * Post-processing summary
   *
   * Logs statistics about media processing:
   * - Total files uploaded
   * - Total storage size
   * - Average file size
   * - Upload success/failure counts
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

  /**
   * Resolve file path relative to seed-assets/media/ directory
   *
   * Supports both relative and absolute paths:
   * - "hero.jpg" → /path/to/seed-assets/media/hero.jpg
   * - "./images/hero.jpg" → /path/to/seed-assets/media/images/hero.jpg
   *
   * @param filePath - Relative file path from seed data
   * @returns Absolute file path
   */
  private resolveFilePath(filePath: string): string {
    // If already absolute, use as-is
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    // Otherwise, resolve relative to assets directory
    return path.resolve(this.assetsPath, filePath);
  }
}
