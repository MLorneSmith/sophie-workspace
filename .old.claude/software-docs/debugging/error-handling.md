# Error Handling Debugging Guide

This guide provides systematic approaches for AI coding assistants to debug error handling issues and implement robust error management.

## Error Debugging Methodology

### 1. Error Classification

```typescript
interface ErrorContext {
  type: 'runtime' | 'network' | 'validation' | 'business' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  userFacing: boolean;
  source: string;
  timestamp: Date;
  context: Record<string, unknown>;
}
```

### 2. Error Investigation Process

1. **Capture complete error information**: Stack trace, context, user actions
2. **Reproduce consistently**: Create reliable reproduction steps
3. **Trace error propagation**: Follow how errors bubble up
4. **Identify root cause**: Distinguish symptoms from actual cause
5. **Implement comprehensive fix**: Address root cause and improve error handling

## Common Error Patterns

### Pattern 1: Unhandled Promise Rejections

**Symptoms:**

- `UnhandledPromiseRejectionWarning` in Node.js
- Silent failures in async operations
- Inconsistent application state

**Investigation Steps:**

```typescript
// Add global handlers to catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log to error tracking service
  errorTracker.captureException(reason, {
    tags: { type: 'unhandled_rejection' },
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  errorTracker.captureException(event.reason);
});
```

**Common Fixes:**

