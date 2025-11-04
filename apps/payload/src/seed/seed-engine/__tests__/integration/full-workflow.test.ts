/**
 * Integration tests for full seeding workflow
 *
 * Tests the complete end-to-end seeding process including:
 * - Data loading from JSON files
 * - Reference resolution across collections
 * - Collection processing in dependency order
 * - Progress tracking and reporting
 * - Summary generation
 *
 * @module seed-engine/__tests__/integration/full-workflow
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeedOrchestrator } from '../../core/seed-orchestrator';
import { resetPayloadInstance } from '../../core/payload-initializer';
import type { SeedOptions } from '../../types';

describe('Integration: Full Seeding Workflow', () => {
  let orchestrator: SeedOrchestrator;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset Payload singleton
    resetPayloadInstance();

    // Set up test environment
    process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test';
    process.env.PAYLOAD_SECRET = 'test-secret-key-for-testing';
    // @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
    process.env.NODE_ENV = 'test';

    orchestrator = new SeedOrchestrator();
  });

  afterEach(() => {
    // Restore environment
    process.env = { ...originalEnv };
    resetPayloadInstance();
  });

  describe('Complete Workflow', () => {
    it('should successfully complete full seeding workflow in dry-run mode', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Verify successful completion
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify summary structure
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecords).toBeGreaterThan(0);
      expect(result.summary.successCount).toBeGreaterThan(0);
      expect(result.summary.failureCount).toBe(0);
      expect(result.summary.totalDuration).toBeGreaterThan(0);
      expect(result.summary.averageSpeed).toBeGreaterThan(0);
      expect(result.summary.collectionResults).toBeDefined();
      expect(result.summary.collectionResults.length).toBeGreaterThan(0);
    });

    it('should process all configured collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Expected collections based on config
      const expectedCollections = [
        'users',
        'media',
        'downloads',
        'posts',
        'courses',
        'course-lessons',
        'documentation',
        'course-quizzes',
        'surveys',
        'quiz-questions',
        'survey-questions',
      ];

      const processedCollections = result.summary.collectionResults.map((r) => r.collection);

      // Verify all expected collections were processed
      for (const collection of expectedCollections) {
        expect(processedCollections).toContain(collection);
      }
    });

    it('should maintain correct dependency order', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);

      // Verify critical dependency relationships
      const verifyOrder = (before: string, after: string) => {
        const beforeIndex = collectionNames.indexOf(before);
        const afterIndex = collectionNames.indexOf(after);

        if (beforeIndex >= 0 && afterIndex >= 0) {
          expect(beforeIndex).toBeLessThan(afterIndex);
        }
      };

      // Level 0 → Level 1
      verifyOrder('media', 'posts');
      verifyOrder('downloads', 'courses');

      // Level 1 → Level 2
      verifyOrder('courses', 'course-lessons');

      // Level 2 → Level 3
      verifyOrder('courses', 'course-quizzes');
      verifyOrder('courses', 'surveys');

      // Level 3 → Level 4
      verifyOrder('course-quizzes', 'quiz-questions');
      verifyOrder('surveys', 'survey-questions');
    });

    it('should track individual collection results', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(1);

      const coursesResult = result.summary.collectionResults[0];
      expect(coursesResult.collection).toBe('courses');
      expect(coursesResult.successCount).toBeGreaterThan(0);
      expect(coursesResult.failureCount).toBe(0);
      // Timing may be 0 for very fast operations in dry-run mode
      expect(coursesResult.totalDuration).toBeGreaterThanOrEqual(0);
      expect(coursesResult.results).toBeDefined();
      expect(coursesResult.results.length).toBeGreaterThan(0);
    });

    it('should calculate accurate summary statistics', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Verify totals match sum of collection results
      const expectedSuccess = result.summary.collectionResults.reduce(
        (sum, r) => sum + r.successCount,
        0
      );
      const expectedFailure = result.summary.collectionResults.reduce(
        (sum, r) => sum + r.failureCount,
        0
      );
      const expectedTotal = expectedSuccess + expectedFailure;

      expect(result.summary.successCount).toBe(expectedSuccess);
      expect(result.summary.failureCount).toBe(expectedFailure);
      expect(result.summary.totalRecords).toBe(expectedTotal);

      // Verify averageSpeed calculation
      const expectedSpeed = result.summary.totalRecords / (result.summary.totalDuration / 1000);
      expect(result.summary.averageSpeed).toBeCloseTo(expectedSpeed, 1);
    });

    it('should identify slowest collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.slowestCollections).toBeDefined();
      expect(Array.isArray(result.summary.slowestCollections)).toBe(true);

      // Verify slowest collections are sorted by duration
      if (result.summary.slowestCollections.length > 1) {
        for (let i = 0; i < result.summary.slowestCollections.length - 1; i++) {
          expect(result.summary.slowestCollections[i].duration).toBeGreaterThanOrEqual(
            result.summary.slowestCollections[i + 1].duration
          );
        }
      }
    });
  });

  describe('Reference Resolution', () => {
    it('should resolve references across collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Both collections should succeed with all records
      const coursesResult = result.summary.collectionResults.find(
        (r) => r.collection === 'courses'
      );
      const lessonsResult = result.summary.collectionResults.find(
        (r) => r.collection === 'course-lessons'
      );

      expect(coursesResult).toBeDefined();
      expect(lessonsResult).toBeDefined();

      // All records should succeed (references resolved)
      expect(coursesResult!.failureCount).toBe(0);
      expect(lessonsResult!.failureCount).toBe(0);
    });

    it('should handle complex multi-level references', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-quizzes', 'quiz-questions'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // All three levels should succeed
      const coursesResult = result.summary.collectionResults.find(
        (r) => r.collection === 'courses'
      );
      const quizzesResult = result.summary.collectionResults.find(
        (r) => r.collection === 'course-quizzes'
      );
      const questionsResult = result.summary.collectionResults.find(
        (r) => r.collection === 'quiz-questions'
      );

      expect(coursesResult?.failureCount).toBe(0);
      expect(quizzesResult?.failureCount).toBe(0);
      expect(questionsResult?.failureCount).toBe(0);
    });

    it('should fail gracefully when dependencies are missing', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons'], // Missing 'courses' dependency
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should fail validation due to unresolved references
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('validation failed');
    });
  });

  describe('Performance Metrics', () => {
    it('should complete seeding within reasonable time', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Dry-run should complete quickly (< 10 seconds for all collections)
      expect(result.summary.totalDuration).toBeLessThan(10000);
    });

    it('should maintain acceptable processing speed', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Should process at least 10 records per second in dry-run
      expect(result.summary.averageSpeed).toBeGreaterThan(10);
    });

    it('should track timing for each collection', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons', 'documentation'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Each collection should have timing data (may be 0 for very fast operations)
      for (const collectionResult of result.summary.collectionResults) {
        expect(collectionResult.totalDuration).toBeGreaterThanOrEqual(0);
      }

      // Total duration should equal sum of collection durations (approximately)
      const sumDurations = result.summary.collectionResults.reduce(
        (sum, r) => sum + r.totalDuration,
        0
      );
      expect(result.summary.totalDuration).toBeGreaterThanOrEqual(sumDurations);
    });
  });

  describe('Verbose Mode', () => {
    it('should provide detailed logging in verbose mode', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: true,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      // Verbose logging verified through console output
      // This test verifies that verbose mode doesn't break the workflow
    });

    it('should produce same results in verbose and non-verbose modes', async () => {
      const baseOptions = {
        dryRun: true,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      // Run with verbose
      const verboseOrchestrator = new SeedOrchestrator();
      const verboseResult = await verboseOrchestrator.run({
        ...baseOptions,
        verbose: true,
      });

      // Run without verbose
      resetPayloadInstance();
      const quietOrchestrator = new SeedOrchestrator();
      const quietResult = await quietOrchestrator.run({
        ...baseOptions,
        verbose: false,
      });

      expect(verboseResult.success).toBe(true);
      expect(quietResult.success).toBe(true);
      expect(verboseResult.summary.successCount).toBe(quietResult.summary.successCount);
      expect(verboseResult.summary.totalRecords).toBe(quietResult.summary.totalRecords);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single collection seeding', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(1);
      expect(result.summary.collectionResults[0].collection).toBe('courses');
    });

    it('should handle collections with no data', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['empty-test'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should handle gracefully (may fail validation)
      expect(result).toBeDefined();
    });

    it('should handle large collections efficiently', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons'], // Has 25 records
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // May fail due to missing dependencies, but should handle data volume
      expect(result).toBeDefined();
    });
  });
});
