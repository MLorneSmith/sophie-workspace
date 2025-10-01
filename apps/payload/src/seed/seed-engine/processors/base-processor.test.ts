/**
 * Unit tests for BaseProcessor abstract class
 *
 * Tests the template method pattern and core processing logic.
 *
 * @module seed-engine/processors/base-processor.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseProcessor } from './base-processor';
import type { Payload, ProcessorResult, ReferenceCache, SeedRecord } from '../types';

/**
 * Concrete test implementation of BaseProcessor
 *
 * Allows testing of abstract class behavior with controllable record processing.
 */
class TestProcessor extends BaseProcessor {
  public preProcessCalled = false;
  public postProcessCalled = false;
  public processRecordCallCount = 0;

  async preProcess(records: SeedRecord[]): Promise<void> {
    this.preProcessCalled = true;
  }

  async processRecord(record: SeedRecord): Promise<string> {
    this.processRecordCallCount++;

    // Simulate different outcomes based on record data
    if (record.shouldFail) {
      throw new Error('Simulated processing failure');
    }

    // Return a mock UUID
    return `uuid-${record._ref || 'generated'}`;
  }

  async postProcess(results: ProcessorResult[]): Promise<void> {
    this.postProcessCalled = true;
  }

  // Expose protected methods for testing
  public testCleanRecord(record: SeedRecord) {
    return this.cleanRecord(record);
  }

  public testGetCollectionName() {
    return this.getCollectionName();
  }

  public testGetReferenceCache() {
    return this.getReferenceCache();
  }
}

