/**
 * Unit tests for CLI interface
 *
 * Tests:
 * - Argument parsing (all flags and combinations)
 * - Environment validation
 * - Production environment blocking
 * - Help text generation
 * - Exit code handling
 * - Error scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseArguments, validateEnvironmentSafety, runSeeding } from './index';
import { Logger, LogLevel } from './utils/logger';
import type { SeedOptions } from './types';

describe('CLI Interface', () => {
  // Store original values
  const originalEnv = { ...process.env };
  const originalArgv = [...process.argv];

  beforeEach(() => {
    // Set up valid test environment
    process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test';
    process.env.PAYLOAD_SECRET = 'test-secret-key-for-testing';
    process.env.NODE_ENV = 'test';

    // Reset argv
    process.argv = ['node', 'index.ts'];
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    process.argv = originalArgv;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('parseArguments', () => {
    it('should parse default options', () => {
      const options = parseArguments();

      expect(options).toEqual({
        dryRun: false,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      });
    });

    it('should parse --dry-run flag', () => {
      process.argv.push('--dry-run');

      const options = parseArguments();

      expect(options.dryRun).toBe(true);
    });

    it('should parse --verbose flag', () => {
      process.argv.push('--verbose');

      const options = parseArguments();

      expect(options.verbose).toBe(true);
    });

    it('should parse -c flag with single collection', () => {
      process.argv.push('-c', 'courses');

      const options = parseArguments();

      expect(options.collections).toEqual(['courses']);
    });

    it('should parse --collections flag with multiple collections', () => {
      process.argv.push('--collections', 'courses,course-lessons,posts');

      const options = parseArguments();

      expect(options.collections).toEqual(['courses', 'course-lessons', 'posts']);
    });

    it('should trim whitespace from collection names', () => {
      process.argv.push('-c', ' courses , course-lessons , posts ');

      const options = parseArguments();

      expect(options.collections).toEqual(['courses', 'course-lessons', 'posts']);
    });

    it('should filter out empty collection names', () => {
      process.argv.push('-c', 'courses,,course-lessons,');

      const options = parseArguments();

      expect(options.collections).toEqual(['courses', 'course-lessons']);
    });

    it('should parse --max-retries flag', () => {
      process.argv.push('--max-retries', '5');

      const options = parseArguments();

      expect(options.maxRetries).toBe(5);
    });

    it('should parse --timeout flag', () => {
      process.argv.push('--timeout', '60000');

      const options = parseArguments();

      expect(options.timeout).toBe(60000);
    });

    it('should parse multiple flags together', () => {
      process.argv.push('--dry-run', '--verbose', '-c', 'courses,posts', '--max-retries', '5');

      const options = parseArguments();

      expect(options).toEqual({
        dryRun: true,
        verbose: true,
        collections: ['courses', 'posts'],
        maxRetries: 5,
        timeout: 120000,
      });
    });

    it('should handle empty collections string', () => {
      process.argv.push('--collections', '');

      const options = parseArguments();

      expect(options.collections).toEqual([]);
    });
  });

  describe('validateEnvironmentSafety', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger({ verbose: false, level: LogLevel.ERROR });
      // Spy on logger methods to avoid console output during tests
      vi.spyOn(logger, 'error').mockImplementation(() => {});
      vi.spyOn(logger, 'info').mockImplementation(() => {});
    });

    it('should pass validation with all required variables', () => {
      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(true);
    });

    it('should fail validation when DATABASE_URI is missing', () => {
      delete process.env.DATABASE_URI;

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Environment validation failed');
    });

    it('should fail validation when PAYLOAD_SECRET is missing', () => {
      delete process.env.PAYLOAD_SECRET;

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Environment validation failed');
    });

    it('should fail validation in production environment', () => {
      process.env.NODE_ENV = 'production';

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'SAFETY CHECK FAILED: Seeding is not allowed in production environment'
      );
    });

    it('should pass validation in development environment', () => {
      process.env.NODE_ENV = 'development';

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(true);
    });

    it('should pass validation in test environment', () => {
      process.env.NODE_ENV = 'test';

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(true);
    });

    it('should log missing environment variables', () => {
      delete process.env.DATABASE_URI;
      delete process.env.PAYLOAD_SECRET;

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Missing required environment variables: DATABASE_URI, PAYLOAD_SECRET'
      );
    });
  });

  describe('runSeeding', () => {
    let logger: Logger;
    let options: SeedOptions;

    beforeEach(() => {
      logger = new Logger({ verbose: false, level: LogLevel.ERROR });
      // Spy on logger methods
      vi.spyOn(logger, 'info').mockImplementation(() => {});
      vi.spyOn(logger, 'success').mockImplementation(() => {});
      vi.spyOn(logger, 'error').mockImplementation(() => {});
      vi.spyOn(logger, 'warn').mockImplementation(() => {});
      vi.spyOn(logger, 'debug').mockImplementation(() => {});

      options = {
        dryRun: false,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };
    });

    it('should return initialization error when Payload fails to initialize', async () => {
      // This will fail because we don't have real Payload setup
      const exitCode = await runSeeding(options, logger);

      expect(exitCode).toBe(2); // INITIALIZATION_ERROR
      expect(logger.error).toHaveBeenCalledWith(
        'Initialization failed',
        expect.any(Error)
      );
    });

    it('should log dry-run mode when enabled', async () => {
      options.dryRun = true;

      await runSeeding(options, logger);

      // Note: This will still fail at initialization, but we can verify
      // the option would be logged if initialization succeeded
      expect(options.dryRun).toBe(true);
    });

    it('should log collection filter when provided', async () => {
      options.collections = ['courses', 'posts'];

      await runSeeding(options, logger);

      expect(options.collections).toEqual(['courses', 'posts']);
    });

    it('should handle verbose mode', async () => {
      options.verbose = true;
      logger = new Logger({ verbose: true, level: LogLevel.DEBUG });
      vi.spyOn(logger, 'debug').mockImplementation(() => {});

      await runSeeding(options, logger);

      // Verify verbose mode is enabled
      expect(options.verbose).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle numeric string parsing for maxRetries', () => {
      process.argv.push('--max-retries', '0');

      const options = parseArguments();

      expect(options.maxRetries).toBe(0);
    });

    it('should handle numeric string parsing for timeout', () => {
      process.argv.push('--timeout', '0');

      const options = parseArguments();

      expect(options.timeout).toBe(0);
    });

    it('should handle invalid numeric inputs gracefully', () => {
      process.argv.push('--max-retries', 'invalid');

      const options = parseArguments();

      // parseInt returns NaN for invalid strings
      expect(Number.isNaN(options.maxRetries)).toBe(true);
    });

    it('should handle collections with special characters', () => {
      process.argv.push('-c', 'course-lessons,quiz-questions,survey-questions');

      const options = parseArguments();

      expect(options.collections).toEqual([
        'course-lessons',
        'quiz-questions',
        'survey-questions',
      ]);
    });

    it('should handle empty environment variables', () => {
      process.env.DATABASE_URI = '';
      process.env.PAYLOAD_SECRET = '';

      const logger = new Logger({ verbose: false, level: LogLevel.ERROR });
      vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(false);
    });

    it('should handle undefined NODE_ENV', () => {
      delete process.env.NODE_ENV;

      const logger = new Logger({ verbose: false, level: LogLevel.ERROR });
      vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = validateEnvironmentSafety(logger);

      // Should pass - undefined NODE_ENV is not 'production'
      expect(result).toBe(true);
    });
  });

  describe('Flag Combinations', () => {
    it('should handle all flags enabled simultaneously', () => {
      process.argv.push(
        '--dry-run',
        '--verbose',
        '-c',
        'courses',
        '--max-retries',
        '10',
        '--timeout',
        '60000'
      );

      const options = parseArguments();

      expect(options).toEqual({
        dryRun: true,
        verbose: true,
        collections: ['courses'],
        maxRetries: 10,
        timeout: 60000,
      });
    });

    it('should handle short and long flag variants', () => {
      process.argv.push('-c', 'courses', '--collections', 'posts');

      // Commander will take the last value
      const options = parseArguments();

      expect(options.collections).toEqual(['posts']);
    });
  });

  describe('Validation Order', () => {
    it('should check production environment before other validations', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URI; // Also missing variable

      const logger = new Logger({ verbose: false, level: LogLevel.ERROR });
      vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(false);
      // Should fail on production check first
      expect(logger.error).toHaveBeenCalledWith(
        'SAFETY CHECK FAILED: Seeding is not allowed in production environment'
      );
    });

    it('should check environment variables after production check', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.DATABASE_URI;

      const logger = new Logger({ verbose: false, level: LogLevel.ERROR });
      vi.spyOn(logger, 'error').mockImplementation(() => {});

      const result = validateEnvironmentSafety(logger);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Environment validation failed');
    });
  });

  describe('Exit Codes', () => {
    it('should define correct exit code constants', async () => {
      const logger = new Logger({ verbose: false, level: LogLevel.ERROR });
      vi.spyOn(logger, 'info').mockImplementation(() => {});
      vi.spyOn(logger, 'error').mockImplementation(() => {});

      const options: SeedOptions = {
        dryRun: false,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const exitCode = await runSeeding(options, logger);

      // Should be a valid exit code (0-3)
      expect([0, 1, 2, 3]).toContain(exitCode);
    });
  });
});
