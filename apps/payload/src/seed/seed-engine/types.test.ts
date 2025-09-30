/**
 * Unit Tests for Payload Seeding Engine Types
 * Tests type definitions, validation, and type guards
 */

import { describe, expect, it } from 'vitest';
import type {
  BatchProcessorResult,
  CollectionConfig,
  DependencyValidation,
  ProcessorResult,
  ProcessorType,
  ProgressReport,
  ReferenceCache,
  ReferenceValidation,
  SeedingError,
  SeedOptions,
  SeedingSummary,
  SeedRecord,
} from './types';

describe('Payload Seeding Engine Types', () => {
  describe('SeedRecord', () => {
    it('should accept valid seed record with internal fields', () => {
      // Arrange & Act
      const record: SeedRecord = {
        _ref: 'ddm',
        _status: 'active',
        slug: 'data-driven-marketing',
        title: 'Data-Driven Marketing',
        course: '{ref:courses:ddm}',
      };

      // Assert
      expect(record._ref).toBe('ddm');
      expect(record._status).toBe('active');
      expect(record.slug).toBe('data-driven-marketing');
    });

    it('should accept seed record without internal fields', () => {
      // Arrange & Act
      const record: SeedRecord = {
        slug: 'lesson-1',
        title: 'Introduction',
        content: { type: 'lexical', data: {} },
      };

      // Assert
      expect(record._ref).toBeUndefined();
      expect(record._status).toBeUndefined();
      expect(record.slug).toBe('lesson-1');
    });

    it('should accept nested object structures', () => {
      // Arrange & Act
      const record: SeedRecord = {
        _ref: 'lesson-1',
        metadata: {
          author: { id: '{ref:users:admin}' },
          tags: ['marketing', 'analytics'],
        },
        downloads: ['{ref:downloads:template1}', '{ref:downloads:template2}'],
      };

      // Assert
      expect(record.metadata).toBeDefined();
      expect(Array.isArray(record.downloads)).toBe(true);
    });

    it('should accept any valid JSON-serializable values', () => {
      // Arrange & Act
      const record: SeedRecord = {
        _ref: 'test',
        stringField: 'value',
        numberField: 42,
        booleanField: true,
        nullField: null,
        arrayField: [1, 2, 3],
        objectField: { nested: 'value' },
      };

      // Assert
      expect(typeof record.stringField).toBe('string');
      expect(typeof record.numberField).toBe('number');
      expect(typeof record.booleanField).toBe('boolean');
      expect(record.nullField).toBeNull();
    });
  });

  describe('CollectionConfig', () => {
    it('should create valid collection config with all fields', () => {
      // Arrange & Act
      const config: CollectionConfig = {
        name: 'course-lessons',
        dataFile: 'course-lessons.json',
        processor: 'content',
        dependencies: ['courses', 'media', 'downloads'],
      };

      // Assert
      expect(config.name).toBe('course-lessons');
      expect(config.dataFile).toBe('course-lessons.json');
      expect(config.processor).toBe('content');
      expect(config.dependencies).toHaveLength(3);
    });

    it('should accept different processor types', () => {
      // Arrange
      const processors: ProcessorType[] = ['content', 'downloads', 'users', 'media'];

      // Act & Assert
      for (const processor of processors) {
        const config: CollectionConfig = {
          name: 'test',
          dataFile: 'test.json',
          processor,
          dependencies: [],
        };
        expect(config.processor).toBe(processor);
      }
    });

    it('should accept empty dependencies array', () => {
      // Arrange & Act
      const config: CollectionConfig = {
        name: 'users',
        dataFile: 'users.json',
        processor: 'users',
        dependencies: [],
      };

      // Assert
      expect(config.dependencies).toHaveLength(0);
    });
  });

  describe('ReferenceCache', () => {
    it('should store and retrieve reference mappings', () => {
      // Arrange
      const cache: ReferenceCache = new Map([
        ['courses:ddm', '123e4567-e89b-12d3-a456-426614174000'],
        ['downloads:template1', '987fcdeb-51a2-43f7-8d9e-123456789abc'],
      ]);

      // Act & Assert
      expect(cache.get('courses:ddm')).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(cache.get('downloads:template1')).toBe(
        '987fcdeb-51a2-43f7-8d9e-123456789abc',
      );
    });

    it('should support cache operations', () => {
      // Arrange
      const cache: ReferenceCache = new Map();

      // Act
      cache.set('courses:ddm', 'uuid-1');
      cache.set('lessons:intro', 'uuid-2');

      // Assert
      expect(cache.size).toBe(2);
      expect(cache.has('courses:ddm')).toBe(true);
      expect(cache.get('courses:ddm')).toBe('uuid-1');
    });

    it('should handle missing keys', () => {
      // Arrange
      const cache: ReferenceCache = new Map();

      // Act & Assert
      expect(cache.get('nonexistent:key')).toBeUndefined();
      expect(cache.has('nonexistent:key')).toBe(false);
    });
  });

  describe('ProcessorResult', () => {
    it('should create successful result', () => {
      // Arrange & Act
      const result: ProcessorResult = {
        success: true,
        recordId: '123e4567-e89b-12d3-a456-426614174000',
        identifier: 'ddm',
        duration: 245,
      };

      // Assert
      expect(result.success).toBe(true);
      expect(result.recordId).toBeDefined();
      expect(result.identifier).toBe('ddm');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should create failed result with error', () => {
      // Arrange & Act
      const result: ProcessorResult = {
        success: false,
        error: 'Validation failed: missing required field',
        duration: 50,
      };

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.recordId).toBeUndefined();
    });

    it('should handle result without optional fields', () => {
      // Arrange & Act
      const result: ProcessorResult = {
        success: true,
        duration: 100,
      };

      // Assert
      expect(result.recordId).toBeUndefined();
      expect(result.identifier).toBeUndefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('BatchProcessorResult', () => {
    it('should create batch result with multiple records', () => {
      // Arrange & Act
      const batchResult: BatchProcessorResult = {
        collection: 'courses',
        successCount: 1,
        failureCount: 0,
        results: [
          {
            success: true,
            recordId: 'uuid-1',
            identifier: 'ddm',
            duration: 245,
          },
        ],
        totalDuration: 245,
      };

      // Assert
      expect(batchResult.collection).toBe('courses');
      expect(batchResult.successCount).toBe(1);
      expect(batchResult.failureCount).toBe(0);
      expect(batchResult.results).toHaveLength(1);
      expect(batchResult.totalDuration).toBe(245);
    });

    it('should handle mixed success/failure results', () => {
      // Arrange & Act
      const batchResult: BatchProcessorResult = {
        collection: 'course-lessons',
        successCount: 23,
        failureCount: 2,
        results: [
          { success: true, recordId: 'uuid-1', duration: 100 },
          { success: false, error: 'Validation error', duration: 50 },
          { success: true, recordId: 'uuid-2', duration: 120 },
        ],
        totalDuration: 3500,
      };

      // Assert
      expect(batchResult.successCount).toBe(23);
      expect(batchResult.failureCount).toBe(2);
      expect(batchResult.results).toHaveLength(3);
      expect(batchResult.successCount + batchResult.failureCount).toBe(25);
    });

    it('should handle empty results', () => {
      // Arrange & Act
      const batchResult: BatchProcessorResult = {
        collection: 'empty-collection',
        successCount: 0,
        failureCount: 0,
        results: [],
        totalDuration: 0,
      };

      // Assert
      expect(batchResult.results).toHaveLength(0);
      expect(batchResult.totalDuration).toBe(0);
    });
  });

  describe('SeedOptions', () => {
    it('should create valid seed options with all fields', () => {
      // Arrange & Act
      const options: SeedOptions = {
        dryRun: false,
        verbose: true,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      // Assert
      expect(options.dryRun).toBe(false);
      expect(options.verbose).toBe(true);
      expect(options.collections).toHaveLength(2);
      expect(options.maxRetries).toBe(3);
      expect(options.timeout).toBe(120000);
    });

    it('should accept dry-run configuration', () => {
      // Arrange & Act
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      // Assert
      expect(options.dryRun).toBe(true);
      expect(options.collections).toHaveLength(0);
    });

    it('should accept custom retry and timeout values', () => {
      // Arrange & Act
      const options: SeedOptions = {
        dryRun: false,
        verbose: false,
        collections: [],
        maxRetries: 5,
        timeout: 180000,
      };

      // Assert
      expect(options.maxRetries).toBe(5);
      expect(options.timeout).toBe(180000);
    });
  });

  describe('ProgressReport', () => {
    it('should create valid progress report', () => {
      // Arrange & Act
      const progress: ProgressReport = {
        currentCollection: 'course-lessons',
        currentRecord: 15,
        totalRecords: 25,
        completedCollections: 3,
        totalCollections: 10,
        elapsedTime: 12500,
        estimatedTimeRemaining: 25000,
      };

      // Assert
      expect(progress.currentCollection).toBe('course-lessons');
      expect(progress.currentRecord).toBe(15);
      expect(progress.totalRecords).toBe(25);
      expect(progress.completedCollections).toBe(3);
      expect(progress.totalCollections).toBe(10);
    });

    it('should handle null estimated time remaining', () => {
      // Arrange & Act
      const progress: ProgressReport = {
        currentCollection: 'users',
        currentRecord: 1,
        totalRecords: 1,
        completedCollections: 0,
        totalCollections: 1,
        elapsedTime: 100,
        estimatedTimeRemaining: null,
      };

      // Assert
      expect(progress.estimatedTimeRemaining).toBeNull();
    });

    it('should calculate progress percentage correctly', () => {
      // Arrange
      const progress: ProgressReport = {
        currentCollection: 'course-lessons',
        currentRecord: 15,
        totalRecords: 25,
        completedCollections: 3,
        totalCollections: 10,
        elapsedTime: 12500,
        estimatedTimeRemaining: 25000,
      };

      // Act
      const collectionProgress = (progress.currentRecord / progress.totalRecords) * 100;
      const overallProgress = (progress.completedCollections / progress.totalCollections) * 100;

      // Assert
      expect(collectionProgress).toBe(60); // 15/25 = 60%
      expect(overallProgress).toBe(30); // 3/10 = 30%
    });
  });

  describe('SeedingSummary', () => {
    it('should create comprehensive seeding summary', () => {
      // Arrange & Act
      const summary: SeedingSummary = {
        totalRecords: 316,
        successCount: 316,
        failureCount: 0,
        totalDuration: 82450,
        averageSpeed: 3.8,
        collectionResults: [
          {
            collection: 'courses',
            successCount: 1,
            failureCount: 0,
            results: [],
            totalDuration: 245,
          },
        ],
        slowestCollections: [{ collection: 'course-lessons', duration: 6210 }],
      };

      // Assert
      expect(summary.totalRecords).toBe(316);
      expect(summary.successCount).toBe(316);
      expect(summary.failureCount).toBe(0);
      expect(summary.totalDuration).toBe(82450);
      expect(summary.averageSpeed).toBe(3.8);
    });

    it('should calculate average speed correctly', () => {
      // Arrange
      const summary: SeedingSummary = {
        totalRecords: 316,
        successCount: 316,
        failureCount: 0,
        totalDuration: 82450,
        averageSpeed: 3.8,
        collectionResults: [],
        slowestCollections: [],
      };

      // Act
      const calculatedSpeed = summary.totalRecords / (summary.totalDuration / 1000);

      // Assert
      expect(calculatedSpeed).toBeCloseTo(summary.averageSpeed, 1);
    });

    it('should handle partial failures', () => {
      // Arrange & Act
      const summary: SeedingSummary = {
        totalRecords: 100,
        successCount: 95,
        failureCount: 5,
        totalDuration: 10000,
        averageSpeed: 10.0,
        collectionResults: [],
        slowestCollections: [],
      };

      // Assert
      expect(summary.successCount + summary.failureCount).toBe(summary.totalRecords);
      expect(summary.failureCount).toBe(5);
    });
  });

  describe('SeedingError', () => {
    it('should create transient error', () => {
      // Arrange & Act
      const error: SeedingError = {
        type: 'transient',
        message: 'Database connection timeout',
        details: { timeout: 30000, attempt: 1 },
        collection: 'courses',
      };

      // Assert
      expect(error.type).toBe('transient');
      expect(error.message).toBeDefined();
      expect(error.details).toBeDefined();
    });

    it('should create validation error with record', () => {
      // Arrange & Act
      const error: SeedingError = {
        type: 'validation',
        message: 'Missing required field: title',
        record: { _ref: 'lesson-1', slug: 'intro' },
        collection: 'course-lessons',
      };

      // Assert
      expect(error.type).toBe('validation');
      expect(error.record).toBeDefined();
      expect(error.record?._ref).toBe('lesson-1');
    });

    it('should create critical error', () => {
      // Arrange & Act
      const error: SeedingError = {
        type: 'critical',
        message: 'Unresolved reference: {ref:courses:unknown}',
        details: { pattern: '{ref:courses:unknown}', cache: [] },
        collection: 'course-lessons',
      };

      // Assert
      expect(error.type).toBe('critical');
      expect(error.message).toContain('Unresolved reference');
    });

    it('should handle error without optional fields', () => {
      // Arrange & Act
      const error: SeedingError = {
        type: 'validation',
        message: 'Validation failed',
        collection: 'posts',
      };

      // Assert
      expect(error.details).toBeUndefined();
      expect(error.record).toBeUndefined();
    });
  });

  describe('ReferenceValidation', () => {
    it('should create valid reference validation result', () => {
      // Arrange & Act
      const validation: ReferenceValidation = {
        isValid: true,
        invalidReferences: [],
        unresolvedReferences: [],
      };

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.invalidReferences).toHaveLength(0);
      expect(validation.unresolvedReferences).toHaveLength(0);
    });

    it('should report invalid reference patterns', () => {
      // Arrange & Act
      const validation: ReferenceValidation = {
        isValid: false,
        invalidReferences: ['{ref:courses}', '{ref::invalid}'],
        unresolvedReferences: [],
      };

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.invalidReferences).toHaveLength(2);
    });

    it('should report unresolved references', () => {
      // Arrange & Act
      const validation: ReferenceValidation = {
        isValid: false,
        invalidReferences: [],
        unresolvedReferences: ['{ref:courses:unknown}', '{ref:downloads:missing}'],
      };

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.unresolvedReferences).toHaveLength(2);
    });
  });

  describe('DependencyValidation', () => {
    it('should create valid dependency validation', () => {
      // Arrange & Act
      const validation: DependencyValidation = {
        isValid: true,
        missingDependencies: [],
        circularDependencies: [],
      };

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.missingDependencies).toHaveLength(0);
      expect(validation.circularDependencies).toHaveLength(0);
    });

    it('should report missing dependencies', () => {
      // Arrange & Act
      const validation: DependencyValidation = {
        isValid: false,
        missingDependencies: ['unknown-collection', 'another-missing'],
        circularDependencies: [],
      };

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.missingDependencies).toHaveLength(2);
    });

    it('should report circular dependencies', () => {
      // Arrange & Act
      const validation: DependencyValidation = {
        isValid: false,
        missingDependencies: [],
        circularDependencies: ['A -> B -> C -> A', 'X -> Y -> X'],
      };

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.circularDependencies).toHaveLength(2);
    });
  });

  describe('Type Integration', () => {
    it('should work together in realistic scenario', () => {
      // Arrange
      const cache: ReferenceCache = new Map();
      cache.set('courses:ddm', 'course-uuid-1');
      cache.set('downloads:template1', 'download-uuid-1');

      const record: SeedRecord = {
        _ref: 'lesson-1',
        slug: 'introduction',
        title: 'Introduction to Marketing',
        course: '{ref:courses:ddm}',
        downloads: ['{ref:downloads:template1}'],
      };

      const result: ProcessorResult = {
        success: true,
        recordId: 'lesson-uuid-1',
        identifier: record._ref,
        duration: 150,
      };

      // Act
      cache.set('course-lessons:lesson-1', result.recordId!);

      // Assert
      expect(cache.get('courses:ddm')).toBe('course-uuid-1');
      expect(cache.get('course-lessons:lesson-1')).toBe('lesson-uuid-1');
      expect(result.success).toBe(true);
    });

    it('should handle full seeding workflow types', () => {
      // Arrange
      const options: SeedOptions = {
        dryRun: false,
        verbose: true,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const progress: ProgressReport = {
        currentCollection: 'course-lessons',
        currentRecord: 1,
        totalRecords: 25,
        completedCollections: 1,
        totalCollections: 2,
        elapsedTime: 1000,
        estimatedTimeRemaining: 6000,
      };

      const batchResult: BatchProcessorResult = {
        collection: 'courses',
        successCount: 1,
        failureCount: 0,
        results: [{ success: true, recordId: 'uuid-1', duration: 245 }],
        totalDuration: 245,
      };

      // Assert
      expect(options.collections).toContain('courses');
      expect(progress.currentCollection).toBe('course-lessons');
      expect(batchResult.successCount).toBe(1);
    });
  });
});
