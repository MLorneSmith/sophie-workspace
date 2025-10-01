/**
 * Integration tests for seeding idempotency
 *
 * Tests that running the seeding process multiple times produces
 * consistent, predictable results without duplication or data corruption.
 *
 * Key scenarios:
 * - Running seed twice with same data
 * - Running seed with different collections
 * - Cache behavior across runs
 * - Dry-run consistency
 *
 * @module seed-engine/__tests__/integration/idempotency
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeedOrchestrator } from '../../core/seed-orchestrator';
import { resetPayloadInstance } from '../../core/payload-initializer';
import type { SeedOptions } from '../../types';

describe('Integration: Seeding Idempotency', () => {
  let orchestrator: SeedOrchestrator;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetPayloadInstance();

    process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test';
    process.env.PAYLOAD_SECRET = 'test-secret-key-for-testing';
    process.env.NODE_ENV = 'test';

    orchestrator = new SeedOrchestrator();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetPayloadInstance();
  });

  describe('Dry-Run Consistency', () => {
    it('should produce identical results when run twice', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      // First run
      const result1 = await orchestrator.run(options);
      expect(result1.success).toBe(true);

      // Second run with new orchestrator instance
      resetPayloadInstance();
      const orchestrator2 = new SeedOrchestrator();
      const result2 = await orchestrator2.run(options);
      expect(result2.success).toBe(true);

      // Results should be identical
      expect(result1.summary.totalRecords).toBe(result2.summary.totalRecords);
      expect(result1.summary.successCount).toBe(result2.summary.successCount);
      expect(result1.summary.failureCount).toBe(result2.summary.failureCount);

      // Collection-level results should match
      expect(result1.summary.collectionResults.length).toBe(
        result2.summary.collectionResults.length
      );

      for (let i = 0; i < result1.summary.collectionResults.length; i++) {
        const col1 = result1.summary.collectionResults[i];
        const col2 = result2.summary.collectionResults[i];

        expect(col1.collection).toBe(col2.collection);
        expect(col1.successCount).toBe(col2.successCount);
        expect(col1.failureCount).toBe(col2.failureCount);
      }
    });

    it('should handle multiple runs with all collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      // Run three times
      const results = [];
      for (let i = 0; i < 3; i++) {
        resetPayloadInstance();
        const orch = new SeedOrchestrator();
        const result = await orch.run(options);
        expect(result.success).toBe(true);
        results.push(result);
      }

      // All runs should produce identical counts
      const firstTotalRecords = results[0].summary.totalRecords;
      for (const result of results) {
        expect(result.summary.totalRecords).toBe(firstTotalRecords);
        expect(result.summary.successCount).toBe(firstTotalRecords);
        expect(result.summary.failureCount).toBe(0);
      }
    });

    it('should handle alternating collection sets consistently', async () => {
      const options1: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const options2: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      // Run alternating sets
      const result1a = await orchestrator.run(options1);
      expect(result1a.success).toBe(false); // May fail due to missing deps

      resetPayloadInstance();
      const orch2 = new SeedOrchestrator();
      const result2a = await orch2.run(options2);
      expect(result2a.success).toBe(false); // Will fail due to missing courses

      // Run again with first set
      resetPayloadInstance();
      const orch3 = new SeedOrchestrator();
      const result1b = await orch3.run(options1);
      expect(result1b.success).toBe(false);

      // Results should be consistent across runs
      expect(result1a.summary.totalRecords).toBe(result1b.summary.totalRecords);
    });
  });

  describe('Reference Resolution Consistency', () => {
    it('should resolve references identically across runs', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons', 'course-quizzes'],
        maxRetries: 3,
        timeout: 120000,
      };

      // First run
      const result1 = await orchestrator.run(options);
      expect(result1.success).toBe(true);

      // Second run
      resetPayloadInstance();
      const orchestrator2 = new SeedOrchestrator();
      const result2 = await orchestrator2.run(options);
      expect(result2.success).toBe(true);

      // Reference resolution should produce same success patterns
      for (let i = 0; i < result1.summary.collectionResults.length; i++) {
        const col1 = result1.summary.collectionResults[i];
        const col2 = result2.summary.collectionResults[i];

        expect(col1.collection).toBe(col2.collection);
        expect(col1.successCount).toBe(col2.successCount);
        expect(col1.failureCount).toBe(col2.failureCount);
      }
    });

    it('should handle complex dependency chains consistently', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-quizzes', 'quiz-questions'],
        maxRetries: 3,
        timeout: 120000,
      };

      const runs = [];
      for (let i = 0; i < 2; i++) {
        resetPayloadInstance();
        const orch = new SeedOrchestrator();
        const result = await orch.run(options);
        expect(result.success).toBe(true);
        runs.push(result);
      }

      // Verify consistent processing across all collections
      for (let i = 0; i < runs[0].summary.collectionResults.length; i++) {
        expect(runs[0].summary.collectionResults[i].successCount).toBe(
          runs[1].summary.collectionResults[i].successCount
        );
      }
    });
  });

  describe('Error Handling Consistency', () => {
    it('should consistently fail with invalid data', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['invalid-types'],
        maxRetries: 3,
        timeout: 120000,
      };

      // Run multiple times with invalid data
      const results = [];
      for (let i = 0; i < 2; i++) {
        resetPayloadInstance();
        const orch = new SeedOrchestrator();
        const result = await orch.run(options);
        results.push(result);
      }

      // All runs should fail consistently
      for (const result of results) {
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('should consistently fail with missing dependencies', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['quiz-questions'], // Missing quizzes dependency
        maxRetries: 3,
        timeout: 120000,
      };

      const results = [];
      for (let i = 0; i < 2; i++) {
        resetPayloadInstance();
        const orch = new SeedOrchestrator();
        const result = await orch.run(options);
        results.push(result);
      }

      // All runs should fail with same error
      for (const result of results) {
        expect(result.success).toBe(false);
        expect(result.error).toContain('validation failed');
      }
    });
  });

  describe('Performance Consistency', () => {
    it('should have stable performance across runs', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const durations = [];

      for (let i = 0; i < 3; i++) {
        resetPayloadInstance();
        const orch = new SeedOrchestrator();
        const result = await orch.run(options);
        expect(result.success).toBe(true);
        durations.push(result.summary.totalDuration);
      }

      // All runs should complete in similar time (within 2x of fastest)
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);

      expect(maxDuration).toBeLessThan(minDuration * 2);
    });

    it('should maintain consistent processing speed', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const speeds = [];

      for (let i = 0; i < 2; i++) {
        resetPayloadInstance();
        const orch = new SeedOrchestrator();
        const result = await orch.run(options);
        expect(result.success).toBe(true);
        speeds.push(result.summary.averageSpeed);
      }

      // Processing speeds should be similar (within 50%)
      const minSpeed = Math.min(...speeds);
      const maxSpeed = Math.max(...speeds);

      expect(maxSpeed).toBeLessThan(minSpeed * 1.5);
    });
  });

  describe('Cleanup Consistency', () => {
    it('should properly cleanup between runs', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      // First run
      const result1 = await orchestrator.run(options);
      expect(result1.success).toBe(true);

      // Immediate second run (should not be affected by first run)
      resetPayloadInstance();
      const orchestrator2 = new SeedOrchestrator();
      const result2 = await orchestrator2.run(options);
      expect(result2.success).toBe(true);

      // Results should be identical (no state leakage)
      expect(result1.summary.successCount).toBe(result2.summary.successCount);
    });

    it('should handle rapid successive runs', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      // Run 5 times in quick succession
      const results = [];
      for (let i = 0; i < 5; i++) {
        resetPayloadInstance();
        const orch = new SeedOrchestrator();
        const result = await orch.run(options);
        results.push(result);
      }

      // All runs should succeed with identical results
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.summary.successCount).toBe(results[0].summary.successCount);
      }
    });
  });

  describe('Collection Filtering Stability', () => {
    it('should produce consistent results with different filter orders', async () => {
      const collections1: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const collections2: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons', 'courses'], // Reversed order
        maxRetries: 3,
        timeout: 120000,
      };

      // Run with different filter orders
      const result1 = await orchestrator.run(collections1);
      expect(result1.success).toBe(true);

      resetPayloadInstance();
      const orchestrator2 = new SeedOrchestrator();
      const result2 = await orchestrator2.run(collections2);
      expect(result2.success).toBe(true);

      // Results should be identical (seeding respects dependency order)
      expect(result1.summary.totalRecords).toBe(result2.summary.totalRecords);
      expect(result1.summary.successCount).toBe(result2.summary.successCount);

      // Collections should be processed in same order
      const order1 = result1.summary.collectionResults.map((r) => r.collection);
      const order2 = result2.summary.collectionResults.map((r) => r.collection);
      expect(order1).toEqual(order2);
    });

    it('should handle empty filter consistently', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      // Run twice with empty filter
      const result1 = await orchestrator.run(options);
      expect(result1.success).toBe(true);

      resetPayloadInstance();
      const orchestrator2 = new SeedOrchestrator();
      const result2 = await orchestrator2.run(options);
      expect(result2.success).toBe(true);

      // Should process all collections identically
      expect(result1.summary.collectionResults.length).toBe(
        result2.summary.collectionResults.length
      );
      expect(result1.summary.totalRecords).toBe(result2.summary.totalRecords);
    });
  });
});
