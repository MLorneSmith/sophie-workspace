// Error type guards
export function isAuthError(error: Error): boolean {
  return (
    error.message.includes('auth') ||
    error.message.includes('authentication') ||
    error.message.includes('session') ||
    error.message.includes('unauthorized')
  );
}

export function isConnectionError(error: Error): boolean {
  return (
    error.message.includes('network') ||
    error.message.includes('connection') ||
    error.message.includes('offline') ||
    error.message.includes('failed to fetch')
  );
}

export function isValidationError(error: Error): boolean {
  return (
    error.message.includes('validation') ||
    error.message.includes('invalid') ||
    error.message.includes('required')
  );
}

// Error classes
export class SetupFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SetupFormError';
  }
}

export class ValidationError extends SetupFormError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SubmissionError extends SetupFormError {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionError';
  }
}
