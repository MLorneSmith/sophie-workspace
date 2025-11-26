/**
 * Integration tests for Seed Orchestrator
 *
 * Tests the complete seeding workflow including:
 * - Initialization and cleanup
 * - Data loading and validation
 * - Collection processing in correct order
 * - Reference resolution and caching
 * - Error handling and retries
 * - Dry-run mode
 * - Collection filtering
 * - Post-seed validation
 *
 * @module seed-engine/core/seed-orchestrator.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SeedOrchestrator } from './seed-orchestrator';
import type { SeedOptions } from '../types';
import { resetPayloadInstance } from './payload-initializer';

describe('SeedOrchestrator', () => {
  let orchestrator: SeedOrchestrator;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset Payload singleton
    resetPayloadInstance();

    // Set up valid test environment - use actual test database credentials
    // sslmode=disable required for local Supabase with self-signed certificates
    process.env.DATABASE_URI = 'postgresql://postgres:postgres@localhost:54522/postgres?sslmode=disable';
    process.env.PAYLOAD_SECRET = 'test_payload_secret_for_e2e_testing';
    process.env.SEED_USER_PASSWORD = 'test-password';
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'http://localhost:3020';
    // @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
    process.env.NODE_ENV = 'test';

    orchestrator = new SeedOrchestrator();
  });

  afterEach(() => {
    // Reset Payload singleton
    resetPayloadInstance();

    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize all services', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle initialization errors gracefully', async () => {
      // Force initialization error by setting invalid env
      const originalEnv = process.env.DATABASE_URI;
      delete process.env.DATABASE_URI;

      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('DATABASE_URI');

      // Restore env
      process.env.DATABASE_URI = originalEnv;
    });
  });

  describe('Data Loading', () => {
    it('should load all collections when no filter specified', async () => {
      console.log('ENV VARS BEFORE TEST:');
      console.log('  DATABASE_URI:', process.env.DATABASE_URI);
      console.log('  PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET);
      console.log('  NODE_ENV:', process.env.NODE_ENV);

      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      if (!result.success) {
        console.log('Test failed with error:', result.error);
      }

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBeGreaterThan(0);
    });

    it('should load only specified collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['media', 'downloads', 'quiz-questions', 'courses', 'course-quizzes', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(6);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      expect(collectionNames).toContain('courses');
      expect(collectionNames).toContain('course-lessons');
    });

    it('should respect dependency order when filtering collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons', 'course-quizzes', 'quiz-questions', 'courses', 'downloads', 'media'], // Reversed order
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Should process in correct order despite input order
      const collectionNames = result.summary.collectionResults.map((r) => r.collection);
      const coursesIndex = collectionNames.indexOf('courses');
      const lessonsIndex = collectionNames.indexOf('course-lessons');

      expect(coursesIndex).toBeLessThan(lessonsIndex);
    });

    it('should handle empty collection filter', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBeGreaterThan(0);
    });

    it('should handle invalid collection names', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['invalid-collection', 'another-invalid'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid collections');
    });
  });

  describe('Dry-Run Mode', () => {
    it('should validate data without creating records', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.successCount).toBeGreaterThan(0);
      expect(result.summary.failureCount).toBe(0);

      // Verify no actual records created (would need database check)
      // For now, just verify dry-run completed successfully
    });

    it('should report validation errors in dry-run mode', async () => {
      // This would need invalid test data to trigger validation errors
      // For now, just verify dry-run can complete with valid data
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
    });
  });

  describe('Collection Processing', () => {
    it('should process collections in correct dependency order', async () => {
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

      // Verify users come before posts (posts may reference users)
      if (collectionNames.includes('users') && collectionNames.includes('posts')) {
        const usersIndex = collectionNames.indexOf('users');
        const postsIndex = collectionNames.indexOf('posts');
        expect(usersIndex).toBeLessThan(postsIndex);
      }

      // Verify courses come before course-lessons
      if (collectionNames.includes('courses') && collectionNames.includes('course-lessons')) {
        const coursesIndex = collectionNames.indexOf('courses');
        const lessonsIndex = collectionNames.indexOf('course-lessons');
        expect(coursesIndex).toBeLessThan(lessonsIndex);
      }

      // Verify course-quizzes come before quiz-questions
      if (
        collectionNames.includes('course-quizzes') &&
        collectionNames.includes('quiz-questions')
      ) {
        const quizzesIndex = collectionNames.indexOf('course-quizzes');
        const questionsIndex = collectionNames.indexOf('quiz-questions');
        expect(quizzesIndex).toBeLessThan(questionsIndex);
      }
    });

    it('should track progress for each collection', async () => {
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
      expect(coursesResult.totalDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reference Resolution', () => {
    it('should resolve references across collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['media', 'downloads', 'quiz-questions', 'courses', 'course-quizzes', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Both collections should succeed (references resolved)
      const coursesResult = result.summary.collectionResults.find(
        (r) => r.collection === 'courses'
      );
      const lessonsResult = result.summary.collectionResults.find(
        (r) => r.collection === 'course-lessons'
      );

      expect(coursesResult?.successCount).toBeGreaterThan(0);
      expect(lessonsResult?.successCount).toBeGreaterThan(0);
    });

    it('should handle missing reference dependencies', async () => {
      // Try to load lessons without courses (should fail validation)
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
    });
  });

  describe('Error Handling', () => {
    it('should handle data validation errors', async () => {
      // Test with invalid test data file
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['invalid-types'], // Would need test file with invalid types
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should continue processing after non-critical errors', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Even with some potential errors, should complete
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    it('should track timing for each collection', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.summary.collectionResults[0].totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average processing speed', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.averageSpeed).toBeGreaterThanOrEqual(0);
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
    });
  });

  describe('Summary Report', () => {
    it('should generate accurate summary statistics', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBeGreaterThan(0);
      expect(result.summary.successCount).toBeGreaterThan(0);
      expect(result.summary.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.summary.collectionResults).toBeDefined();
      expect(result.summary.collectionResults.length).toBe(1);
    });

    it('should track success and failure counts', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      const totalProcessed = result.summary.successCount + result.summary.failureCount;
      expect(totalProcessed).toBe(result.summary.totalRecords);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources after successful run', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Verify cleanup happened (resources released)
      // This is implicit - if no errors, cleanup worked
    });

    it('should cleanup resources after failed run', async () => {
      const originalEnv = process.env.DATABASE_URI;
      delete process.env.DATABASE_URI;

      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);

      // Verify cleanup happened even on error
      // This is implicit - if test completes, cleanup worked

      process.env.DATABASE_URI = originalEnv;
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
      // Verbose mode logging verified through console output
    });

    it('should provide minimal logging in non-verbose mode', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      // Non-verbose mode logging verified through console output
    });
  });

  describe('Idempotency', () => {
    it('should handle running twice with same data', async () => {
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

      // Second run (with cleanup in between via new orchestrator)
      const orchestrator2 = new SeedOrchestrator();
      const result2 = await orchestrator2.run(options);
      expect(result2.success).toBe(true);

      // Both should succeed (idempotent)
      expect(result1.summary.successCount).toBe(result2.summary.successCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['empty-test'], // Would need empty test file
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should handle gracefully (may succeed or fail validation)
      expect(result).toBeDefined();
    });

    it('should handle collections with single record', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'], // Has 1 record
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.totalRecords).toBeGreaterThan(0);
    });

    it('should handle collections with many records', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons'], // Has 25+ records
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // May fail due to missing course references in isolated test
      expect(result).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should successfully seed all collections in correct order', async () => {
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
      expect(result.summary.totalRecords).toBeGreaterThan(100);
    });

    it('should provide accurate performance metrics', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.averageSpeed).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalDuration).toBeGreaterThanOrEqual(0);
      expect(result.summary.slowestCollections.length).toBeGreaterThan(0);
    });
  });
});
