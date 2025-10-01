/**
 * Error handling utility with retry logic for Payload seeding
 *
 * Provides:
 * - Error classification (transient, validation, critical)
 * - Exponential backoff with jitter
 * - Retry logic with configurable attempts
 * - Error grouping for reporting
 *
 * @module seed-engine/utils/error-handler
 */

import type { ErrorType, SeedingError, SeedRecord } from '../types';
import { DEFAULT_OPTIONS } from '../config';
import { logger } from './logger';

/**
 * Error handler configuration
 */
interface ErrorHandlerConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial retry delay in milliseconds */
  initialDelay: number;
  /** Maximum retry delay in milliseconds */
  maxDelay: number;
}

/**
 * Retry operation result
 */
interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result from successful operation */
  data?: T;
  /** Error from failed operation */
  error?: SeedingError;
  /** Number of retry attempts made */
  attempts: number;
}

/**
 * Error handler with retry logic and exponential backoff
 *
 * @example
 * ```typescript
 * const handler = new ErrorHandler({ maxRetries: 3 });
 *
 * // Retry an operation with exponential backoff
 * const result = await handler.withRetry(
 *   async () => await payload.create({ collection: 'courses', data }),
 *   { collection: 'courses', record: data }
 * );
 *
 * if (result.success) {
 *   console.log('Created record:', result.data);
 * } else {
 *   console.error('Failed after retries:', result.error);
 * }
 * ```
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorGroups: Map<string, SeedingError[]>;

  /**
   * Create a new error handler
   *
   * @param config - Error handler configuration
   */
  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? DEFAULT_OPTIONS.MAX_RETRIES,
      initialDelay: config.initialDelay ?? DEFAULT_OPTIONS.RETRY_DELAY_MS,
      maxDelay: config.maxDelay ?? DEFAULT_OPTIONS.MAX_RETRY_DELAY_MS,
    };
    this.errorGroups = new Map();
  }

  /**
   * Execute an operation with retry logic
   *
   * @param operation - Async operation to execute
   * @param context - Context for error reporting
   * @returns Result with success status and data or error
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: { collection: string; record?: SeedRecord }
  ): Promise<RetryResult<T>> {
    let lastError: SeedingError | undefined;
    let attempts = 0;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      attempts = attempt;
      try {
        const data = await operation();
        return { success: true, data, attempts };
      } catch (error) {
        const seedingError = this.classifyError(error, context);
        lastError = seedingError;

        // Log retry attempt
        if (attempt < this.config.maxRetries && this.isRetryable(seedingError.type)) {
          const delay = this.calculateBackoff(attempt);
          logger.warn(
            `Attempt ${attempt}/${this.config.maxRetries} failed, retrying in ${delay}ms`,
            {
              collection: context.collection,
              errorType: seedingError.type,
              message: seedingError.message,
            }
          );
          await this.sleep(delay);
        } else {
          // Non-retryable error or max retries reached
          logger.error(`Operation failed: ${seedingError.message}`, {
            collection: context.collection,
            errorType: seedingError.type,
            attempts,
          });
          break;
        }
      }
    }

    // Track error for reporting
    if (lastError) {
      this.addError(lastError);
    }

    return { success: false, error: lastError, attempts };
  }

  /**
   * Classify an error by type for retry logic
   *
   * @param error - Error to classify
   * @param context - Context for error reporting
   * @returns Structured seeding error
   */
  classifyError(
    error: unknown,
    context: { collection: string; record?: SeedRecord }
  ): SeedingError {
    const errorMessage = this.getErrorMessage(error);

    // Transient errors - retry with backoff
    if (this.isTransientError(errorMessage)) {
      return {
        type: 'transient',
        message: errorMessage,
        details: error,
        record: context.record,
        collection: context.collection,
      };
    }

    // Validation errors - skip record
    if (this.isValidationError(errorMessage)) {
      return {
        type: 'validation',
        message: errorMessage,
        details: error,
        record: context.record,
        collection: context.collection,
      };
    }

    // Critical errors - stop immediately
    return {
      type: 'critical',
      message: errorMessage,
      details: error,
      record: context.record,
      collection: context.collection,
    };
  }

  /**
   * Check if an error type is retryable
   *
   * @param errorType - Error type to check
   * @returns Whether the error should be retried
   */
  isRetryable(errorType: ErrorType): boolean {
    return errorType === 'transient';
  }

  /**
   * Calculate exponential backoff delay with jitter
   *
   * @param attempt - Current retry attempt number
   * @returns Delay in milliseconds
   */
  calculateBackoff(attempt: number): number {
    // Exponential backoff: initialDelay * 2^(attempt - 1)
    const exponentialDelay = this.config.initialDelay * Math.pow(2, attempt - 1);

    // Cap at maximum delay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);

    // Add jitter (±20% random variation)
    const jitter = cappedDelay * 0.2 * (Math.random() - 0.5);

    return Math.round(cappedDelay + jitter);
  }

  /**
   * Add error to tracking for reporting
   *
   * @param error - Error to track
   */
  addError(error: SeedingError): void {
    const key = `${error.collection}:${error.type}`;
    const existing = this.errorGroups.get(key) || [];
    existing.push(error);
    this.errorGroups.set(key, existing);
  }

  /**
   * Get all tracked errors grouped by collection and type
   *
   * @returns Map of error groups
   */
  getErrorGroups(): Map<string, SeedingError[]> {
    return new Map(this.errorGroups);
  }

  /**
   * Get error summary statistics
   *
   * @returns Error counts by type
   */
  getErrorSummary(): Record<ErrorType, number> {
    const summary: Record<ErrorType, number> = {
      transient: 0,
      validation: 0,
      critical: 0,
    };

    for (const errors of this.errorGroups.values()) {
      for (const error of errors) {
        summary[error.type]++;
      }
    }

    return summary;
  }

  /**
   * Clear all tracked errors
   */
  clearErrors(): void {
    this.errorGroups.clear();
  }

  /**
   * Extract error message from unknown error type
   *
   * @param error - Error object
   * @returns Error message string
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Unknown error';
  }

  /**
   * Check if error message indicates a transient error
   *
   * @param message - Error message
   * @returns Whether error is transient
   */
  private isTransientError(message: string): boolean {
    const transientPatterns = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
      'socket hang up',
      'network error',
      'timeout',
      'deadlock',
      'lock wait',
      'connection lost',
      'could not connect',
    ];

    const lowerMessage = message.toLowerCase();
    return transientPatterns.some((pattern) => lowerMessage.includes(pattern.toLowerCase()));
  }

  /**
   * Check if error message indicates a validation error
   *
   * @param message - Error message
   * @returns Whether error is validation-related
   */
  private isValidationError(message: string): boolean {
    const validationPatterns = [
      'validation',
      'invalid',
      'required field',
      'missing field',
      'unique constraint',
      'duplicate',
      'malformed',
      'format',
      'schema',
    ];

    const lowerMessage = message.toLowerCase();
    return validationPatterns.some((pattern) => lowerMessage.includes(pattern.toLowerCase()));
  }

  /**
   * Sleep for specified milliseconds
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default error handler instance
 */
export const errorHandler = new ErrorHandler();