```typescript
// Always handle promise rejections
const fetchUserData = async (userId: string) => {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch user data', { userId, error });
    throw new UserFetchError('Unable to load user data', { cause: error });
  }
};

// Use proper error boundaries in React
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorTracker.captureException(error, {
      contexts: { react: errorInfo }
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Pattern 2: Network Error Handling

**Symptoms:**

- Failed API calls without user feedback
- Inconsistent retry behavior
- Poor offline experience

**Investigation Steps:**

1. **Check network conditions**: Test with slow/unreliable connections
2. **Examine retry logic**: Verify exponential backoff implementation
3. **Review timeout handling**: Ensure appropriate timeout values
4. **Test offline scenarios**: Verify offline/online state handling

**Robust Network Error Handling:**

```typescript
class ApiClient {
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    retries = 3,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          await response.text(),
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timed out');
      }

      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(Math.pow(2, 4 - retries) * 1000); // Exponential backoff
        return this.makeRequest(url, options, retries - 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: Error): boolean {
    return (
      error instanceof TimeoutError ||
      (error instanceof ApiError && error.status >= 500)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Pattern 3: Validation Error Handling

**Symptoms:**

- Poor user experience with validation errors
- Inconsistent validation between client and server
- Security vulnerabilities from insufficient validation

**Investigation Steps:**

1. **Review validation logic**: Check both client and server validation
2. **Test edge cases**: Invalid inputs, boundary conditions
3. **Examine error messages**: Ensure they're helpful and secure
4. **Check error display**: Verify errors are shown to users appropriately

**Comprehensive Validation:**

```typescript
// Schema-based validation with detailed errors
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  age: z
    .number()
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Please enter a valid age'),
});

const validateUser = (data: unknown) => {
  try {
    return userSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.reduce(
        (acc, err) => {
          const field = err.path.join('.');
          acc[field] = err.message;
          return acc;
        },
        {} as Record<string, string>,
      );

      throw new ValidationError('Validation failed', fieldErrors);
    }
    throw error;
  }
};

// Form error handling
const useFormWithValidation = (schema: z.ZodSchema) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (data: unknown) => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      }
      return false;
    }
  };

  return { errors, validate };
};
```

### Pattern 4: Error Boundary and Fallback Handling

**Symptoms:**

- White screen of death
- Entire app crashes from component errors
- Poor error recovery experience

**Investigation Steps:**

1. **Identify error boundaries**: Check if components are properly wrapped
2. **Test error scenarios**: Trigger errors in different components
3. **Review fallback UI**: Ensure fallbacks are helpful and actionable
4. **Check error reporting**: Verify errors are being tracked

**Comprehensive Error Boundaries:**

```typescript
// Granular error boundaries
const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// Specialized error fallbacks
const ApiErrorFallback = ({ error, retry }: ErrorFallbackProps) => (
  <div className="error-container">
    <h3>Unable to load data</h3>
    <p>We're having trouble connecting to our servers.</p>
    <button onClick={retry}>Try Again</button>
    <details>
      <summary>Technical Details</summary>
      <pre>{error.message}</pre>
    </details>
  </div>
);

const ChunkErrorFallback = ({ error, retry }: ErrorFallbackProps) => (
  <div className="error-container">
    <h3>App Update Available</h3>
    <p>Please refresh the page to get the latest version.</p>
    <button onClick={() => window.location.reload()}>Refresh</button>
  </div>
);
```

## Error Tracking and Monitoring

### 1. Structured Error Logging

```typescript
interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: Error;
  context: {
    userId?: string;
    sessionId: string;
    url: string;
    userAgent: string;
    buildVersion: string;
  };
  tags: Record<string, string>;
  fingerprint?: string;
}

class ErrorLogger {
  log(
    level: ErrorLog['level'],
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ) {
    const errorLog: ErrorLog = {
      id: generateId(),
      timestamp: new Date(),
      level,
      message,
      error,
      context: {
        ...this.getDefaultContext(),
        ...context,
      },
      tags: this.extractTags(error),
      fingerprint: this.generateFingerprint(error, message),
    };

    this.sendToService(errorLog);
  }

  private generateFingerprint(error?: Error, message?: string): string {
    const key = error?.stack || message || 'unknown';
    return btoa(key).slice(0, 16);
  }
}
```

### 2. Error Metrics and Alerting

```typescript
// Error rate monitoring
class ErrorMetrics {
  private errorCounts = new Map<string, number>();

  recordError(type: string, severity: string) {
    const key = `${type}:${severity}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    // Alert on high error rates
    if (this.errorCounts.get(key)! > this.getThreshold(severity)) {
      this.sendAlert(type, severity, this.errorCounts.get(key)!);
    }
  }

  private getThreshold(severity: string): number {
    const thresholds = {
      critical: 1,
      high: 5,
      medium: 20,
      low: 50,
    };
    return thresholds[severity] || 10;
  }
}
```

## Error Recovery Strategies

### 1. Graceful Degradation

```typescript
// Feature flags for graceful degradation
const useFeatureWithFallback = (featureKey: string, fallback: () => JSX.Element) => {
  const [hasError, setHasError] = useState(false);
  const isEnabled = useFeatureFlag(featureKey);

  if (!isEnabled || hasError) {
    return fallback;
  }

  return (Component: React.ComponentType) => (props: any) => (
    <ErrorBoundary onError={() => setHasError(true)}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// Progressive enhancement
const EnhancedComponent = () => {
  const [enhancementLoaded, setEnhancementLoaded] = useState(false);

  useEffect(() => {
    import('./enhancement').then(() => {
      setEnhancementLoaded(true);
    }).catch(error => {
      logger.warn('Enhancement failed to load', { error });
      // Continue with basic functionality
    });
  }, []);

  return enhancementLoaded ? <EnhancedView /> : <BasicView />;
};
```

### 2. Retry Mechanisms

```typescript
// Exponential backoff with jitter
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) break;

      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * delay;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
};

// React hook for retryable operations
const useRetryableOperation = <T>(
  operation: () => Promise<T>,
  dependencies: any[] = [],
) => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
    retryCount: number;
  }>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await retryWithBackoff(operation);
      setState((prev) => ({ ...prev, data: result, loading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as Error,
        loading: false,
        retryCount: prev.retryCount + 1,
      }));
    }
  }, dependencies);

  const retry = () => execute();

  return { ...state, execute, retry };
};
```

## Best Practices for AI Assistants

### 1. Error Prevention

- Implement comprehensive input validation
- Use TypeScript for compile-time error detection
- Add proper error boundaries at component boundaries
- Test error scenarios systematically

### 2. Error Detection

- Monitor error rates and patterns
- Set up alerting for critical errors
- Use structured logging for better debugging
- Implement health checks for system components

### 3. Error Recovery

- Provide meaningful error messages to users
- Implement retry mechanisms for transient failures
- Design fallback experiences for critical features
- Enable graceful degradation when possible

### 4. Error Learning

- Analyze error patterns to prevent similar issues
- Update error handling based on production incidents
- Document common error scenarios and solutions
- Share error handling patterns across the team
