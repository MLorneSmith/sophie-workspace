/**
 * Base processor abstract class for Payload CMS seeding
 *
 * Implements the Template Method pattern for record processing.
 * Subclasses implement collection-specific logic via hooks.
 *
 * @module seed-engine/processors/base-processor
 */

import type {
  Payload,
  ProcessorResult,
  ReferenceCache,
  SeedRecord,
} from '../types';

/**
 * Abstract base processor for collection seeding
 *
 * Provides the template method pattern with three extension points:
 * 1. `preProcess()` - Validate and prepare records before processing
 * 2. `processRecord()` - Create a single record via Payload API
 * 3. `postProcess()` - Cleanup and finalization after all records
 *
 * **Responsibilities**:
 * - Manage processing lifecycle (pre/process/post)
 * - Remove internal metadata fields (_ref, _status)
 * - Track timing and results
 * - Provide consistent error handling
 *
 * **Usage**:
 * ```typescript
 * class CourseProcessor extends BaseProcessor {
 *   async processRecord(record: SeedRecord): Promise<string> {
 *     // Collection-specific logic
 *     const created = await this.payload.create({
 *       collection: 'courses',
 *       data: this.cleanRecord(record)
 *     });
 *     return created.id;
 *   }
 * }
 * ```
 */
export abstract class BaseProcessor {
  protected payload: Payload;
  protected collectionName: string;
  protected referenceCache: ReferenceCache;

  /**
   * Initialize processor with Payload instance and configuration
   *
   * @param payload - Initialized Payload Local API instance
   * @param collectionName - Collection slug (e.g., 'courses')
   * @param referenceCache - Shared reference cache for relationship resolution
   */
  constructor(
    payload: Payload,
    collectionName: string,
    referenceCache: ReferenceCache,
  ) {
    this.payload = payload;
    this.collectionName = collectionName;
    this.referenceCache = referenceCache;
  }

  /**
   * Pre-processing hook - validate and prepare records
   *
   * Called once before processing any records in the collection.
   * Override to implement collection-specific validation or preparation.
   *
   * **Default behavior**: No-op (returns immediately)
   *
   * **Override examples**:
   * - Validate all records have required fields
   * - Pre-load related data for efficiency
   * - Check for duplicate identifiers
   *
   * @param records - All records to be processed
   * @throws {Error} If validation fails (stops processing)
   */
  async preProcess(records: SeedRecord[]): Promise<void> {
    // Default: no pre-processing needed
    // Subclasses can override for collection-specific logic
  }

  /**
   * Process a single record - MUST be implemented by subclass
   *
   * Creates the record via Payload Local API and returns the created UUID.
   * This is the core method that subclasses must implement.
   *
   * **Implementation requirements**:
   * 1. Clean the record using `cleanRecord()`
   * 2. Call Payload API to create record
   * 3. Return the created record's UUID
   * 4. Throw descriptive errors on failure
   *
   * @param record - Single record to create
   * @returns UUID of created record
   * @throws {Error} If record creation fails
   *
   * @example
   * ```typescript
   * async processRecord(record: SeedRecord): Promise<string> {
   *   const cleaned = this.cleanRecord(record);
   *   const created = await this.payload.create({
   *     collection: this.collectionName,
   *     data: cleaned
   *   });
   *   return created.id;
   * }
   * ```
   */
  abstract processRecord(record: SeedRecord): Promise<string>;

  /**
   * Post-processing hook - cleanup and finalization
   *
   * Called once after all records in the collection have been processed.
   * Override to implement collection-specific cleanup or verification.
   *
   * **Default behavior**: No-op (returns immediately)
   *
   * **Override examples**:
   * - Verify relationship integrity
   * - Log summary statistics
   * - Cleanup temporary resources
   *
   * @param results - Results from all processed records
   * @throws {Error} If post-processing fails (non-fatal)
   */
  async postProcess(results: ProcessorResult[]): Promise<void> {
    // Default: no post-processing needed
    // Subclasses can override for collection-specific logic
  }

  /**
   * Process all records in collection (template method)
   *
   * Orchestrates the complete processing lifecycle:
   * 1. Pre-processing
   * 2. Record-by-record processing
   * 3. Post-processing
   *
   * **This method should NOT be overridden.** Override the hooks instead.
   *
   * @param records - All records to process
   * @returns Processing results for all records
   */
  async processAll(records: SeedRecord[]): Promise<ProcessorResult[]> {
    const results: ProcessorResult[] = [];

    // Pre-processing hook
    await this.preProcess(records);

    // Process each record
    for (const record of records) {
      const result = await this.processSingleRecord(record);
      results.push(result);
    }

    // Post-processing hook
    await this.postProcess(results);

    return results;
  }

  /**
   * Process a single record with timing and error handling
   *
   * Wraps the abstract `processRecord()` with:
   * - Timing measurement
   * - Error handling
   * - Result structure creation
   * - Cache registration
   *
   * @param record - Record to process
   * @returns Processing result with timing info
   * @private
   */
  private async processSingleRecord(
    record: SeedRecord,
  ): Promise<ProcessorResult> {
    const startTime = Date.now();

    try {
      // Call abstract method implemented by subclass
      const recordId = await this.processRecord(record);

      // Register in cache if record has _ref identifier
      if (record._ref && typeof record._ref === 'string') {
        const cacheKey = `${this.collectionName}:${record._ref}`;
        this.referenceCache.set(cacheKey, recordId);
      }

      return {
        success: true,
        recordId,
        identifier: record._ref as string | undefined,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        identifier: record._ref as string | undefined,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Remove internal metadata fields from record
   *
   * Strips fields that are used for seeding logic but should not be
   * persisted to the database:
   * - `_ref` - Internal reference identifier
   * - `_status` - Internal status flag
   *
   * @param record - Original record with metadata
   * @returns Cleaned record ready for Payload API
   * @protected
   *
   * @example
   * ```typescript
   * const original = { _ref: "ddm", slug: "data-driven-marketing", ... };
   * const cleaned = this.cleanRecord(original);
   * // cleaned = { slug: "data-driven-marketing", ... }
   * ```
   */
  protected cleanRecord(record: SeedRecord): Omit<SeedRecord, '_ref' | '_status'> {
    const { _ref, _status, ...cleanedRecord } = record;
    return cleanedRecord;
  }

  /**
   * Get collection name being processed
   *
   * @returns Collection slug
   * @protected
   */
  protected getCollectionName(): string {
    return this.collectionName;
  }

  /**
   * Get reference cache instance
   *
   * Allows subclasses to access the shared reference cache for
   * custom relationship resolution logic.
   *
   * @returns Reference cache
   * @protected
   */
  protected getReferenceCache(): ReferenceCache {
    return this.referenceCache;
  }
}
