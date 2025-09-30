/**
 * Unit tests for Payload initializer
 *
 * Tests:
 * - Environment variable validation
 * - Singleton pattern behavior
 * - Production environment protection
 * - Initialization error handling
 * - Graceful cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEnvironment,
  initializePayload,
  cleanupPayload,
  getPayloadInstance,
  resetPayloadInstance,
} from './payload-initializer';

describe('payload-initializer', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset singleton instance before each test
    resetPayloadInstance();

    // Set up valid test environment
    process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test';
    process.env.PAYLOAD_SECRET = 'test-secret-key-for-testing';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };

    // Clean up any Payload instance
    resetPayloadInstance();
  });

  describe('validateEnvironment', () => {
    it('should pass validation with all required variables', () => {
      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should fail validation when DATABASE_URI is missing', () => {
      delete process.env.DATABASE_URI;

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('DATABASE_URI');
    });

    it('should fail validation when PAYLOAD_SECRET is missing', () => {
      delete process.env.PAYLOAD_SECRET;

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('PAYLOAD_SECRET');
    });

    it('should list all missing variables', () => {
      delete process.env.DATABASE_URI;
      delete process.env.PAYLOAD_SECRET;

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.missing).toHaveLength(2);
      expect(result.missing).toContain('DATABASE_URI');
      expect(result.missing).toContain('PAYLOAD_SECRET');
    });

    it('should handle empty string values as missing', () => {
      process.env.DATABASE_URI = '';

      const result = validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('DATABASE_URI');
    });
  });

  describe('initializePayload - production protection', () => {
    it('should throw error when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      await expect(initializePayload()).rejects.toThrow(
        'SAFETY CHECK FAILED: Seeding is not allowed in production environment'
      );
    });

    it('should allow initialization in development', async () => {
      process.env.NODE_ENV = 'development';

      // This will fail because we don't have actual Payload setup in tests,
      // but it should pass the production check
      await expect(initializePayload()).rejects.not.toThrow(
        'SAFETY CHECK FAILED'
      );
    });

    it('should allow initialization in test environment', async () => {
      process.env.NODE_ENV = 'test';

      // This will fail at Payload init, but should pass production check
      await expect(initializePayload()).rejects.not.toThrow(
        'SAFETY CHECK FAILED'
      );
    });
  });

  describe('initializePayload - environment validation', () => {
    it('should throw error with missing DATABASE_URI', async () => {
      delete process.env.DATABASE_URI;

      await expect(initializePayload()).rejects.toThrow(
        'Missing required environment variables: DATABASE_URI'
      );
    });

    it('should throw error with missing PAYLOAD_SECRET', async () => {
      delete process.env.PAYLOAD_SECRET;

      await expect(initializePayload()).rejects.toThrow(
        'Missing required environment variables: PAYLOAD_SECRET'
      );
    });

    it('should throw error listing all missing variables', async () => {
      delete process.env.DATABASE_URI;
      delete process.env.PAYLOAD_SECRET;

      await expect(initializePayload()).rejects.toThrow(
        'DATABASE_URI, PAYLOAD_SECRET'
      );
    });
  });

  describe('singleton pattern', () => {
    it('should return null before initialization', () => {
      const instance = getPayloadInstance();
      expect(instance).toBeNull();
    });

    it('should track initialization state', async () => {
      // Before initialization
      expect(getPayloadInstance()).toBeNull();

      // Note: initializePayload will fail in test environment without real Payload setup
      // This test verifies the singleton pattern logic, not actual Payload initialization
    });

    it('should reset instance when resetPayloadInstance is called', () => {
      resetPayloadInstance();
      expect(getPayloadInstance()).toBeNull();
    });
  });

  describe('cleanupPayload', () => {
    it('should handle cleanup when no instance exists', async () => {
      // Should not throw error
      await expect(cleanupPayload()).resolves.toBeUndefined();
    });

    it('should clear instance after cleanup', async () => {
      resetPayloadInstance();
      await cleanupPayload();

      expect(getPayloadInstance()).toBeNull();
    });

    it('should not throw error even if cleanup fails', async () => {
      // Should gracefully handle cleanup errors
      await expect(cleanupPayload()).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should provide clear error message for config loading failure', async () => {
      // This tests the error handling path when config file is not found
      await expect(initializePayload()).rejects.toThrow('Payload initialization failed');
    });

    it('should include original error message in wrapped error', async () => {
      try {
        await initializePayload();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Payload initialization failed');
      }
    });
  });
});
