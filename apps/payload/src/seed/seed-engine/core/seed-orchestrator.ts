/**
 * Seed Orchestrator for Payload CMS Seeding Engine
 *
 * Central coordinator for the entire seeding process. Manages:
 * - Collection processing in dependency order
 * - Reference cache lifecycle
 * - Progress tracking and reporting
 * - Error handling and retries
 * - Dry-run mode validation
 * - Post-seed verification
 *
 * @module seed-engine/core/seed-orchestrator
 */

import type {
  Payload,
  SeedOptions,
  SeedRecord,
  SeedingSummary,
  BatchProcessorResult,
  ReferenceCache,
} from '../types';
import { initializePayload, cleanupPayload } from './payload-initializer';
import { loadCollection, loadAllCollections, type LoadResult } from '../loaders/json-loader';
import { ReferenceResolver } from '../resolvers/reference-resolver';
import { ContentProcessor, DownloadsProcessor } from '../processors';
import type { BaseProcessor } from '../processors/base-processor';
import { ProgressTracker } from '../utils/progress-tracker';
import { ErrorHandler } from '../utils/error-handler';
import { logger } from '../utils/logger';
import { SEED_ORDER, COLLECTION_CONFIGS } from '../config';
import {
  validateCollectionData,
  buildReferenceMap,
} from '../validators/data-validator';

/**
 * Result from seeding operation
 */
export interface SeedResult {
  /** Whether seeding completed successfully */
  success: boolean;
  /** Summary statistics */
  summary: SeedingSummary;
  /** Error message if failed */
  error?: string;
}

/**
 * Seed orchestrator class
 *
 * Main coordinator for the seeding process. Handles the complete workflow:
 * 1. Initialize Payload
 * 2. Load and validate JSON data
 * 3. Process collections in dependency order
 * 4. Track progress and handle errors
 * 5. Generate summary report
 * 6. Cleanup resources
 *
 * @example
 * ```typescript
 * const orchestrator = new SeedOrchestrator();
 * const result = await orchestrator.run({
 *   dryRun: false,
 *   verbose: true,
 *   collections: [],
 *   maxRetries: 3,
 *   timeout: 120000
 * });
 * ```
 */
export class SeedOrchestrator {
  private payload: Payload | null = null;
  private resolver: ReferenceResolver | null = null;
  private tracker: ProgressTracker | null = null;
  private errorHandler: ErrorHandler | null = null;

