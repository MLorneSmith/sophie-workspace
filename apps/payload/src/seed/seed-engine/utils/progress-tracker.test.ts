/**
 * Unit tests for progress tracker utility
 *
 * @module seed-engine/utils/progress-tracker.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock chalk before importing ProgressTracker
vi.mock('chalk', () => ({
  default: {
    cyan: (str: string) => str,
    green: (str: string) => str,
    red: (str: string) => str,
    yellow: (str: string) => str,
    blue: (str: string) => str,
    gray: (str: string) => str,
    bold: (str: string) => str,
  },
}));

import { ProgressTracker } from './progress-tracker';
import type { BatchProcessorResult } from '../types';

describe('ProgressTracker', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true) as any;
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create tracker with default options', () => {
      const tracker = new ProgressTracker();
      expect(tracker).toBeInstanceOf(ProgressTracker);
    });

    it('should create tracker with custom options', () => {
      const tracker = new ProgressTracker({
        verbose: true,
        quiet: false,
        progressBarWidth: 30,
      });
      expect(tracker).toBeInstanceOf(ProgressTracker);
    });

    it('should handle partial options with defaults', () => {
      const tracker = new ProgressTracker({ verbose: true });
      expect(tracker).toBeInstanceOf(ProgressTracker);
    });
  });

  describe('startSeeding', () => {
    it('should display banner in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.startSeeding();

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Payload CMS Seeding Engine');
    });

    it('should not display banner in quiet mode', () => {
      const tracker = new ProgressTracker({ quiet: true });
      tracker.startSeeding();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('startCollection', () => {
    it('should start tracking a collection in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('courses', 5);

      // Should not log in normal mode (only verbose)
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should display collection info in verbose mode', () => {
      const tracker = new ProgressTracker({ verbose: true });
      tracker.startCollection('courses', 5);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('Starting collection: courses');
      expect(output).toContain('5 records');
    });
  });

  describe('updateProgress', () => {
    it('should render progress bar in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('courses', 5);
      tracker.updateProgress(2, 5);

      expect(stdoutWriteSpy).toHaveBeenCalled();
      const output = stdoutWriteSpy.mock.calls[0][0] as string;
      expect(output).toContain('courses');
      expect(output).toContain('2/5');
      expect(output).toContain('40%');
    });

    it('should display detailed record info in verbose mode', () => {
      const tracker = new ProgressTracker({ verbose: true });
      tracker.startCollection('courses', 5);

      consoleLogSpy.mockClear(); // Clear the "Starting collection" log
      tracker.updateProgress(1, 5, true);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('Record 1/5');
    });

    it('should not display anything in quiet mode', () => {
      const tracker = new ProgressTracker({ quiet: true });
      tracker.startCollection('courses', 5);
      tracker.updateProgress(2, 5);

      expect(stdoutWriteSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle progress without active collection', () => {
      const tracker = new ProgressTracker();
      // Should not throw
      expect(() => tracker.updateProgress(1, 5)).not.toThrow();
    });

    it('should update success count when success is true', () => {
      const tracker = new ProgressTracker({ verbose: true });
      tracker.startCollection('courses', 3);

      tracker.updateProgress(1, 3, true);
      tracker.updateProgress(2, 3, true);
      tracker.updateProgress(3, 3, false);

      // Verify counts through completeCollection
      const result: BatchProcessorResult = {
        collection: 'courses',
        successCount: 2,
        failureCount: 1,
        results: [],
        totalDuration: 1000,
      };

      tracker.completeCollection(result);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should render 100% when progress is complete', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('courses', 5);
      tracker.updateProgress(5, 5);

      const output = stdoutWriteSpy.mock.calls[0][0] as string;
      expect(output).toContain('5/5');
      expect(output).toContain('100%');
    });

    it('should handle zero total gracefully', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('empty', 0);
      tracker.updateProgress(0, 0);

      const output = stdoutWriteSpy.mock.calls[0][0] as string;
      expect(output).toContain('0/0');
    });
  });

  describe('completeCollection', () => {
    it('should display completion summary in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('courses', 5);

      const result: BatchProcessorResult = {
        collection: 'courses',
        successCount: 5,
        failureCount: 0,
        results: [],
        totalDuration: 245,
      };

      tracker.completeCollection(result);

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('courses');
      expect(output).toContain('5 success');
      expect(output).toContain('0 failed');
      expect(output).toContain('245ms');
    });

    it('should format duration correctly for long operations', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('course-lessons', 25);

      const result: BatchProcessorResult = {
        collection: 'course-lessons',
        successCount: 25,
        failureCount: 0,
        results: [],
        totalDuration: 6210,
      };

      tracker.completeCollection(result);

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('6.2s');
    });

    it('should highlight failures with warning icon', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('courses', 5);

      const result: BatchProcessorResult = {
        collection: 'courses',
        successCount: 3,
        failureCount: 2,
        results: [],
        totalDuration: 1000,
      };

      tracker.completeCollection(result);

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('3 success');
      expect(output).toContain('2 failed');
    });

    it('should not display anything in quiet mode', () => {
      const tracker = new ProgressTracker({ quiet: true });
      tracker.startCollection('courses', 5);

      const result: BatchProcessorResult = {
        collection: 'courses',
        successCount: 5,
        failureCount: 0,
        results: [],
        totalDuration: 245,
      };

      tracker.completeCollection(result);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle completion without active collection', () => {
      const tracker = new ProgressTracker();

      const result: BatchProcessorResult = {
        collection: 'courses',
        successCount: 5,
        failureCount: 0,
        results: [],
        totalDuration: 245,
      };

      // Should not throw
      expect(() => tracker.completeCollection(result)).not.toThrow();
    });
  });

  describe('generateSummary', () => {
    it('should calculate totals correctly', () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'courses',
          successCount: 1,
          failureCount: 0,
          results: [],
          totalDuration: 245,
        },
        {
          collection: 'course-lessons',
          successCount: 25,
          failureCount: 0,
          results: [],
          totalDuration: 6210,
        },
      ];

      const tracker = new ProgressTracker();
      tracker.startSeeding();
      const summary = tracker.generateSummary(results);

      expect(summary.totalRecords).toBe(26);
      expect(summary.successCount).toBe(26);
      expect(summary.failureCount).toBe(0);
    });

    it('should calculate average speed correctly', async () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'courses',
          successCount: 10,
          failureCount: 0,
          results: [],
          totalDuration: 1000,
        },
      ];

      const tracker = new ProgressTracker();
      tracker.startSeeding();

      // Wait a bit for realistic timing
      await new Promise(resolve => setTimeout(resolve, 10));

      const summary = tracker.generateSummary(results);

      expect(summary.averageSpeed).toBeGreaterThan(0);
    });

    it('should identify slowest collections', () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'fast',
          successCount: 5,
          failureCount: 0,
          results: [],
          totalDuration: 100,
        },
        {
          collection: 'medium',
          successCount: 10,
          failureCount: 0,
          results: [],
          totalDuration: 500,
        },
        {
          collection: 'slow',
          successCount: 20,
          failureCount: 0,
          results: [],
          totalDuration: 2000,
        },
        {
          collection: 'slowest',
          successCount: 15,
          failureCount: 0,
          results: [],
          totalDuration: 3000,
        },
      ];

      const tracker = new ProgressTracker();
      tracker.startSeeding();
      const summary = tracker.generateSummary(results);

      expect(summary.slowestCollections).toHaveLength(3);
      expect(summary.slowestCollections[0].collection).toBe('slowest');
      expect(summary.slowestCollections[1].collection).toBe('slow');
      expect(summary.slowestCollections[2].collection).toBe('medium');
    });

    it('should display summary banner in normal mode', () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'courses',
          successCount: 316,
          failureCount: 0,
          results: [],
          totalDuration: 82450,
        },
      ];

      const tracker = new ProgressTracker();
      tracker.startSeeding();
      tracker.generateSummary(results);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Seeding Complete!');
      expect(output).toContain('Success: 316/316');
      expect(output).toContain('Duration:');
      expect(output).toContain('Avg speed:');
    });

    it('should not display summary in quiet mode', () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'courses',
          successCount: 10,
          failureCount: 0,
          results: [],
          totalDuration: 1000,
        },
      ];

      consoleLogSpy.mockClear();

      const tracker = new ProgressTracker({ quiet: true });
      tracker.startSeeding();
      tracker.generateSummary(results);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should display slowest collections in verbose mode', () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'slow1',
          successCount: 10,
          failureCount: 0,
          results: [],
          totalDuration: 3000,
        },
        {
          collection: 'slow2',
          successCount: 10,
          failureCount: 0,
          results: [],
          totalDuration: 2000,
        },
      ];

      const tracker = new ProgressTracker({ verbose: true });
      tracker.startSeeding();
      tracker.generateSummary(results);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Slowest Collections:');
      expect(output).toContain('slow1');
      expect(output).toContain('slow2');
    });

    it('should handle failures in summary', () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'courses',
          successCount: 8,
          failureCount: 2,
          results: [],
          totalDuration: 1000,
        },
      ];

      const tracker = new ProgressTracker();
      tracker.startSeeding();
      const summary = tracker.generateSummary(results);

      expect(summary.failureCount).toBe(2);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('Failed:  2/10');
    });

    it('should handle empty results', () => {
      const tracker = new ProgressTracker();
      tracker.startSeeding();
      const summary = tracker.generateSummary([]);

      expect(summary.totalRecords).toBe(0);
      expect(summary.successCount).toBe(0);
      expect(summary.failureCount).toBe(0);
    });

    it('should use stored results if none provided', () => {
      const tracker = new ProgressTracker();
      tracker.startSeeding();
      tracker.startCollection('courses', 5);

      const result: BatchProcessorResult = {
        collection: 'courses',
        successCount: 5,
        failureCount: 0,
        results: [],
        totalDuration: 245,
      };

      tracker.completeCollection(result);
      const summary = tracker.generateSummary();

      expect(summary.totalRecords).toBe(5);
      expect(summary.collectionResults).toHaveLength(1);
    });
  });

  describe('logging methods', () => {
    it('should log error messages', () => {
      const tracker = new ProgressTracker();
      tracker.error('Test error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain('Test error');
    });

    it('should log warning messages in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.warn('Test warning');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const output = consoleWarnSpy.mock.calls[0][0];
      expect(output).toContain('Test warning');
    });

    it('should not log warnings in quiet mode', () => {
      const tracker = new ProgressTracker({ quiet: true });
      tracker.warn('Test warning');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should log info messages in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.info('Test info');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('Test info');
    });

    it('should not log info in quiet mode', () => {
      const tracker = new ProgressTracker({ quiet: true });
      tracker.info('Test info');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log success messages in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.success('Test success');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('Test success');
    });

    it('should not log success in quiet mode', () => {
      const tracker = new ProgressTracker({ quiet: true });
      tracker.success('Test success');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log debug messages in verbose mode', () => {
      const tracker = new ProgressTracker({ verbose: true });
      tracker.debug('Test debug');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('[DEBUG]');
      expect(output).toContain('Test debug');
    });

    it('should not log debug in normal mode', () => {
      const tracker = new ProgressTracker();
      tracker.debug('Test debug');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('progress bar rendering', () => {
    it('should render progress bar with correct percentage', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('test', 10);
      tracker.updateProgress(5, 10);

      const output = stdoutWriteSpy.mock.calls[0][0] as string;
      expect(output).toContain('50%');
    });

    it('should render progress bar with custom width', () => {
      const tracker = new ProgressTracker({ progressBarWidth: 40 });
      tracker.startCollection('test', 10);
      tracker.updateProgress(5, 10);

      const output = stdoutWriteSpy.mock.calls[0][0] as string;
      // Should contain more bar characters with larger width
      expect(output.length).toBeGreaterThan(50);
    });

    it('should pad collection names consistently', () => {
      const tracker = new ProgressTracker();

      tracker.startCollection('short', 10);
      tracker.updateProgress(5, 10);
      const output1 = stdoutWriteSpy.mock.calls[0][0] as string;

      stdoutWriteSpy.mockClear();

      tracker.startCollection('very-long-name-here', 10);
      tracker.updateProgress(5, 10);
      const output2 = stdoutWriteSpy.mock.calls[0][0] as string;

      // Both should have padded names
      expect(output1).toContain('short');
      expect(output2).toContain('very-long-name-here');
    });

    it('should add newline when progress is complete', () => {
      const tracker = new ProgressTracker();
      tracker.startCollection('test', 5);
      tracker.updateProgress(5, 5);

      // Progress bar writes \n in a single write call at the end
      expect(stdoutWriteSpy).toHaveBeenCalled();
      const lastWrite = stdoutWriteSpy.mock.calls[stdoutWriteSpy.mock.calls.length - 1][0] as string;
      // When complete, the write includes a newline
      expect(lastWrite).toMatch(/\n$/);
    });
  });

  describe('duration formatting', () => {
    it('should format short durations in milliseconds', () => {
      const tracker = new ProgressTracker();
      tracker.startSeeding();
      tracker.startCollection('test', 1);

      consoleLogSpy.mockClear(); // Clear banner logs

      const result: BatchProcessorResult = {
        collection: 'test',
        successCount: 1,
        failureCount: 0,
        results: [],
        totalDuration: 245,
      };

      tracker.completeCollection(result);

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('245ms');
    });

    it('should format long durations in seconds', () => {
      const tracker = new ProgressTracker();
      tracker.startSeeding();
      tracker.startCollection('test', 1);

      consoleLogSpy.mockClear(); // Clear banner logs

      const result: BatchProcessorResult = {
        collection: 'test',
        successCount: 1,
        failureCount: 0,
        results: [],
        totalDuration: 6210,
      };

      tracker.completeCollection(result);

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('6.2s');
    });

    it('should format summary duration with precision', () => {
      const results: BatchProcessorResult[] = [
        {
          collection: 'test',
          successCount: 10,
          failureCount: 0,
          results: [],
          totalDuration: 82450,
        },
      ];

      const tracker = new ProgressTracker();
      tracker.startSeeding();
      tracker.generateSummary(results);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toMatch(/\d+\.\d{2}s/);
    });
  });
});
