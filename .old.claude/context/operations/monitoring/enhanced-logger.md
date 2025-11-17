---
# Identity
id: "enhanced-logger"
title: "Enhanced Logger System"
version: "2.1.0"
category: "implementation"

# Discovery
description: "Async logging system with structured output, security features, monitoring integration, and Biome compliance for SlideHeroes"
tags: ["logging", "async", "pino", "monitoring", "security", "biome", "testing"]

# Relationships
dependencies: ["monitoring-core", "supabase", "zod"]
cross_references:
  - id: "monitoring-integration"
    type: "related"
    description: "Integration with monitoring services"
  - id: "server-actions"
    type: "pattern"
    description: "Server action patterns that use logging"

# Maintenance
created: "2025-01-13"
last_updated: "2025-09-15"
author: "create-context"
---

# Enhanced Logger System

## Overview

SlideHeroes uses an async logger system with structured logging, automatic security features, and monitoring integration. Built on Pino (3-5x faster than alternatives), it's environment-aware, secure by default, and compliant with strict Biome linting rules.

## Architecture

### Core Components

1. **Base Logger Interface** (`packages/shared/src/logger/logger.ts`)
   - Standard interface: `info`, `error`, `warn`, `debug`, `fatal`
   - Multiple call signatures for flexibility

2. **Async Logger Registry** (`packages/shared/src/logger/index.ts`)
   - Registry pattern for lazy loading
   - Providers: "pino" (default) and "console"
   - Provider selection via `LOGGER` environment variable

3. **Enhanced Logger** (`packages/shared/src/logger/enhanced-logger.ts`)
   - Structured logging support
   - Automatic data sanitization
   - Request-scoped logging via `forRequest()`
   - Child logger creation via `child()`
   - Monitoring integration

4. **Service Logger** (`packages/shared/src/logger/create-service-logger.ts`)
   - **Recommended approach** for service-level logging
   - Provides service name context
   - Returns `{ getLogger }` for async access

5. **Monitored Logger** (`packages/shared/src/logger/create-monitored-logger.ts`)
   - Automatic monitoring service integration
   - Graceful fallback on monitoring failure

### Why Async?

- **Dynamic Imports**: Uses `await import()` for code splitting
- **Registry Pattern**: Lazy initialization prevents startup blocking
- **Monitoring Integration**: Supports async service initialization
- **Performance**: Avoids event loop blocking

## Usage Patterns

### Service Logger (Recommended)

```typescript
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('CERTIFICATE-SERVICE');

export async function generateCertificate(userId: string) {
  const logger = await getLogger();

  logger.info('Starting certificate generation', {
    operation: 'generate_certificate',
    userId,
  });

  try {
    const result = await performGeneration();
    logger.info('Certificate generated successfully', {
      operation: 'generate_certificate',
      userId,
      certificateId: result.id,
    });
    return result;
  } catch (error) {
    logger.error('Certificate generation failed', {
      operation: 'generate_certificate',
      userId,
      error,
    });
    throw error;
  }
}
```

### Enhanced Logger Direct Usage

```typescript
import { createEnhancedLogger } from '@kit/shared/logger';

const logger = createEnhancedLogger({
  serviceName: 'MY-SERVICE',
  logLevel: 'info',
  environment: 'production',
});

// Request-scoped logging
const requestLogger = logger.forRequest('req-123', {
  userId: 'user-456',
});

// Child logger with context
const childLogger = logger.child({
  module: 'auth',
  version: '1.0.0',
});
```

### Test Logger

```typescript
import { createTestLogger } from '@kit/shared/logger';

// Returns an EnhancedLogger configured for testing
const logger = createTestLogger('TEST-SERVICE');

// Use in tests
logger.info('Test operation', { testId: '123' });
```

## Security Features

### Automatic Data Sanitization

The logger automatically redacts sensitive fields:

```typescript
const DEFAULT_SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'apiKey', 'api_key',
  'authorization', 'auth', 'cookie', 'session',
  'creditCard', 'credit_card', 'ssn', 'socialSecurityNumber'
];

// Values are replaced with "[REDACTED]"
logger.info('User login', {
  email: 'user@example.com',    // → "[REDACTED]"
  password: 'secret123',         // → "[REDACTED]"
  userId: '123'                  // → "123" (not sensitive)
});
```

## Environment Configuration

```bash
# Log Levels
LOG_LEVEL="info"                    # General log level
API_LOG_LEVEL="debug"               # API-specific level
MONITORING_LOG_THRESHOLD="error"    # Monitoring threshold

# Logger Provider
LOGGER="pino"                        # Use Pino (default, recommended)
LOGGER="console"                     # Use console (fallback)

# Defaults
# Development: "debug"
# Production: "info"
```