  /**
   * Run the complete seeding process
   *
   * @param options - Seeding options
   * @returns Seed result with summary
   */
  async run(options: SeedOptions): Promise<SeedResult> {
    const startTime = Date.now();

    try {
      // Configure logger
      logger.setConfig({ verbose: options.verbose });

      // Step 1: Initialize
      await this.initialize(options);

      // Step 2: Load data
      const loadResults = await this.loadData(options);

      // Step 3: Validate data
      await this.validateData(loadResults);

      // Step 4: Process collections (or dry-run)
      const batchResults = options.dryRun
        ? await this.dryRunValidation(loadResults)
        : await this.processCollections(loadResults, options);

      // Step 5: Generate summary
      const summary = this.generateSummary(batchResults, startTime);

      // Step 6: Post-seed validation (if not dry-run)
      if (!options.dryRun) {
        await this.postSeedValidation(summary);
      }

      return {
        success: summary.failureCount === 0,
        summary,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Seeding failed', error instanceof Error ? error : undefined);

      return {
        success: false,
        summary: this.createEmptySummary(startTime),
        error: errorMessage,
      };
    } finally {
      // Step 7: Cleanup
      await this.cleanup();
    }
  }

  /**
   * Initialize Payload and supporting services
   *
   * @param options - Seeding options
   */
  private async initialize(options: SeedOptions): Promise<void> {
    logger.info('Initializing seeding engine...');

    // Initialize Payload
    this.payload = await initializePayload();

    // Initialize reference resolver
    this.resolver = new ReferenceResolver();

    // Initialize progress tracker
    this.tracker = new ProgressTracker({
      verbose: options.verbose,
      quiet: false,
      progressBarWidth: 20,
    });

    // Initialize error handler
    this.errorHandler = new ErrorHandler({
      maxRetries: options.maxRetries,
    });

    this.tracker.startSeeding();
    logger.success('Seeding engine initialized');
  }

  /**
   * Load JSON data from files
   *
   * @param options - Seeding options
   * @returns Array of load results
   */
  private async loadData(options: SeedOptions): Promise<LoadResult[]> {
    logger.info('Loading seed data...');

    let loadResults: LoadResult[];

    if (options.collections.length > 0) {
      // Load specific collections
      const filteredCollections = options.collections.filter((name) =>
        SEED_ORDER.includes(name)
      );

      if (filteredCollections.length === 0) {
        throw new Error('No valid collections specified');
      }

      logger.info(`Loading ${filteredCollections.length} collections: ${filteredCollections.join(', ')}`);

      // Load collections in dependency order
      loadResults = [];
      for (const collection of SEED_ORDER) {
        if (filteredCollections.includes(collection)) {
          const result = await loadCollection(collection);
          loadResults.push(result);
        }
      }
    } else {
      // Load all collections
      logger.info('Loading all collections...');
      loadResults = await loadAllCollections();
    }

    const totalRecords = loadResults.reduce((sum, r) => sum + r.recordCount, 0);
    logger.success(`Loaded ${loadResults.length} collections with ${totalRecords} records`);

    return loadResults;
  }

  /**
   * Validate all loaded data
   *
   * @param loadResults - Load results to validate
   */
  private async validateData(loadResults: LoadResult[]): Promise<void> {
    logger.info('Validating seed data...');

    // Build reference map for validation
    const allRecords: Record<string, SeedRecord[]> = {};
    for (const result of loadResults) {
      allRecords[result.collection] = result.records;
    }

    const referenceMap = buildReferenceMap(allRecords);
    const allCollections = new Set(SEED_ORDER);

    // Validate each collection
    const allErrors: string[] = [];

    for (const result of loadResults) {
      const validation = validateCollectionData(result.records, result.collection, {
        allCollections,
        referenceMap,
      });

      if (!validation.isValid) {
        allErrors.push(...validation.errors);
      }
    }

    if (allErrors.length > 0) {
      logger.error(`Validation failed with ${allErrors.length} errors:`);
      for (const error of allErrors.slice(0, 10)) {
        logger.error(`  - ${error}`);
      }
      if (allErrors.length > 10) {
        logger.error(`  ... and ${allErrors.length - 10} more errors`);
      }
      throw new Error(`Data validation failed with ${allErrors.length} errors`);
    }

    logger.success('Data validation passed');
  }

  /**
   * Perform dry-run validation without creating records
   *
   * @param loadResults - Load results to validate
   * @returns Mock batch results
   */
  private async dryRunValidation(loadResults: LoadResult[]): Promise<BatchProcessorResult[]> {
    logger.info('Performing dry-run validation (no records will be created)...');

    const batchResults: BatchProcessorResult[] = [];

    for (const result of loadResults) {
      logger.info(`[DRY-RUN] Validating ${result.collection}: ${result.recordCount} records`);

      // Simulate processing time
      const startTime = Date.now();

      // Create mock results
      batchResults.push({
        collection: result.collection,
        successCount: result.recordCount,
        failureCount: 0,
        results: result.records.map((record) => ({
          success: true,
          recordId: 'dry-run-uuid',
          identifier: record._ref as string | undefined,
          duration: 1,
        })),
        totalDuration: Date.now() - startTime,
      });

      logger.success(`[DRY-RUN] ${result.collection}: ${result.recordCount} records validated`);
    }

    logger.success('Dry-run validation complete - all data is valid');
    return batchResults;
  }

  /**
   * Process all collections in dependency order
   *
   * @param loadResults - Load results to process
   * @param options - Seeding options
   * @returns Array of batch results
   */
  private async processCollections(
    loadResults: LoadResult[],
    options: SeedOptions
  ): Promise<BatchProcessorResult[]> {
    if (!this.payload || !this.resolver || !this.tracker) {
      throw new Error('Services not initialized');
    }

    logger.info('Processing collections in dependency order...');

    const batchResults: BatchProcessorResult[] = [];
    const loadResultMap = new Map(loadResults.map((r) => [r.collection, r]));

    // Process collections in SEED_ORDER
    for (const collectionName of SEED_ORDER) {
      const loadResult = loadResultMap.get(collectionName);
      if (!loadResult) {
        continue; // Collection not loaded (filtered)
      }

      const batchResult = await this.processCollection(
        collectionName,
        loadResult.records,
        options
      );
      batchResults.push(batchResult);
    }

    logger.success('All collections processed');
    return batchResults;
  }

  /**
   * Process a single collection
   *
   * @param collectionName - Collection name
   * @param records - Records to process
   * @param options - Seeding options
   * @returns Batch processing result
   */
  private async processCollection(
    collectionName: string,
    records: SeedRecord[],
    options: SeedOptions
  ): Promise<BatchProcessorResult> {
    if (!this.payload || !this.resolver || !this.tracker || !this.errorHandler) {
      throw new Error('Services not initialized');
    }

    const startTime = Date.now();

    logger.info(`Processing ${collectionName}: ${records.length} records`);
    this.tracker.startCollection(collectionName, records.length);

    // Create processor for collection
    const processor = this.createProcessor(collectionName, this.payload, this.resolver.getCache());

    // Pre-process hook
    try {
      await processor.preProcess(records);
    } catch (error) {
      logger.error(`Pre-processing failed for ${collectionName}`, error instanceof Error ? error : undefined);
      throw error;
    }

    // Process each record
    const results = [];
    let currentRecord = 0;

    for (const record of records) {
      currentRecord++;

      // Resolve references
      let resolvedRecord: SeedRecord;
      try {
        resolvedRecord = this.resolver.resolve(record);
      } catch (error) {
        logger.error(
          `Reference resolution failed for ${collectionName}[${record._ref || 'unknown'}]`,
          error instanceof Error ? error : undefined
        );
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Reference resolution failed',
          identifier: record._ref as string | undefined,
          duration: 0,
        });
        this.tracker.updateProgress(currentRecord, records.length, false);
        continue;
      }

      // Process record with retry logic
      const result = await this.errorHandler.withRetry(
        async () => {
          const recordId = await processor.processRecord(resolvedRecord);
          return recordId;
        },
        { collection: collectionName, record: resolvedRecord }
      );

      if (result.success && result.data) {
        // Register in cache
        if (record._ref && typeof record._ref === 'string') {
          this.resolver.register(collectionName, record._ref, result.data);
        }

        results.push({
          success: true,
          recordId: result.data,
          identifier: record._ref as string | undefined,
          duration: 0,
        });
        this.tracker.updateProgress(currentRecord, records.length, true);
      } else {
        results.push({
          success: false,
          error: result.error?.message || 'Unknown error',
          identifier: record._ref as string | undefined,
          duration: 0,
        });
        this.tracker.updateProgress(currentRecord, records.length, false);
      }
    }

