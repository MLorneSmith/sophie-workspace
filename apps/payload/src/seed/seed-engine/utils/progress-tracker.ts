/**
 * Progress tracking utility for Payload CMS Seeding Engine
 *
 * Provides real-time progress bars, collection reporting, and summary generation
 * with colored terminal output using chalk.
 *
 * @module seed-engine/utils/progress-tracker
 */

import chalk from 'chalk';
import type { BatchProcessorResult, SeedingSummary } from '../types';

/**
 * Progress tracker options
 */
export interface ProgressTrackerOptions {
  /** Enable verbose output with detailed per-record information */
  verbose: boolean;
  /** Quiet mode - minimal output */
  quiet: boolean;
  /** Width of progress bar in characters */
  progressBarWidth: number;
}

/**
 * Collection progress state
 */
interface CollectionProgress {
  name: string;
  current: number;
  total: number;
  startTime: number;
  successCount: number;
  failureCount: number;
}

/**
 * Progress tracker for seeding operations
 *
 * Displays real-time progress bars, collection statistics, and final summary.
 * Supports verbose and quiet modes for different use cases.
 *
 * @example
 * ```typescript
 * const tracker = new ProgressTracker({ verbose: false, quiet: false });
 *
 * tracker.startSeeding();
 * tracker.startCollection('courses', 5);
 *
 * for (let i = 1; i <= 5; i++) {
 *   await createRecord();
 *   tracker.updateProgress(i, 5);
 * }
 *
 * tracker.completeCollection({ collection: 'courses', successCount: 5, ... });
 * tracker.generateSummary([...results]);
 * ```
 */
export class ProgressTracker {
  private options: ProgressTrackerOptions;
  private startTime: number = 0;
  private currentCollection: CollectionProgress | null = null;
  private collectionResults: BatchProcessorResult[] = [];

  constructor(options: Partial<ProgressTrackerOptions> = {}) {
    this.options = {
      verbose: options.verbose ?? false,
      quiet: options.quiet ?? false,
      progressBarWidth: options.progressBarWidth ?? 20,
    };
  }

  /**
   * Start seeding operation with banner
   */
  startSeeding(): void {
    if (this.options.quiet) return;

    this.startTime = Date.now();
    this.collectionResults = [];

    console.log(
      chalk.cyan(
        '┌──────────────────────────────────────────────────┐',
      ),
    );
    console.log(
      chalk.cyan(
        '│ Payload CMS Seeding Engine                      │',
      ),
    );
    console.log(
      chalk.cyan(
        '└──────────────────────────────────────────────────┘',
      ),
    );
    console.log();
  }

  /**
   * Start tracking a collection
   *
   * @param name - Collection name
   * @param total - Total number of records to process
   */
  startCollection(name: string, total: number): void {
    this.currentCollection = {
      name,
      current: 0,
      total,
      startTime: Date.now(),
      successCount: 0,
      failureCount: 0,
    };

    if (this.options.verbose) {
      console.log(chalk.blue(`\nStarting collection: ${name} (${total} records)`));
    }
  }

