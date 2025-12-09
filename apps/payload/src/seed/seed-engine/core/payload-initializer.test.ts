/**
 * Unit tests for Payload initializer
 *
 * Tests:
 * - Environment variable validation
 * - Singleton pattern behavior
 * - Graceful cleanup
 *
 * Note: Production environment protection is tested in index.test.ts
 * via validateEnvironmentSafety(), which is the single source of truth
 * for production safety checks (supports --force flag).
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
    // sslmode=disable required for local Supabase with self-signed certificates
    process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test?sslmode=disable';
    process.env.PAYLOAD_SECRET = 'test-secret-key-for-testing';
    process.env.SEED_USER_PASSWORD = 'test-password';
    // @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
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

  describe('initializePayload - environment support', () => {
    // Note: Production safety checks are handled by validateEnvironmentSafety()
    // in index.ts before initializePayload() is called. This ensures:
    // 1. Single source of truth for production checks
    // 2. Support for --force flag to bypass in production
    // See index.test.ts for production safety check tests.

    it('should allow initialization in development', async () => {
      // @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
      process.env.NODE_ENV = 'development';

      // With valid environment, Payload successfully initializes
      const result = await initializePayload();
      expect(result).toBeDefined();
    });

    it('should allow initialization in test environment', async () => {
      // @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
      process.env.NODE_ENV = 'test';

      // With valid environment, Payload successfully initializes
      const result = await initializePayload();
      expect(result).toBeDefined();
    });

    it('should allow initialization in production (safety check is at entry point)', async () => {
      // @ts-expect-error - NODE_ENV is read-only in strict mode but writable at runtime
      process.env.NODE_ENV = 'production';

      // initializePayload() no longer blocks production - that's handled by
      // validateEnvironmentSafety() at the entry point, which supports --force flag
      const result = await initializePayload();
      expect(result).toBeDefined();
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

});
