# Enhanced Logger System

## Overview

The SlideHeroes application uses a sophisticated async logger system that provides structured logging, security
features, and monitoring integration. The logger is designed to be environment-aware, performant, and secure by default.

## Architecture

### Core Components

1. **Base Logger Interface** (`packages/shared/src/logger/logger.ts`)

   - Defines the standard `Logger` interface with methods: `info`, `error`, `warn`, `debug`, `fatal`
   - Each method supports multiple call signatures for flexibility

2. **Async Logger Registry** (`packages/shared/src/logger/index.ts`)

   - Uses a registry pattern for lazy loading of logger implementations
   - Supports multiple providers: "pino" (default) and "console"
   - Provider selection via `LOGGER` environment variable

3. **Enhanced Logger** (`packages/shared/src/logger/enhanced-logger.ts`)

   - Feature-rich implementation with:
     - Structured logging support
     - Automatic data sanitization
     - Request-scoped logging
     - Performance tracking helpers
     - Child logger creation

4. **Service Logger** (`packages/shared/src/logger/create-service-logger.ts`)
   - Recommended for service-level logging
   - Provides service name context
   - Returns `{ getLogger }` for async access

## Why Async?

The logger is async due to:

1. **Dynamic Imports**: Uses `await import()` for on-demand loading
2. **Registry Pattern**: Lazy initialization of logger implementations
3. **Monitoring Integration**: Supports async initialization of monitoring services
4. **Performance**: Avoids blocking during initialization

## Usage Patterns

### Basic Usage (Not Recommended)

```typescript
import { getLogger } from '@kit/shared/logger';

// In async context
const logger = await getLogger();
logger.info('Operation completed', { userId: '123' });
```

### Service Logger (Recommended)

```typescript
import { createServiceLogger } from '@kit/shared/logger';

// Create service-scoped logger
const { getLogger } = createServiceLogger('CERTIFICATE-SERVICE');

// In async function
export async function generateCertificate() {
  const logger = await getLogger();

  logger.info('Starting certificate generation', {
    operation: 'generate_certificate',
    userId: '123',
  });

  try {
    // ... operation code
  } catch (error) {
    logger.error('Certificate generation failed', {
      operation: 'generate_certificate',
      error,
    });
    throw error;
  }
}
```

### Enhanced Logger

```typescript
import { createEnhancedLogger } from '@kit/shared/logger';

const logger = createEnhancedLogger({
  serviceName: 'MY-SERVICE',
  logLevel: 'info',
  environment: 'production',
});

// Request-scoped logging
const requestLogger = logger.withRequest({
  requestId: 'req-123',
  userId: 'user-456',
});

// Performance tracking
const timer = logger.startTimer();
// ... operation
logger.info('Operation completed', {
  duration: timer.end(),
});
```

### Test Logger

```typescript
import { createTestLogger } from '@kit/shared/logger';

const { logger, logs } = createTestLogger();

// Use in tests
logger.error('Test error');
expect(logs.error).toHaveLength(1);
expect(logs.error[0]).toMatchObject({
  message: 'Test error',
});
```

## Security Features

### Automatic Data Sanitization

The logger automatically sanitizes sensitive fields:

- Passwords, tokens, secrets
- API keys, authentication data
- Credit card information
- Personal identifiable information

Sensitive values are replaced with "[REDACTED]".

### Configurable Sensitive Fields

```typescript
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'auth',
  'cookie',
  'session',
  'creditCard',
  'credit_card',
  'ssn',
  'socialSecurityNumber',
];
```

## Environment Configuration

### Log Level

- `LOG_LEVEL`: General log level (debug, info, warn, error, fatal)
- `API_LOG_LEVEL`: API-specific log level
- Default: "info" in production, "debug" in development

### Logger Provider

- `LOGGER`: Select logger implementation ("pino" or "console")
- Default: "pino"

### Output Format

- Development: Pretty-printed, colorized output
- Production: Structured JSON for log aggregation

## Migration from Console

### Before (Direct Console)

```typescript
console.error('Failed to parse content JSON:', error);
console.log('Processing user:', userId);
```

### After (Async Logger)

```typescript
const logger = await getLogger();
logger.error('Failed to parse content JSON:', error);
logger.info('Processing user', { userId });
```

### Client-Side Considerations

For client-side code ("use client"), you have two options:

1. **Keep Console for Simple Cases**

   ```typescript
   // For client-side debugging
   if (process.env.NODE_ENV === 'development') {
     console.error('Client error:', error);
   }
   ```

2. **Use Client-Safe Logger**

   ```typescript
   // Create a client-safe logger wrapper
   const logger = {
     info: (...args) => console.log(...args),
     error: (...args) => console.error(...args),
     warn: (...args) => console.warn(...args),
     debug: (...args) => console.debug(...args),
   };
   ```

## Testing with Async Logger

### Mock Setup

```typescript
import { vi } from 'vitest';

// Mock the logger module
vi.mock('@kit/shared/logger', () => ({
  createServiceLogger: vi.fn(() => ({
    getLogger: vi.fn(async () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
    })),
  })),
}));
```

### Test Example

```typescript
import { createServiceLogger } from '@kit/shared/logger';

describe('MyService', () => {
  it('should log errors', async () => {
    const mockLogger = {
      error: vi.fn(),
    };

    const mockGetLogger = vi.fn().mockResolvedValue(mockLogger);
    vi.mocked(createServiceLogger).mockReturnValue({
      getLogger: mockGetLogger,
    });

    // Run code that uses logger
    await myFunction();

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Expected error message',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
```

## Best Practices

1. **Always Use Service Logger**: Create service-specific loggers for better context
2. **Structure Your Logs**: Use objects for metadata, not string concatenation
3. **Include Operation Context**: Add operation names for easier debugging
4. **Handle Sensitive Data**: Let the logger sanitize automatically
5. **Use Appropriate Levels**:

   - `debug`: Detailed debugging information
   - `info`: General informational messages
   - `warn`: Warning messages
   - `error`: Error messages (recoverable)
   - `fatal`: Fatal errors (non-recoverable)

6. **Performance Considerations**:
   - Logger is cached after first initialization
   - Avoid logging in tight loops
   - Use debug level for verbose logging

## Common Patterns

### Error Handling

```typescript
try {
  // ... operation
} catch (error) {
  logger.error('Operation failed', {
    operation: 'operationName',
    error,
    context: {
      /* additional context */
    },
  });
  throw error; // Re-throw if needed
}
```

### Request Tracking

```typescript
logger.info('API request received', {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  requestId: req.id,
});
```

### Performance Monitoring

```typescript
const timer = logger.startTimer();
const result = await expensiveOperation();
logger.info('Operation completed', {
  operation: 'expensiveOperation',
  duration: timer.end(),
  resultSize: result.length,
});
```

## Monitoring Integration

The logger integrates with monitoring services through the `MonitoringService` interface:

- Automatic error tracking
- Performance metrics
- Custom event tracking
- User context association

## Troubleshooting

### Logger Not Working

1. Check if you're in an async context
2. Verify environment variables
3. Ensure proper imports

### Sensitive Data Visible

1. Check if field names match sanitization list
2. Consider adding custom sensitive fields
3. Verify logger configuration

### Performance Issues

1. Check log level (reduce in production)
2. Avoid synchronous logging in critical paths
3. Use child loggers for request scoping
