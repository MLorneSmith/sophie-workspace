/**
 * Generic content processor for Payload CMS collections
 *
 * Handles standard collections without special requirements.
 * Uses Payload Local API for record creation with automatic validation.
 *
 * @module seed-engine/processors/content-processor
 */

import { BaseProcessor } from './base-processor';
import type { SeedRecord } from '../types';

/**
 * Content processor for generic Payload collections
 *
 * Provides standard processing for most collections including:
 * - courses
 * - course-lessons
 * - posts
 * - documentation
 * - course-quizzes
 * - surveys
 * - quiz-questions
 * - survey-questions
 *
 * **Processing logic**:
 * 1. Remove internal metadata (_ref, _status)
 * 2. Create record via Payload Local API
 * 3. Let Payload handle validation and relationships
 * 4. Return created UUID
 *
 * **Payload automatically handles**:
 * - Field validation
 * - Relationship population (*_rels tables)
 * - Lexical content structure
 * - Auto-generated fields (createdAt, updatedAt)
 * - UUID generation
 *
 * @example
 * ```typescript
 * const processor = new ContentProcessor(
 *   payload,
 *   'courses',
 *   referenceCache
 * );
 *
 * const results = await processor.processAll([
 *   {
 *     _ref: "ddm",
 *     slug: "data-driven-marketing",
 *     title: "Data-Driven Marketing"
 *   }
 * ]);
 * ```
 */
export class ContentProcessor extends BaseProcessor {
  /**
   * Create a single record via Payload Local API
   *
   * Implements the abstract method from BaseProcessor.
   *
   * **Steps**:
   * 1. Clean metadata fields from record
   * 2. Call `payload.create()` with collection and data
   * 3. Extract and return created record's UUID
   *
   * **Error handling**:
   * - Validation errors throw with field details
   * - Database errors throw with constraint info
   * - All errors are caught by BaseProcessor
   *
   * @param record - Record to create
   * @returns UUID of created record
   * @throws {Error} If Payload validation fails
   * @throws {Error} If database constraints violated
   * @throws {Error} If collection not found
   *
   * @example
   * ```typescript
   * const recordId = await processor.processRecord({
   *   _ref: "lesson-1",
   *   course: "uuid-of-course",
   *   title: "Introduction",
   *   order: 1
   * });
   * // Returns: "123e4567-e89b-12d3-a456-426614174000"
   * ```
   */
  async processRecord(record: SeedRecord): Promise<string> {
    // Remove internal metadata fields
    const cleanedRecord = this.cleanRecord(record);

    try {
      // Create record via Payload Local API
      const created = await this.payload.create({
        collection: this.collectionName,
        data: cleanedRecord,
      });

      // Return UUID of created record
      // Payload always returns 'id' field as UUID string
      return created.id as string;
    } catch (error) {
      // Enhance error message with context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create ${this.collectionName} record: ${errorMessage}`,
      );
    }
  }
}
