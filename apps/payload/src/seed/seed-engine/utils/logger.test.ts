/**
 * Unit tests for logger utility
 *
 * Tests:
 * - Log level filtering
 * - Colored output (info, debug, warn, error)
 * - Verbose mode behavior
 * - Metadata logging
 * - Configuration updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, LogLevel } from './logger';

describe('logger', () => {
  let logger: Logger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger = new Logger();
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info logging', () => {
    it('should log info messages', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });

    it('should include timestamp', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });

    it('should log metadata in verbose mode', () => {
      logger.setConfig({ verbose: true });
      logger.info('Test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"key": "value"')
      );
    });

    it('should not log metadata when verbose is false', () => {
      logger.setConfig({ verbose: false });
      logger.info('Test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('debug logging', () => {
    it('should log debug messages in verbose mode', () => {
      logger.setConfig({ verbose: true, level: LogLevel.DEBUG });
      logger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug message')
      );
    });

    it('should not log debug messages when verbose is false', () => {
      logger.setConfig({ verbose: false });
      logger.debug('Debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should always log metadata in verbose mode', () => {
      logger.setConfig({ verbose: true, level: LogLevel.DEBUG });
      logger.debug('Debug message', { detail: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"detail": "value"')
      );
    });
  });

  describe('warn logging', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message')
      );
    });

    it('should log metadata in verbose mode', () => {
      logger.setConfig({ verbose: true });
      logger.warn('Warning message', { reason: 'test' });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"reason": "test"')
      );
    });
  });

  describe('error logging', () => {
    it('should log error messages', () => {
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error message')
      );
    });

    it('should log Error objects', () => {
      const error = new Error('Test error');
      logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    it('should log stack trace in verbose mode', () => {
      logger.setConfig({ verbose: true });
      const error = new Error('Test error');
      logger.error('Operation failed', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('at ')
      );
    });

    it('should not log stack trace when verbose is false', () => {
      logger.setConfig({ verbose: false });
      const error = new Error('Test error');
      logger.error('Operation failed', error);

      // Should log: message + error message (2 calls, no stack)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle non-Error objects', () => {
      logger.error('Operation failed', { code: 'ERR_001' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"code": "ERR_001"')
      );
    });
  });

  describe('success logging', () => {
    it('should log success messages', () => {
      logger.success('Operation completed');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SUCCESS]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation completed')
      );
    });

    it('should log metadata in verbose mode', () => {
      logger.setConfig({ verbose: true });
      logger.success('Operation completed', { records: 100 });

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('"records": 100')
      );
    });
  });

  describe('log level filtering', () => {
    it('should respect ERROR level - only errors', () => {
      logger.setConfig({ level: LogLevel.ERROR });

      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should respect WARN level - warnings and errors', () => {
      logger.setConfig({ level: LogLevel.WARN });

      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should respect INFO level - info, warnings, and errors', () => {
      logger.setConfig({ level: LogLevel.INFO });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should respect DEBUG level - all messages in verbose mode', () => {
      logger.setConfig({ level: LogLevel.DEBUG, verbose: true });

      logger.debug('Debug message');
      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration', () => {
    it('should use default configuration', () => {
      const defaultLogger = new Logger();

      defaultLogger.info('Test');
      expect(consoleLogSpy).toHaveBeenCalled();

      defaultLogger.debug('Test');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // No debug in non-verbose
    });

    it('should accept initial configuration', () => {
      const verboseLogger = new Logger({ verbose: true, level: LogLevel.DEBUG });

      verboseLogger.debug('Test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update configuration', () => {
      logger.setConfig({ verbose: false, level: LogLevel.DEBUG });
      logger.debug('Test 1');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.setConfig({ verbose: true, level: LogLevel.DEBUG });
      logger.debug('Test 2');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should partially update configuration', () => {
      logger.setConfig({ verbose: true, level: LogLevel.DEBUG });

      // Update only verbose
      logger.setConfig({ verbose: false });

      // Level should remain DEBUG
      logger.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined metadata', () => {
      logger.info('Message', undefined);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle empty metadata', () => {
      logger.setConfig({ verbose: true });
      logger.info('Message', {});
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle complex metadata objects', () => {
      logger.setConfig({ verbose: true });
      logger.info('Message', {
        nested: { key: 'value' },
        array: [1, 2, 3],
        null: null,
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Test error');
      error.stack = undefined;

      logger.setConfig({ verbose: true });
      logger.error('Failed', error);

      // Should not crash when stack is undefined
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