  /**
   * Update progress for current collection
   *
   * @param current - Current record number (1-based)
   * @param total - Total records
   * @param success - Whether the record was successful (optional, for verbose mode)
   */
  updateProgress(current: number, total: number, success?: boolean): void {
    if (!this.currentCollection) return;

    this.currentCollection.current = current;

    // Update success/failure counts if provided
    if (success !== undefined) {
      if (success) {
        this.currentCollection.successCount++;
      } else {
        this.currentCollection.failureCount++;
      }
    }

    // Only render progress bar in non-quiet, non-verbose mode
    if (!this.options.quiet && !this.options.verbose) {
      this.renderProgressBar(this.currentCollection.name, current, total);
    } else if (this.options.verbose && success !== undefined) {
      const status = success ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} Record ${current}/${total}`);
    }
  }

  /**
   * Complete current collection with results
   *
   * @param result - Batch processing result
   */
  completeCollection(result: BatchProcessorResult): void {
    if (!this.currentCollection) return;

    // Store result for summary
    this.collectionResults.push(result);

    if (this.options.quiet) {
      this.currentCollection = null;
      return;
    }

    // Clear progress bar line
    if (!this.options.verbose) {
      process.stdout.write('\r\x1b[K');
    }

    // Format collection name with padding
    const namePadded = this.padRight(result.collection, 20);

    // Format duration
    const durationFormatted = this.formatDuration(result.totalDuration);

    // Success/failure indicators
    const successIcon = result.failureCount === 0 ? chalk.green('✓') : chalk.yellow('⚠');
    const successText = chalk.green(`${result.successCount} success`);
    const failureText =
      result.failureCount > 0
        ? chalk.red(`${result.failureCount} failed`)
        : `${result.failureCount} failed`;

    console.log(
      `${successIcon} ${namePadded}: ${successText}, ${failureText}, ${durationFormatted}`,
    );

    this.currentCollection = null;
  }

  /**
   * Generate and display final summary
   *
   * @param results - All collection results
   * @returns Summary object
   */
  generateSummary(results?: BatchProcessorResult[]): SeedingSummary {
    const allResults = results ?? this.collectionResults;
    const totalDuration = Date.now() - this.startTime;

    // Calculate totals
    const totalRecords = allResults.reduce(
      (sum, r) => sum + r.successCount + r.failureCount,
      0,
    );
    const successCount = allResults.reduce((sum, r) => sum + r.successCount, 0);
    const failureCount = allResults.reduce((sum, r) => sum + r.failureCount, 0);

    // Calculate average speed
    const averageSpeed =
      totalDuration > 0 ? totalRecords / (totalDuration / 1000) : 0;

    // Find slowest collections (top 3)
    const slowestCollections = [...allResults]
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 3)
      .map((r) => ({
        collection: r.collection,
        duration: r.totalDuration,
      }));

    const summary: SeedingSummary = {
      totalRecords,
      successCount,
      failureCount,
      totalDuration,
      averageSpeed,
      collectionResults: allResults,
      slowestCollections,
    };

    if (!this.options.quiet) {
      this.displaySummary(summary);
    }

    return summary;
  }

  /**
   * Render ASCII progress bar
   *
   * @param name - Collection name
   * @param current - Current progress
   * @param total - Total items
   */
  private renderProgressBar(name: string, current: number, total: number): void {
    const percentage = total > 0 ? Math.floor((current / total) * 100) : 0;
    const filledWidth = Math.floor(
      (current / total) * this.options.progressBarWidth,
    );
    const emptyWidth = this.options.progressBarWidth - filledWidth;

    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    const bar = `[${chalk.green(filled)}${chalk.gray(empty)}]`;

    const namePadded = this.padRight(name, 20);
    const progressText = `${current}/${total} (${percentage}%)`;

    // Overwrite current line
    process.stdout.write(`\r${namePadded} ${bar} ${progressText}`);

    // Add newline when complete
    if (current === total) {
      process.stdout.write('\n');
    }
  }

  /**
   * Display summary banner and statistics
   *
   * @param summary - Seeding summary
   */
  private displaySummary(summary: SeedingSummary): void {
    console.log();
    console.log(
      chalk.cyan(
        '┌──────────────────────────────────────────────────┐',
      ),
    );
    console.log(
      chalk.cyan(
        '│ Seeding Complete!                                │',
      ),
    );
    console.log(
      chalk.cyan(
        '└──────────────────────────────────────────────────┘',
      ),
    );
    console.log();
    console.log(chalk.bold('Summary:'));

    // Success/failure counts
    const successIcon = summary.failureCount === 0 ? '✓' : '⚠';
    const successColor = summary.failureCount === 0 ? chalk.green : chalk.yellow;
    console.log(
      successColor(`  ${successIcon} Success: ${summary.successCount}/${summary.totalRecords}`),
    );

    if (summary.failureCount > 0) {
      console.log(
        chalk.red(`  ✗ Failed:  ${summary.failureCount}/${summary.totalRecords}`),
      );
    }

    // Duration and speed
    console.log(`  ⏱  Duration: ${this.formatDurationSeconds(summary.totalDuration)}`);
    console.log(`  ⚡ Avg speed: ${summary.averageSpeed.toFixed(1)} records/s`);

    // Slowest collections (if verbose)
    if (this.options.verbose && summary.slowestCollections.length > 0) {
      console.log();
      console.log(chalk.bold('Slowest Collections:'));
      for (const slow of summary.slowestCollections) {
        const duration = this.formatDuration(slow.duration);
        console.log(`  - ${slow.collection}: ${duration}`);
      }
    }

    console.log();
  }

  /**
   * Format duration in milliseconds to human-readable string
   *
   * @param ms - Duration in milliseconds
   * @returns Formatted string (e.g., "245ms", "6.2s")
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  }

  /**
   * Format duration in milliseconds to seconds with precision
   *
   * @param ms - Duration in milliseconds
   * @returns Formatted string (e.g., "82.45s")
   */
  private formatDurationSeconds(ms: number): string {
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Pad string to the right with spaces
   *
   * @param str - String to pad
   * @param length - Target length
   * @returns Padded string
   */
  private padRight(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }

  /**
   * Log an error message
   *
   * @param message - Error message
   */
  error(message: string): void {
    console.error(chalk.red(`✗ ${message}`));
  }

  /**
   * Log a warning message
   *
   * @param message - Warning message
   */
  warn(message: string): void {
    if (!this.options.quiet) {
      console.warn(chalk.yellow(`⚠ ${message}`));
    }
  }

  /**
   * Log an info message
   *
   * @param message - Info message
   */
  info(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.blue(`ℹ ${message}`));
    }
  }

  /**
   * Log a success message
   *
   * @param message - Success message
   */
  success(message: string): void {
    if (!this.options.quiet) {
      console.log(chalk.green(`✓ ${message}`));
    }
  }

  /**
   * Log a verbose/debug message
   *
   * @param message - Debug message
   */
  debug(message: string): void {
    if (this.options.verbose) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  }
}