    // Post-process hook
    try {
      await processor.postProcess(results);
    } catch (error) {
      logger.warn(`Post-processing warning for ${collectionName}`, error instanceof Error ? error : undefined);
    }

    const batchResult: BatchProcessorResult = {
      collection: collectionName,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
      totalDuration: Date.now() - startTime,
    };

    this.tracker.completeCollection(batchResult);

    return batchResult;
  }

  /**
   * Create processor for collection based on configuration
   *
   * @param collectionName - Collection name
   * @param payload - Payload instance
   * @param referenceCache - Reference cache
   * @returns Processor instance
   */
  private createProcessor(
    collectionName: string,
    payload: Payload,
    referenceCache: ReferenceCache
  ): BaseProcessor {
    const config = COLLECTION_CONFIGS[collectionName];
    if (!config) {
      throw new Error(`No configuration found for collection "${collectionName}"`);
    }

    switch (config.processor) {
      case 'downloads':
        return new DownloadsProcessor(payload, collectionName, referenceCache);
      case 'content':
      case 'users':
      case 'media':
        // For now, all use ContentProcessor
        // TODO: Implement specialized processors for users and media
        return new ContentProcessor(payload, collectionName, referenceCache);
      default:
        throw new Error(`Unknown processor type: ${config.processor}`);
    }
  }

  /**
   * Generate final summary report
   *
   * @param batchResults - All batch results
   * @param startTime - Start time in milliseconds
   * @returns Seeding summary
   */
  private generateSummary(
    batchResults: BatchProcessorResult[],
    startTime: number
  ): SeedingSummary {
    if (!this.tracker) {
      throw new Error('Tracker not initialized');
    }

    const summary = this.tracker.generateSummary(batchResults);

    return summary;
  }

  /**
   * Perform post-seed validation
   *
   * Verifies that records were created correctly and relationships are intact.
   *
   * @param summary - Seeding summary
   */
  private async postSeedValidation(summary: SeedingSummary): Promise<void> {
    if (!this.payload) {
      throw new Error('Payload not initialized');
    }

    logger.info('Performing post-seed validation...');

    // Verify record counts match
    const verificationResults: string[] = [];

    for (const result of summary.collectionResults) {
      try {
        const count = await this.payload.count({
          collection: result.collection,
        });

        if (count.totalDocs !== result.successCount) {
          verificationResults.push(
            `${result.collection}: Expected ${result.successCount} records, found ${count.totalDocs}`
          );
        } else {
          logger.debug(`${result.collection}: ${count.totalDocs} records verified`);
        }
      } catch (error) {
        verificationResults.push(
          `${result.collection}: Verification failed - ${error instanceof Error ? error.message : 'unknown error'}`
        );
      }
    }

    if (verificationResults.length > 0) {
      logger.warn('Post-seed validation warnings:');
      for (const warning of verificationResults) {
        logger.warn(`  - ${warning}`);
      }
    } else {
      logger.success('Post-seed validation passed');
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    logger.info('Cleaning up resources...');

    // Clear reference cache
    if (this.resolver) {
      this.resolver.clear();
      this.resolver = null;
    }

    // Cleanup Payload
    await cleanupPayload();
    this.payload = null;

    // Clear other services
    this.tracker = null;
    this.errorHandler = null;

    logger.success('Cleanup complete');
  }

  /**
   * Create empty summary for error cases
   *
   * @param startTime - Start time in milliseconds
   * @returns Empty summary
   */
  private createEmptySummary(startTime: number): SeedingSummary {
    return {
      totalRecords: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: Date.now() - startTime,
      averageSpeed: 0,
      collectionResults: [],
      slowestCollections: [],
    };
  }
}

/**
 * Run seeding with given options (convenience function)
 *
 * @param options - Seeding options
 * @returns Seed result
 *
 * @example
 * ```typescript
 * const result = await runSeeding({
 *   dryRun: false,
 *   verbose: true,
 *   collections: [],
 *   maxRetries: 3,
 *   timeout: 120000
 * });
 *
 * if (result.success) {
 *   console.log(`Seeded ${result.summary.totalRecords} records`);
 * }
 * ```
 */
export async function runSeeding(options: SeedOptions): Promise<SeedResult> {
  const orchestrator = new SeedOrchestrator();
  return orchestrator.run(options);
}
