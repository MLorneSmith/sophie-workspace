/**
 * Unit tests for error handler
 *
 * Tests:
 * - Error classification (transient, validation, critical)
 * - Exponential backoff calculation with jitter
 * - Retry logic (1-3 attempts)
 * - Error grouping and reporting
 * - Retryable vs non-retryable errors
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorHandler } from './error-handler';
import type { SeedRecord } from '../types';

describe('error-handler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler({ maxRetries: 3, initialDelay: 100, maxDelay: 1000 });
  });

  describe('error classification', () => {
    const context = { collection: 'courses' };

    it('should classify network errors as transient', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      const result = errorHandler.classifyError(error, context);

      expect(result.type).toBe('transient');
      expect(result.collection).toBe('courses');
    });

    it('should classify timeout errors as transient', () => {
      const error = new Error('ETIMEDOUT: Operation timed out');
      const result = errorHandler.classifyError(error, context);

      expect(result.type).toBe('transient');
    });

    it('should classify database lock errors as transient', () => {
      const error = new Error('deadlock detected');
      const result = errorHandler.classifyError(error, context);

      expect(result.type).toBe('transient');
    });

    it('should classify validation errors correctly', () => {
      const error = new Error('Validation failed: required field missing');
      const result = errorHandler.classifyError(error, context);

      expect(result.type).toBe('validation');
    });

    it('should classify unique constraint errors as validation', () => {
      const error = new Error('unique constraint violation');
      const result = errorHandler.classifyError(error, context);

      expect(result.type).toBe('validation');
    });

    it('should classify unknown errors as critical', () => {
      const error = new Error('Something went wrong');
      const result = errorHandler.classifyError(error, context);

      expect(result.type).toBe('critical');
    });

    it('should handle string errors', () => {
      const result = errorHandler.classifyError('network error occurred', context);

      expect(result.type).toBe('transient');
      expect(result.message).toBe('network error occurred');
    });

    it('should handle error objects without Error instance', () => {
      const error = { message: 'Invalid data format' };
      const result = errorHandler.classifyError(error, context);

      expect(result.type).toBe('validation');
    });

    it('should include record in error details', () => {
      const record: SeedRecord = { _ref: 'test-1', title: 'Test' };
      const error = new Error('Test error');
      const result = errorHandler.classifyError(error, { collection: 'courses', record });

      expect(result.record).toEqual(record);
    });
  });

  describe('isRetryable', () => {
    it('should mark transient errors as retryable', () => {
      expect(errorHandler.isRetryable('transient')).toBe(true);
    });

    it('should mark validation errors as non-retryable', () => {
      expect(errorHandler.isRetryable('validation')).toBe(false);
    });

    it('should mark critical errors as non-retryable', () => {
      expect(errorHandler.isRetryable('critical')).toBe(false);
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay1 = errorHandler.calculateBackoff(1);
      const delay2 = errorHandler.calculateBackoff(2);
      const delay3 = errorHandler.calculateBackoff(3);

      // First attempt: ~100ms (with jitter)
      expect(delay1).toBeGreaterThan(80);
      expect(delay1).toBeLessThan(120);

      // Second attempt: ~200ms (with jitter)
      expect(delay2).toBeGreaterThan(160);
      expect(delay2).toBeLessThan(240);

      // Third attempt: ~400ms (with jitter)
      expect(delay3).toBeGreaterThan(320);
      expect(delay3).toBeLessThan(480);
    });

    it('should cap delay at maximum value', () => {
      const handler = new ErrorHandler({ maxDelay: 500 });
      const delay = handler.calculateBackoff(10); // Would be 51200ms without cap

      expect(delay).toBeLessThanOrEqual(600); // Max + jitter
    });

    it('should add jitter to prevent thundering herd', () => {
      // Multiple calls should produce different delays
      const delays = Array.from({ length: 10 }, () => errorHandler.calculateBackoff(2));
      const uniqueDelays = new Set(delays);

      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue({ id: '123' });

      const result = await errorHandler.withRetry(operation, { collection: 'courses' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123' });
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry transient errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue({ id: '123' });

      const result = await errorHandler.withRetry(operation, { collection: 'courses' });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry validation errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation failed'));

      const result = await errorHandler.withRetry(operation, { collection: 'courses' });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result.error?.type).toBe('validation');
    });

    it('should not retry critical errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Critical system failure'));

      const result = await errorHandler.withRetry(operation, { collection: 'courses' });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(result.error?.type).toBe('critical');
    });

    it('should stop after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await errorHandler.withRetry(operation, { collection: 'courses' });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should track errors for reporting', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Validation failed'));

      await errorHandler.withRetry(operation, { collection: 'courses' });

      const errors = errorHandler.getErrorGroups();
      expect(errors.size).toBeGreaterThan(0);
    });
  });

  describe('error tracking', () => {
    it('should group errors by collection and type', () => {
      const error1 = { type: 'validation' as const, message: 'Error 1', collection: 'courses' };
      const error2 = { type: 'validation' as const, message: 'Error 2', collection: 'courses' };
      const error3 = { type: 'critical' as const, message: 'Error 3', collection: 'courses' };

      errorHandler.addError(error1);
      errorHandler.addError(error2);
      errorHandler.addError(error3);

      const groups = errorHandler.getErrorGroups();

      expect(groups.get('courses:validation')).toHaveLength(2);
      expect(groups.get('courses:critical')).toHaveLength(1);
    });

    it('should generate error summary', () => {
      errorHandler.addError({ type: 'validation', message: 'E1', collection: 'c1' });
      errorHandler.addError({ type: 'validation', message: 'E2', collection: 'c1' });
      errorHandler.addError({ type: 'transient', message: 'E3', collection: 'c2' });
      errorHandler.addError({ type: 'critical', message: 'E4', collection: 'c3' });

      const summary = errorHandler.getErrorSummary();

      expect(summary.validation).toBe(2);
      expect(summary.transient).toBe(1);
      expect(summary.critical).toBe(1);
    });

    it('should clear all tracked errors', () => {
      errorHandler.addError({ type: 'validation', message: 'E1', collection: 'c1' });
      errorHandler.addError({ type: 'critical', message: 'E2', collection: 'c2' });

      errorHandler.clearErrors();

      const groups = errorHandler.getErrorGroups();
      expect(groups.size).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should use custom max retries', async () => {
      const handler = new ErrorHandler({ maxRetries: 5, initialDelay: 10, maxDelay: 50 });
      const operation = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await handler.withRetry(operation, { collection: 'courses' });

      expect(result.attempts).toBe(5);
    });

    it('should use custom initial delay', () => {
      const handler = new ErrorHandler({ initialDelay: 500 });
      const delay = handler.calculateBackoff(1);

      expect(delay).toBeGreaterThan(400);
      expect(delay).toBeLessThan(600);
    });

    it('should use custom max delay', () => {
      const handler = new ErrorHandler({ maxDelay: 2000 });
      const delay = handler.calculateBackoff(10);

      expect(delay).toBeLessThanOrEqual(2400); // Max + jitter
    });
  });
});