describe('BaseProcessor', () => {
  let mockPayload: Payload;
  let referenceCache: ReferenceCache;
  let processor: TestProcessor;

  beforeEach(() => {
    // Create mock Payload instance
    mockPayload = {
      create: vi.fn(),
    } as unknown as Payload;

    // Create fresh reference cache
    referenceCache = new Map();

    // Create test processor instance
    processor = new TestProcessor(mockPayload, 'test-collection', referenceCache);
  });

  describe('constructor', () => {
    it('should initialize with provided parameters', () => {
      expect(processor.testGetCollectionName()).toBe('test-collection');
      expect(processor.testGetReferenceCache()).toBe(referenceCache);
    });
  });

  describe('processAll', () => {
    it('should execute processing lifecycle in correct order', async () => {
      const records: SeedRecord[] = [
        { _ref: 'record-1', title: 'Test 1' },
        { _ref: 'record-2', title: 'Test 2' },
      ];

      const results = await processor.processAll(records);

      expect(processor.preProcessCalled).toBe(true);
      expect(processor.processRecordCallCount).toBe(2);
      expect(processor.postProcessCalled).toBe(true);
      expect(results).toHaveLength(2);
    });

    it('should process records sequentially', async () => {
      const records: SeedRecord[] = [
        { _ref: 'record-1' },
        { _ref: 'record-2' },
        { _ref: 'record-3' },
      ];

      const results = await processor.processAll(records);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(true);
    });

    it('should continue processing after individual record failure', async () => {
      const records: SeedRecord[] = [
        { _ref: 'record-1' },
        { _ref: 'record-2', shouldFail: true },
        { _ref: 'record-3' },
      ];

      const results = await processor.processAll(records);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Simulated processing failure');
      expect(results[2].success).toBe(true);
    });

    it('should handle empty record array', async () => {
      const results = await processor.processAll([]);

      expect(results).toHaveLength(0);
      expect(processor.preProcessCalled).toBe(true);
      expect(processor.postProcessCalled).toBe(true);
      expect(processor.processRecordCallCount).toBe(0);
    });
  });

  describe('processSingleRecord (via processAll)', () => {
    it('should register successful record in reference cache', async () => {
      const records: SeedRecord[] = [
        { _ref: 'test-ref', title: 'Test' },
      ];

      await processor.processAll(records);

      expect(referenceCache.has('test-collection:test-ref')).toBe(true);
      expect(referenceCache.get('test-collection:test-ref')).toBe('uuid-test-ref');
    });

    it('should not register record without _ref in cache', async () => {
      const records: SeedRecord[] = [
        { title: 'Test without ref' },
      ];

      await processor.processAll(records);

      expect(referenceCache.size).toBe(0);
    });

    it('should measure processing duration', async () => {
      const records: SeedRecord[] = [
        { _ref: 'record-1' },
      ];

      const results = await processor.processAll(records);

      expect(results[0].duration).toBeGreaterThanOrEqual(0);
      expect(typeof results[0].duration).toBe('number');
    });

    it('should include identifier in result', async () => {
      const records: SeedRecord[] = [
        { _ref: 'test-identifier' },
      ];

      const results = await processor.processAll(records);

      expect(results[0].identifier).toBe('test-identifier');
    });

    it('should handle processing errors gracefully', async () => {
      const records: SeedRecord[] = [
        { _ref: 'failing-record', shouldFail: true },
      ];

      const results = await processor.processAll(records);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Simulated processing failure');
      expect(results[0].recordId).toBeUndefined();
      expect(results[0].identifier).toBe('failing-record');
    });

    it('should handle non-Error exceptions', async () => {
      class FailingProcessor extends BaseProcessor {
        async processRecord(): Promise<string> {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'String error'; // Intentionally throw non-Error
        }
      }

      const failingProcessor = new FailingProcessor(
        mockPayload,
        'test',
        referenceCache,
      );

      const results = await failingProcessor.processAll([{ _ref: 'test' }]);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Unknown error occurred');
    });
  });

  describe('cleanRecord', () => {
    it('should remove _ref field', () => {
      const record: SeedRecord = {
        _ref: 'test-ref',
        title: 'Test',
        slug: 'test-slug',
      };

      const cleaned = processor.testCleanRecord(record);

      expect(cleaned).not.toHaveProperty('_ref');
      expect(cleaned).toHaveProperty('title', 'Test');
      expect(cleaned).toHaveProperty('slug', 'test-slug');
    });

    it('should remove _status field', () => {
      const record: SeedRecord = {
        _ref: 'test-ref',
        _status: 'pending',
        title: 'Test',
      };

      const cleaned = processor.testCleanRecord(record);

      expect(cleaned).not.toHaveProperty('_status');
      expect(cleaned).toHaveProperty('title', 'Test');
    });

    it('should remove both metadata fields', () => {
      const record: SeedRecord = {
        _ref: 'test-ref',
        _status: 'completed',
        title: 'Test',
        order: 1,
      };

      const cleaned = processor.testCleanRecord(record);

      expect(cleaned).not.toHaveProperty('_ref');
      expect(cleaned).not.toHaveProperty('_status');
      expect(cleaned).toHaveProperty('title', 'Test');
      expect(cleaned).toHaveProperty('order', 1);
    });

    it('should preserve all other fields', () => {
      const record: SeedRecord = {
        _ref: 'test-ref',
        title: 'Test',
        slug: 'test-slug',
        order: 1,
        published: true,
        nested: { key: 'value' },
        array: [1, 2, 3],
      };

      const cleaned = processor.testCleanRecord(record);

      expect(cleaned.title).toBe('Test');
      expect(cleaned.slug).toBe('test-slug');
      expect(cleaned.order).toBe(1);
      expect(cleaned.published).toBe(true);
      expect(cleaned.nested).toEqual({ key: 'value' });
      expect(cleaned.array).toEqual([1, 2, 3]);
    });

    it('should handle record without metadata fields', () => {
      const record: SeedRecord = {
        title: 'Test',
        slug: 'test-slug',
      };

      const cleaned = processor.testCleanRecord(record);

      expect(cleaned).toEqual({ title: 'Test', slug: 'test-slug' });
    });
  });

  describe('hook execution order', () => {
    it('should call preProcess before processing records', async () => {
      let preProcessTime = 0;
      let firstRecordTime = 0;

      class OrderTestProcessor extends BaseProcessor {
        async preProcess(): Promise<void> {
          preProcessTime = Date.now();
        }

        async processRecord(): Promise<string> {
          if (firstRecordTime === 0) {
            firstRecordTime = Date.now();
          }
          return 'uuid';
        }
      }

      const orderProcessor = new OrderTestProcessor(
        mockPayload,
        'test',
        referenceCache,
      );

      await orderProcessor.processAll([{ _ref: 'test' }]);

      expect(preProcessTime).toBeLessThanOrEqual(firstRecordTime);
    });

    it('should call postProcess after all records processed', async () => {
      let lastRecordTime = 0;
      let postProcessTime = 0;

      class OrderTestProcessor extends BaseProcessor {
        async processRecord(): Promise<string> {
          lastRecordTime = Date.now();
          return 'uuid';
        }

        async postProcess(): Promise<void> {
          postProcessTime = Date.now();
        }
      }

      const orderProcessor = new OrderTestProcessor(
        mockPayload,
        'test',
        referenceCache,
      );

      await orderProcessor.processAll([{ _ref: 'test' }]);

      expect(lastRecordTime).toBeLessThanOrEqual(postProcessTime);
    });
  });

  describe('protected method access', () => {
    it('should provide access to collection name', () => {
      expect(processor.testGetCollectionName()).toBe('test-collection');
    });

    it('should provide access to reference cache', () => {
      const cache = processor.testGetReferenceCache();
      cache.set('test-key', 'test-value');

      expect(referenceCache.get('test-key')).toBe('test-value');
    });
  });
});
