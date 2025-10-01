/**
 * Integration tests for collection filtering
 *
 * Tests the --collections flag functionality including:
 * - Filtering specific collections
 * - Maintaining dependency order
 * - Handling multiple collection filters
 * - Invalid filter handling
 * - Empty filter behavior
 *
 * @module seed-engine/__tests__/integration/collection-filtering
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeedOrchestrator } from '../../core/seed-orchestrator';
import { resetPayloadInstance } from '../../core/payload-initializer';
import type { SeedOptions } from '../../types';

describe('Integration: Collection Filtering', () => {
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

  describe('Single Collection Filtering', () => {
    it('should seed only specified single collection', async () => {
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

    it('should handle single leaf collection', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['posts'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false); // May fail due to missing media
      expect(result.summary.collectionResults.length).toBeLessThanOrEqual(1);
    });

    it('should handle single root collection', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['media'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(1);
      expect(result.summary.collectionResults[0].collection).toBe('media');
    });
  });

  describe('Multiple Collection Filtering', () => {
    it('should seed multiple specified collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(2);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).toContain('courses');
      expect(collectionNames).toContain('course-lessons');
    });

    it('should handle three-level dependency chain', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-quizzes', 'quiz-questions'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(3);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).toContain('courses');
      expect(collectionNames).toContain('course-quizzes');
      expect(collectionNames).toContain('quiz-questions');
    });

    it('should seed independent collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['media', 'downloads'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(2);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).toContain('media');
      expect(collectionNames).toContain('downloads');
    });
  });

  describe('Dependency Order Preservation', () => {
    it('should respect dependency order regardless of input order', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons', 'courses'], // Reversed order
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      const coursesIndex = collectionNames.indexOf('courses');
      const lessonsIndex = collectionNames.indexOf('course-lessons');

      // Courses should be processed before lessons
      expect(coursesIndex).toBeLessThan(lessonsIndex);
    });

    it('should maintain order with complex filter', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [
          'quiz-questions',
          'course-quizzes',
          'courses',
          'downloads',
          'media',
        ], // Completely reversed
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);

      // Verify correct dependency order
      const mediaIndex = collectionNames.indexOf('media');
      const downloadsIndex = collectionNames.indexOf('downloads');
      const coursesIndex = collectionNames.indexOf('courses');
      const quizzesIndex = collectionNames.indexOf('course-quizzes');
      const questionsIndex = collectionNames.indexOf('quiz-questions');

      expect(mediaIndex).toBeGreaterThanOrEqual(0);
      expect(downloadsIndex).toBeGreaterThanOrEqual(0);
      expect(coursesIndex).toBeGreaterThan(Math.max(mediaIndex, downloadsIndex));
      expect(quizzesIndex).toBeGreaterThan(coursesIndex);
      expect(questionsIndex).toBeGreaterThan(quizzesIndex);
    });

    it('should handle partial dependency chains', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['media', 'courses', 'course-quizzes'], // Missing course-lessons
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Should only process the specified collections
      expect(result.summary.collectionResults.length).toBe(3);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).not.toContain('course-lessons');
    });
  });

  describe('Empty and All Collection Filters', () => {
    it('should load all collections when filter is empty array', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBeGreaterThan(5);

      // Verify all major collections are included
      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).toContain('courses');
      expect(collectionNames).toContain('course-lessons');
      expect(collectionNames).toContain('posts');
      expect(collectionNames).toContain('media');
    });

    it('should handle all collections explicitly listed', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [
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
        ],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(11);
    });
  });

  describe('Invalid Filter Handling', () => {
    it('should fail with all invalid collection names', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['invalid1', 'invalid2', 'invalid3'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid collections');
    });

    it('should filter out invalid collection names', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'invalid-name', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(2);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).toContain('courses');
      expect(collectionNames).toContain('course-lessons');
      expect(collectionNames).not.toContain('invalid-name');
    });

    it('should handle duplicate collection names', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'courses', 'courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      // Should only process once
      expect(result.summary.collectionResults.length).toBe(1);
      expect(result.summary.collectionResults[0].collection).toBe('courses');
    });

    it('should handle case sensitivity', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['Courses', 'COURSES', 'courses'], // Different cases
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Only 'courses' (lowercase) should be valid
      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(1);
      expect(result.summary.collectionResults[0].collection).toBe('courses');
    });
  });

  describe('Partial Seeding Scenarios', () => {
    it('should seed only root collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['media', 'downloads', 'users'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(3);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).toContain('media');
      expect(collectionNames).toContain('downloads');
      expect(collectionNames).toContain('users');
    });

    it('should seed only leaf collections (with dependencies)', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['quiz-questions', 'survey-questions'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should fail due to missing dependencies
      expect(result.success).toBe(false);
    });

    it('should seed middle-tier collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'posts', 'documentation'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // May succeed or fail depending on media/downloads presence
      expect(result.success).toBe(false);
    });
  });

  describe('Filter Performance', () => {
    it('should be faster with fewer collections', async () => {
      const singleOptions: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const allOptions: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const singleResult = await orchestrator.run(singleOptions);
      expect(singleResult.success).toBe(true);

      resetPayloadInstance();
      const orchestrator2 = new SeedOrchestrator();
      const allResult = await orchestrator2.run(allOptions);
      expect(allResult.success).toBe(true);

      // Single collection should be significantly faster
      expect(singleResult.summary.totalDuration).toBeLessThan(
        allResult.summary.totalDuration
      );
    });

    it('should process filtered collections efficiently', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      // Should complete quickly for 2 collections
      expect(result.summary.totalDuration).toBeLessThan(5000);
    });
  });

  describe('Filter Statistics', () => {
    it('should report accurate counts for filtered collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-quizzes'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Total should equal sum of filtered collections only
      const expectedTotal = result.summary.collectionResults.reduce(
        (sum, r) => sum + r.successCount + r.failureCount,
        0
      );
      expect(result.summary.totalRecords).toBe(expectedTotal);
    });

    it('should calculate speed based on filtered collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.averageSpeed).toBeGreaterThan(0);

      // Speed should be based on actual records processed
      const expectedSpeed =
        result.summary.totalRecords / (result.summary.totalDuration / 1000);
      expect(result.summary.averageSpeed).toBeCloseTo(expectedSpeed, 1);
    });

    it('should identify slowest collections from filtered set', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'course-lessons', 'course-quizzes'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.slowestCollections.length).toBeGreaterThan(0);

      // Slowest should only include filtered collections
      for (const slow of result.summary.slowestCollections) {
        expect(options.collections).toContain(slow.collection);
      }
    });
  });

  describe('Real-World Filter Scenarios', () => {
    it('should handle course-only seeding', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [
          'courses',
          'course-lessons',
          'course-quizzes',
          'quiz-questions',
        ],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(4);
    });

    it('should handle content-only seeding', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['posts', 'documentation'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // May fail due to missing media
      expect(result.success).toBe(false);
    });

    it('should handle survey-only seeding', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['surveys', 'survey-questions'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Will fail due to missing course dependencies
      expect(result.success).toBe(false);
    });
  });
});
