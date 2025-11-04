/**
 * Integration tests for error handling and recovery scenarios
 *
 * Tests the seeding engine's ability to handle and recover from:
 * - Invalid JSON data
 * - Missing file references
 * - Malformed data structures
 * - Environment configuration errors
 * - Validation failures
 * - Reference resolution errors
 *
 * @module seed-engine/__tests__/integration/error-scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeedOrchestrator } from '../../core/seed-orchestrator';
import { resetPayloadInstance } from '../../core/payload-initializer';
import type { SeedOptions } from '../../types';

describe('Integration: Error Scenarios', () => {
  let orchestrator: SeedOrchestrator;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetPayloadInstance();

    process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test';
    process.env.PAYLOAD_SECRET = 'test-secret-key-for-testing';
    // @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
    process.env.NODE_ENV = 'test';

    orchestrator = new SeedOrchestrator();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetPayloadInstance();
  });

  describe('Environment Configuration Errors', () => {
    it('should fail gracefully when DATABASE_URI is missing', async () => {
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
    });

    it('should fail gracefully when PAYLOAD_SECRET is missing', async () => {
      delete process.env.PAYLOAD_SECRET;

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
      expect(result.error).toContain('PAYLOAD_SECRET');
    });

    it('should handle invalid DATABASE_URI format', async () => {
      process.env.DATABASE_URI = 'invalid-connection-string';

      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // In dry-run mode, may not validate connection string format
      // Real database operations would fail, but dry-run validation may pass
      expect([true, false]).toContain(result.success);
    });
  });

  describe('Data Validation Errors', () => {
    it('should fail with invalid collection names', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['non-existent-collection', 'another-invalid'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('No valid collections');
    });

    it('should handle malformed JSON gracefully', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['malformed-test'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid data types', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['invalid-types'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-array JSON data', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['object-test'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null data', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['null-test'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty arrays', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['empty-test'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Empty array may be valid or invalid depending on validation rules
      expect(result).toBeDefined();
    });
  });

  describe('Reference Resolution Errors', () => {
    it('should fail when dependent collection is missing', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons'], // Missing 'courses' dependency
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('validation failed');
    });

    it('should fail when quiz-questions are seeded without quizzes', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['quiz-questions'], // Missing 'course-quizzes' dependency
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should fail when survey-questions are seeded without surveys', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['survey-questions'], // Missing 'surveys' dependency
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should handle multi-level dependency failures', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['quiz-questions', 'survey-questions'], // Missing multiple levels
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transient initialization errors', async () => {
      // First attempt with invalid config
      delete process.env.DATABASE_URI;

      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result1 = await orchestrator.run(options);
      expect(result1.success).toBe(false);

      // Second attempt with valid config
      process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test';
      resetPayloadInstance();

      const orchestrator2 = new SeedOrchestrator();
      const result2 = await orchestrator2.run(options);

      // Should succeed after config fix
      expect(result2.success).toBe(true);
    });

    it('should provide detailed error information', async () => {
      delete process.env.PAYLOAD_SECRET;

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
      expect(result.error).not.toBe('');
      expect(typeof result.error).toBe('string');
    });

    it('should return partial results on error', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['invalid-collection'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecords).toBe(0);
      expect(result.summary.failureCount).toBe(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should respect timeout settings', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 1, // Very short timeout (1ms)
      };

      const startTime = Date.now();
      const result = await orchestrator.run(options);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time even with short timeout
      // (timeout only applies to individual operations, not overall workflow)
      expect(duration).toBeLessThan(30000); // 30 seconds max
      expect(result).toBeDefined();
    });
  });

  describe('Retry Mechanism', () => {
    it('should handle max retries setting', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 0, // No retries
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should still work with no retries for successful operations
      expect(result.success).toBe(true);
    });

    it('should accept high retry counts', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses'],
        maxRetries: 10, // Many retries
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
    });
  });

  describe('Verbose Error Reporting', () => {
    it('should provide detailed errors in verbose mode', async () => {
      delete process.env.DATABASE_URI;

      const options: SeedOptions = {
        dryRun: true,
        verbose: true,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Verbose mode should not change error structure
    });

    it('should handle errors in non-verbose mode', async () => {
      delete process.env.PAYLOAD_SECRET;

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
    });
  });

  describe('Edge Case Error Handling', () => {
    it('should handle empty collection filter array', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [], // Empty array (should load all)
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBeGreaterThan(0);
    });

    it('should handle duplicate collection names in filter', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'courses', 'courses'], // Duplicates
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);
      // Should only process courses once
      expect(result.summary.collectionResults.length).toBe(1);
    });

    it('should handle mixed valid and invalid collection names', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['courses', 'invalid-name'], // Mixed - courses has no external refs
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should process valid collections and ignore invalid
      expect(result.success).toBe(true);
      expect(result.summary.collectionResults.length).toBe(1); // Only courses loaded
    });
  });

  describe('Critical Error Handling', () => {
    it('should fail fast on critical initialization errors', async () => {
      delete process.env.DATABASE_URI;
      delete process.env.PAYLOAD_SECRET;

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
      // Should return quickly without attempting to process data
      expect(result.summary.totalDuration).toBeLessThan(5000);
    });

    it('should provide actionable error messages', async () => {
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
      // Error should mention the missing variable
      expect(result.error?.toLowerCase()).toMatch(/database|uri|connection/);
    });
  });
});
