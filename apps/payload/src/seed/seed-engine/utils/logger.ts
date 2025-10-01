/**
 * Colored logging utility for Payload seeding engine
 *
 * Provides colored terminal output with multiple log levels:
 * - INFO: Cyan - General information and progress
 * - DEBUG: Gray - Detailed debugging information
 * - WARN: Yellow - Warnings and non-critical issues
 * - ERROR: Red - Critical errors
 *
 * @module seed-engine/utils/logger
 */

import chalk from 'chalk';

/**
 * Log level enumeration
 */
export enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Enable verbose mode (shows DEBUG level logs) */
  verbose: boolean;
  /** Minimum log level to display */
  level: LogLevel;
}

/**
 * Colored logger with multiple levels
 *
 * @example
 * ```typescript
 * const logger = new Logger({ verbose: true, level: LogLevel.DEBUG });
 * logger.info('Starting seeding process...');
 * logger.debug('Loading collection: courses');
 * logger.warn('Missing optional field: description');
 * logger.error('Failed to create record', new Error('Connection lost'));
 * ```
 */
export class Logger {
  private config: LoggerConfig;

  /**
   * Create a new logger instance
   *
   * @param config - Logger configuration
   */
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      verbose: config.verbose ?? false,
      level: config.level ?? LogLevel.INFO,
    };
  }

  /**
   * Log informational message (cyan color)
   *
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const timestamp = this.getTimestamp();
      console.log(chalk.cyan(`[INFO] ${timestamp} ${message}`));
      if (meta && this.config.verbose) {
        console.log(chalk.cyan(JSON.stringify(meta, null, 2)));
      }
    }
  }

  /**
   * Log debug message (gray color)
   * Only shown when verbose mode is enabled
   *
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.config.verbose) {
      const timestamp = this.getTimestamp();
      console.log(chalk.gray(`[DEBUG] ${timestamp} ${message}`));
      if (meta) {
        console.log(chalk.gray(JSON.stringify(meta, null, 2)));
      }
    }
  }

  /**
   * Log warning message (yellow color)
   *
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const timestamp = this.getTimestamp();
      console.warn(chalk.yellow(`[WARN] ${timestamp} ${message}`));
      if (meta && this.config.verbose) {
        console.warn(chalk.yellow(JSON.stringify(meta, null, 2)));
      }
    }
  }

  /**
   * Log error message (red color)
   *
   * @param message - Message to log
   * @param error - Error object or metadata
   */
  error(message: string, error?: Error | Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const timestamp = this.getTimestamp();
      console.error(chalk.red(`[ERROR] ${timestamp} ${message}`));

      if (error) {
        if (error instanceof Error) {
          console.error(chalk.red(`  ${error.message}`));
          if (this.config.verbose && error.stack) {
            console.error(chalk.red(error.stack));
          }
        } else {
          console.error(chalk.red(JSON.stringify(error, null, 2)));
        }
      }
    }
  }

  /**
   * Log success message (green color)
   *
   * @param message - Message to log
   * @param meta - Optional metadata to include
   */
  success(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const timestamp = this.getTimestamp();
      console.log(chalk.green(`[SUCCESS] ${timestamp} ${message}`));
      if (meta && this.config.verbose) {
        console.log(chalk.green(JSON.stringify(meta, null, 2)));
      }
    }
  }

  /**
   * Update logger configuration
   *
   * @param config - Partial configuration to update
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if a log level should be displayed
   *
   * @param level - Log level to check
   * @returns Whether the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.config.level);
    const requestedIndex = levels.indexOf(level);

    // If current level is DEBUG (0), show all levels
    // If current level is INFO (1), show INFO, WARN, ERROR
    // If current level is WARN (2), show WARN, ERROR
    // If current level is ERROR (3), show ERROR only
    return requestedIndex >= currentIndex;
  }

  /**
   * Get formatted timestamp
   *
   * @returns ISO timestamp string
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }
}

/**
 * Default logger instance with standard configuration
 */
export const logger = new Logger();