## Biome Linting Compliance

The project enforces `noConsole: "error"` with no exceptions. Migration strategy:

### Server Components (No "use client")

```typescript
import { createServiceLogger } from "@kit/shared/logger";

const { getLogger } = createServiceLogger("SERVICE-NAME");

export async function MyServerComponent() {
  const logger = await getLogger();
  logger.info("Operation completed", { context });
}
```

### Client Components ("use client")

```typescript
"use client";

// Development-gated console wrapper
const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      // biome-ignore lint/suspicious/noConsole: Development logging
      console.info(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      // biome-ignore lint/suspicious/noConsole: Development logging
      console.error(...args);
    }
  },
  // ... warn, debug
};

export function MyClientComponent() {
  logger.info("Component rendered", { props });
}
```

### Migration Command

```bash
# Automated migration script
node scripts/migrate-to-logger-advanced.js

# Verify linting
pnpm biome check path/to/file.tsx
```

## Testing with Async Logger

### Mock Setup (Vitest)

```typescript
import { vi } from 'vitest';

vi.mock('@kit/shared/logger', () => ({
  createServiceLogger: vi.fn(() => ({
    getLogger: vi.fn(async () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      child: vi.fn().mockReturnThis(),
      forRequest: vi.fn().mockReturnThis(),
    })),
  })),
}));
```

### Test Example

```typescript
describe('MyService', () => {
  it('should log errors', async () => {
    const mockLogger = {
      error: vi.fn(),
    };

    const mockGetLogger = vi.fn().mockResolvedValue(mockLogger);
    vi.mocked(createServiceLogger).mockReturnValue({
      getLogger: mockGetLogger,
    });

    await myFunction();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Expected error message',
      expect.objectContaining({ error: expect.any(Error) })
    );
  });
});
```

## Monitoring Integration

```typescript
import { createMonitoredLogger } from '@kit/shared/logger';
import { getServerMonitoringService } from '@kit/monitoring/api';

// Create logger with monitoring
const logger = createMonitoredLogger(
  'SERVICE-NAME',
  getServerMonitoringService()
);

// Errors automatically sent to monitoring service (Sentry, New Relic, etc.)
```

## Common Patterns

### Error Handling

```typescript
try {
  const result = await riskyOperation();
  logger.info('Operation succeeded', {
    operation: 'risky_operation',
    resultId: result.id
  });
} catch (error) {
  logger.error('Operation failed', {
    operation: 'risky_operation',
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : String(error),
  });
  throw error;
}
```

### Request Tracking

```typescript
const logger = await getLogger();
const requestLogger = logger.forRequest(req.headers['x-request-id'] || uuidv4(), {
  method: req.method,
  path: req.url,
  userId: req.user?.id,
});

requestLogger.info('Request received');
// ... handle request
requestLogger.info('Request completed', { status: 200 });
```

## Best Practices

1. **Always Use Service Logger**: Better context tracking
2. **Structure Your Logs**: Use objects for metadata
3. **Include Operation Context**: Add operation names for debugging
4. **Let Logger Sanitize**: Don't manually redact sensitive data
5. **Use Appropriate Levels**:
   - `debug`: Detailed debugging (development only)
   - `info`: General informational messages
   - `warn`: Warning messages (potential issues)
   - `error`: Error messages (recoverable)
   - `fatal`: Fatal errors (non-recoverable)

6. **Performance**: Logger is cached after first initialization

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No log output | Not in async context | Add `await` before `getLogger()` |
| Sensitive data visible | Field names don't match patterns | Add to `sensitiveFields` config |
| Performance degradation | Excessive logging in production | Set `LOG_LEVEL=warn` in production |
| Lost logs during crash | Async logger hasn't flushed | Use sync console for critical errors in `process.on('uncaughtException')` |
| Biome linting errors | Direct console usage | Add environment check and biome-ignore comment |
| TypeScript errors in client wrapper | Incorrect typing | Use `(...args: unknown[])` signature |

## Migration Quick Reference

```typescript
// ❌ Before
console.error('Failed:', error);

// ✅ After (Server)
const logger = await getLogger();
logger.error('Failed', { error });

// ✅ After (Client)
if (process.env.NODE_ENV === 'development') {
  // biome-ignore lint/suspicious/noConsole: Debug
  console.error('Failed:', error);
}
```

## Related Files

- `/packages/shared/src/logger/`: Core implementation
- `/packages/monitoring/`: Monitoring integrations
- `/scripts/migrate-to-logger-advanced.js`: Migration script
- `/biome.json`: Linting configuration

## See Also

- [[monitoring-integration]]: Monitoring service integration
- [[server-actions]]: Server action patterns using logger
- [[biome-configuration]]: Linting rules and compliance
