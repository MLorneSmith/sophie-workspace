/**
 * Standardized logging utilities for migration scripts
 * Provides consistent formatting and levels for all migration logs
 */
import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARNING = 3,
  ERROR = 4,
}

export class Logger {
  private context: string;
  private minLevel: LogLevel;

  constructor(context: string, minLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.minLevel = minLevel;
  }

  private log(level: LogLevel, message: string, details?: any): void {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}]` : '';

    let formattedMessage = `${timestamp} ${contextStr} `;

    switch (level) {
      case LogLevel.DEBUG:
        formattedMessage += chalk.gray(`DEBUG: ${message}`);
        break;
      case LogLevel.INFO:
        formattedMessage += chalk.white(`INFO: ${message}`);
        break;
      case LogLevel.SUCCESS:
        formattedMessage += chalk.green(`SUCCESS: ${message}`);
        break;
      case LogLevel.WARNING:
        formattedMessage += chalk.yellow(`WARNING: ${message}`);
        break;
      case LogLevel.ERROR:
        formattedMessage += chalk.red(`ERROR: ${message}`);
        break;
    }

    console.log(formattedMessage);

    if (details) {
      if (typeof details === 'object') {
        console.log(chalk.gray(JSON.stringify(details, null, 2)));
      } else {
        console.log(chalk.gray(details));
      }
    }
  }

  debug(message: string, details?: any): void {
    this.log(LogLevel.DEBUG, message, details);
  }

  info(message: string, details?: any): void {
    this.log(LogLevel.INFO, message, details);
  }

  success(message: string, details?: any): void {
    this.log(LogLevel.SUCCESS, message, details);
  }

  warning(message: string, details?: any): void {
    this.log(LogLevel.WARNING, message, details);
  }

  error(message: string, details?: any): void {
    this.log(LogLevel.ERROR, message, details);
  }

  // Create a child logger with a sub-context
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`, this.minLevel);
  }

  // Set the minimum log level
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

// Default logger instance
export const createLogger = (
  context: string,
  minLevel: LogLevel = LogLevel.INFO,
): Logger => {
  return new Logger(context, minLevel);
};

// Helper function to get a simple scoped logger
export function getLogger(scope: string): Logger {
  return createLogger(scope);
}

// Usage example:
// const logger = getLogger('BlogPostMigration');
// logger.info('Starting migration process');
// logger.success('Successfully migrated 5 posts');
// logger.warning('Some posts already exist', { count: 3 });
// logger.error('Failed to migrate post', { slug: 'example', error: 'Database error' });
