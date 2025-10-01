/**
 * Downloads collection processor with file upload support
 *
 * Specialized processor for the 'downloads' collection that:
 * - Reads actual download files from seed assets directory
 * - Uploads files to Cloudflare R2 via Payload's S3 storage adapter
 * - Creates database records with proper file metadata
 * - Handles MIME type detection and validation
 * - Supports PDFs, Office documents, archives, and more
 *
 * @module seed-engine/processors/downloads-processor
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseProcessor } from './base-processor';
import type { ProcessorResult, SeedRecord } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Specialized processor for downloads collection with file upload support
 *
 * The downloads collection requires actual file uploads, not just metadata.
 * This processor:
 * 1. **Reads Files**: Loads binary file data from seed-assets directory
 * 2. **Uploads to R2**: Passes file data to Payload, which uploads to Cloudflare R2
 * 3. **Creates Records**: Database records are created with file metadata
 *
 * **File Upload Flow**:
 * ```
 * seed-assets/downloads/template.pdf
 *         ↓
 * DownloadsProcessor reads file as Buffer
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
 *   "_ref": "template-1",
 *   "filePath": "marketing-template.pdf",
 *   "title": "Marketing Template",
 *   "description": "Professional marketing presentation template",
 *   "category": "template"
 * }
 * ```
 *
 * **Processing logic**:
 * 1. Resolve file path relative to seed-assets/downloads/
 * 2. Read file as Buffer
 * 3. Detect MIME type from filename extension
 * 4. Upload via Payload Local API (automatic R2 upload)
 * 5. Return created record UUID
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
 *     _ref: "template-1",
 *     filePath: "marketing-template.pdf",
 *     title: "Marketing Template",
 *     category: "template"
 *   }
 * ]);
 * ```
 */
export class DownloadsProcessor extends BaseProcessor {
  /**
   * Seed assets base directory path
   * Points to apps/payload/src/seed/seed-assets/downloads/
   */
  private readonly assetsPath: string;

  /**
   * MIME type mappings for common file extensions
   */
  private readonly mimeTypes: Record<string, string> = {
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx':
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.rtf': 'application/rtf',

    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',

    // Images (for download resources)
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',

    // Audio
    '.mp3': 'audio/mpeg',
    '.mp4': 'audio/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',

    // Video
    '.mov': 'video/quicktime',
    '.avi': 'video/avi',
    '.webm': 'video/webm',

    // Code/Data
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
  };

  /**
   * Initialize downloads processor with assets directory path
   */
  constructor(...args: ConstructorParameters<typeof BaseProcessor>) {
    super(...args);

    // Resolve path to seed-assets/downloads/ directory
    // From processors/ go up to seed-engine/, then to seed-assets/downloads/
    this.assetsPath = path.resolve(__dirname, '../../seed-assets/downloads');
  }

  /**
   * Pre-processing validation for downloads collection
   *
   * Validates all records before processing:
   * 1. Check required fields (filePath, title)
   * 2. Verify files exist on disk
   * 3. Validate file extensions against allowed MIME types
   *
   * @param records - All download records to validate
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

      if (!record.title || typeof record.title !== 'string') {
        errors.push(
          `Record ${record._ref || 'unknown'}: Missing required field 'title'`,
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
            `Ensure the file exists in seed-assets/downloads/ directory.`,
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(`Downloads validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Create download record with file upload to R2
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
   * @param record - Download record with file path and metadata
   * @returns UUID of created download record
   * @throws {Error} If file read fails or Payload rejects the upload
   *
   * @example
   * ```typescript
   * const uuid = await processor.processRecord({
   *   _ref: "template-1",
   *   filePath: "marketing-template.pdf",
   *   title: "Marketing Template",
   *   category: "template"
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
        `Failed to upload download file '${filePath}': ${errorMessage}`,
      );
    }
  }

  /**
   * Post-processing summary
   *
   * Logs statistics about download processing:
   * - Total files uploaded
   * - Total storage size
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
        `Downloads processing completed: ${successCount} success, ${failureCount} failed`,
      );
    }
  }

  /**
   * Resolve file path relative to seed-assets/downloads/ directory
   *
   * Supports both relative and absolute paths:
   * - "template.pdf" → /path/to/seed-assets/downloads/template.pdf
   * - "./docs/template.pdf" → /path/to/seed-assets/downloads/docs/template.pdf
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
