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

## Biome Linting Alignment

### Configuration Overview

The project uses biome with strict console rules:
- `noConsole` is set to `"error"` with `"allow": []`
- All console statements are forbidden by default
- Exceptions only for test files and scripts

### Migration Strategy by Component Type

#### Server Components (No "use client" directive)
```typescript
// ✅ CORRECT: Use async logger
import { createServiceLogger } from "@kit/shared/logger";

const { getLogger } = createServiceLogger("SERVICE-NAME");

export async function MyServerComponent() {
  const logger = await getLogger();
  logger.info("Operation completed", { context });
}
```

#### Client Components ("use client" directive)
```typescript
// ✅ CORRECT: Use development-gated console wrapper
"use client";

// Create a client-safe logger wrapper
const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      // biome-ignore lint/suspicious/noConsole: Development logging is allowed
      console.info(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      // biome-ignore lint/suspicious/noConsole: Development logging is allowed
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      // biome-ignore lint/suspicious/noConsole: Development logging is allowed
      console.warn(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      // biome-ignore lint/suspicious/noConsole: Development logging is allowed
      console.debug(...args);
    }
  },
};

export function MyClientComponent() {
  // Use logger.info(), logger.error(), etc.
  logger.info("Component rendered", { props });
}
```

### Biome-Ignore Best Practices

1. **Always include explanation**: Describe why console is needed
2. **Use correct rule name**: `lint/suspicious/noConsole` (not `nursery/noConsole`)
3. **Gate with environment checks**: Only log in development
4. **Place above console statement**: Comment must be immediately before

#### Examples:
```typescript
// ✅ CORRECT
if (process.env.NODE_ENV === "development") {
  // biome-ignore lint/suspicious/noConsole: Development debugging for API responses
  console.log("API Response:", data);
}

// ❌ INCORRECT - No environment check
// biome-ignore lint/suspicious/noConsole: Debugging
console.log(data); // Will run in production!

// ❌ INCORRECT - Wrong rule name
// biome-ignore lint/nursery/noConsole: Debugging
console.log(data);
```

### Component Type Detection

#### Automatic Detection Logic:
```typescript
// Check first few lines of file:
const isClientComponent = content.includes('"use client"');
const isServerAction = content.includes('"use server"');

if (isClientComponent) {
  // Use development-gated console wrapper
} else if (isServerAction || !isClientComponent) {
  // Use async logger (server component or server action)
}
```

#### File Patterns:
- **Client Components**: 
  - Start with `"use client"`
  - Use React hooks (useState, useEffect, etc.)
  - Handle user interactions
  
- **Server Components**: 
  - No `"use client"` directive
  - Can use `await` in component body
  - Data fetching components
  
- **Server Actions**:
  - Start with `"use server"`
  - Always async functions
  - Database operations

### Migration Workflow

1. **Identify Component Type**:
   ```bash
   head -n 5 ComponentName.tsx | grep -E '"use (client|server)"'
   ```

2. **Apply Appropriate Pattern**:
   - Client → Development-gated console wrapper
   - Server → Async logger with createServiceLogger

3. **Verify Linting**:
   ```bash
   pnpm biome check path/to/file.tsx
   ```

4. **Test in Both Environments**:
   - Development: Logs should appear in console
   - Production build: No console output

### Production Safety

#### Environment Gating Benefits:
- **Bundle Size**: Development-only code can be tree-shaken
- **Performance**: No runtime console calls in production
- **Security**: Prevents accidental data exposure in production logs
- **Compliance**: Meets strict linting requirements

#### Verification:
```bash
# Check that console statements are properly gated
rg "console\.(log|info|error|warn)" --type ts --type tsx |
  grep -v "process.env.NODE_ENV === 'development'"
# Should return no results for client components
```

### Common Migration Patterns

#### Pattern 1: Simple Info Logging
```typescript
// Before (commented out with TODO)
// TODO: Async logger needed
// console.info("Processing item", itemId);

// After (Client Component)
logger.info("Processing item", { itemId });

// After (Server Component)  
const logger = await getLogger();
logger.info("Processing item", { itemId });
```

#### Pattern 2: Error Handling
```typescript
// Before
// TODO: Async logger needed
// console.error("Failed to process", error);

// After (Client Component)
logger.error("Failed to process item", { error, itemId });

// After (Server Component)
const logger = await getLogger();
logger.error("Failed to process item", { error, itemId });
```

#### Pattern 3: Debug Logging with Context
```typescript
// Before
// TODO: Async logger needed  
// console.log("Debug info:", data);

// After (Client Component)
logger.debug("Processing step completed", {
  step: "validation",
  dataLength: data.length,
  timestamp: Date.now()
});

// After (Server Component)
const logger = await getLogger();
logger.debug("Processing step completed", {
  step: "validation", 
  dataLength: data.length,
  userId
});
```

### Troubleshooting Migration Issues

#### Biome Errors:
```
× Don't use console.
× Unknown lint rule nursery/noConsole
× Suppression comment has no effect
```

**Solutions**:
1. Use correct rule name: `suspicious/noConsole`
2. Add environment check: `if (process.env.NODE_ENV === "development")`
3. Place ignore comment immediately before console statement
4. Use development-gated wrapper for client components

#### TypeScript Errors:
```
argument of type 'unknown[]' is not assignable to parameter
```

**Solution**: Use proper typing in wrapper:
```typescript
const logger = {
  info: (...args: unknown[]) => {
    // Implementation
  }
};
```

#### React Hook Dependency Issues:
```
This hook does not specify all of its dependencies
```

**Solution**: Add all referenced variables to dependency array:
```typescript
useEffect(() => {
  logger.info(`Survey ${survey?.id} (${survey?.title}): Processed`);
}, [survey?.id, survey?.title]); // Include all referenced properties
```
