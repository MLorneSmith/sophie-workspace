export class CourseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseError';
  }
}

export class AuthError extends CourseError {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthError';
  }
}

export class ContentError extends CourseError {
  constructor(message = 'Content not found or invalid') {
    super(message);
    this.name = 'ContentError';
  }
}

export class DatabaseError extends CourseError {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends CourseError {
  constructor(message = 'Invalid data provided') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends CourseError {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class CMSError extends CourseError {
  constructor(message = 'CMS operation failed') {
    super(message);
    this.name = 'CMSError';
  }
}

// Type guard functions
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isContentError(error: unknown): error is ContentError {
  return error instanceof ContentError;
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isCMSError(error: unknown): error is CMSError {
  return error instanceof CMSError;
}

// Helper function to wrap errors
export function wrapError(
  error: unknown,
  defaultMessage = 'An error occurred',
): CourseError {
  if (error instanceof CourseError) {
    return error;
  }

  if (error instanceof Error) {
    // Check error message patterns to determine type
    if (
      error.message.includes('authentication') ||
      error.message.includes('unauthorized')
    ) {
      return new AuthError(error.message);
    }
    if (error.message.includes('not found')) {
      return new ContentError(error.message);
    }
    if (error.message.includes('database') || error.message.includes('query')) {
      return new DatabaseError(error.message);
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new NetworkError(error.message);
    }
    if (error.message.includes('cms') || error.message.includes('content')) {
      return new CMSError(error.message);
    }

    return new CourseError(error.message);
  }

  if (typeof error === 'string') {
    return new CourseError(error);
  }

  return new CourseError(defaultMessage);
}

// Helper function to create error messages for users
export function getUserFriendlyErrorMessage(error: unknown): string {
  const wrappedError = wrapError(error);

  switch (wrappedError.constructor) {
    case AuthError:
      return 'Please sign in to access this content.';
    case ContentError:
      return 'The requested content could not be found. Please try again later.';
    case DatabaseError:
      return 'There was a problem accessing your data. Please try again later.';
    case ValidationError:
      return 'The provided information is invalid. Please check your input and try again.';
    case NetworkError:
      return 'There was a problem connecting to the server. Please check your internet connection and try again.';
    case CMSError:
      return 'There was a problem loading the content. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}
