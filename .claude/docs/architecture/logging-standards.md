# Logging Standards and Architecture

## Current State Analysis

### Issue Summary

The codebase has multiple competing logging approaches causing fragmentation:

- **Main Pino Logger**: 46 files using `getLogger()`
- **Environment Logger**: 2 files using `createEnvironmentLogger()`
- **Simple Logger**: Database adapter with custom implementation
- **Console Usage**: 108 files with direct `console.log/error/warn`
- **Monitoring**: Independent logging in Sentry/Baselime services

### Root Causes

1. **Design Disconnect**: Main logger lacks environment-aware features
2. **Missing Standards**: No documented logging conventions
3. **Monitoring Isolation**: Monitoring services operate independently
4. **Configuration Fragmentation**: Multiple environment variables

## Unified Logging Strategy

### 1. Core Logger Requirements

**Enhanced Main Logger** (`packages/shared/src/logger`):

```typescript
interface UnifiedLoggerConfig {
  // Environment awareness
  serviceName: string;
  environment: string;
  logLevel: LogLevel;
  enableLogging: boolean;

  // Monitoring integration
  enableMonitoring: boolean;
  monitoringService?: MonitoringService;

  // Data security
  enableSanitization: boolean;
  sensitiveFields: string[];

  // Output configuration
  provider: 'pino' | 'console';
  enableStructuredLogging: boolean;
}
```

### 2. Logging Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                   Unified Logger API                        │
│  - getLogger(serviceName)                                  │
│  - createContextLogger(context)                            │
│  - createRequestLogger(requestId)                          │
├─────────────────────────────────────────────────────────────┤
│                 Logger Implementation                        │
│  - Environment-aware configuration                         │
│  - Data sanitization & security                           │
│  - Structured logging support                             │
├─────────────────────────────────────────────────────────────┤
│              Monitoring Integration                          │
│  - Auto-forward errors to monitoring                      │
│  - Performance metrics                                     │
│  - User context tracking                                  │
├─────────────────────────────────────────────────────────────┤
│                  Output Adapters                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │    Pino     │  │   Console   │  │   Custom    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 3. Migration Strategy

#### Phase 1: Enhance Main Logger

- Merge environment logger features into main logger
- Add monitoring service integration
- Implement structured logging support
- Create service-specific logger factories

#### Phase 2: Standardize Usage

- Create migration guide for console.log usage
- Add ESLint rules to prevent direct console usage
- Implement logger factories for common patterns
- Add TypeScript types for structured logging

#### Phase 3: Replace Implementations

- Migrate environment logger users to main logger
- Replace simple logger in database adapter
- Integrate monitoring services with main logger
- Remove duplicate logging implementations

#### Phase 4: Advanced Features

- Add distributed tracing support
- Implement log aggregation
- Add performance monitoring
- Create logging analytics dashboard

## Implementation Guidelines

### 1. Service Logger Pattern

```typescript
// packages/shared/src/logger/service-logger.ts
export function createServiceLogger(serviceName: string) {
  return {
    async getLogger() {
      const baseLogger = await getLogger();
      return baseLogger.child({ service: serviceName });
    },

    async getRequestLogger(requestId: string) {
      const baseLogger = await getLogger();
      return baseLogger.child({
        service: serviceName,
        requestId,
        timestamp: new Date().toISOString(),
      });
    },

    async getContextLogger(context: Record<string, unknown>) {
      const baseLogger = await getLogger();
      return baseLogger.child({
        service: serviceName,
        ...context,
      });
    },
  };
}
```

### 2. Monitoring Integration

```typescript
// Enhanced logger with monitoring
export class EnhancedLogger implements Logger {
  constructor(
    private config: UnifiedLoggerConfig,
    private monitoring?: MonitoringService,
  ) {}

  async error(message: string, data?: unknown) {
    // Log to main logger
    this.baseLogger.error(message, data);

    // Forward to monitoring if error is significant
    if (this.monitoring && data instanceof Error) {
      await this.monitoring.captureException(data, {
        message,
        service: this.config.serviceName,
        context: data,
      });
    }
  }

  async warn(message: string, data?: unknown) {
    this.baseLogger.warn(message, data);

    // Optionally send warnings to monitoring
    if (this.config.enableMonitoring && this.isSignificantWarning(message)) {
      await this.monitoring?.captureEvent(`Warning: ${message}`, {
        service: this.config.serviceName,
        data,
      });
    }
  }
}
```

### 3. Configuration Management

```typescript
// Centralized configuration
export interface LoggingConfig {
  // Global settings
  LOGGER_PROVIDER: 'pino' | 'console';
  LOG_LEVEL: LogLevel;
  ENABLE_LOGGING: boolean;

  // Environment-specific
  ENABLE_STRUCTURED_LOGGING: boolean;
  ENABLE_DATA_SANITIZATION: boolean;

  // Monitoring integration
  ENABLE_MONITORING_INTEGRATION: boolean;
  MONITORING_ERROR_THRESHOLD: 'error' | 'warn' | 'info';

  // Performance
  ENABLE_PERFORMANCE_LOGGING: boolean;
  LOG_BUFFER_SIZE: number;
}

export function getLoggingConfig(): LoggingConfig {
  return {
    LOGGER_PROVIDER: (process.env.LOGGER ?? 'pino') as 'pino' | 'console',
    LOG_LEVEL: getLogLevel(),
    ENABLE_LOGGING: process.env.DISABLE_LOGGING !== 'true',
    ENABLE_STRUCTURED_LOGGING: process.env.NODE_ENV === 'production',
    ENABLE_DATA_SANITIZATION: process.env.NODE_ENV === 'production',
    ENABLE_MONITORING_INTEGRATION:
      process.env.ENABLE_MONITORING_LOGS === 'true',
    MONITORING_ERROR_THRESHOLD: (process.env.MONITORING_LOG_THRESHOLD ??
      'error') as LogLevel,
    ENABLE_PERFORMANCE_LOGGING: process.env.ENABLE_PERFORMANCE_LOGS === 'true',
    LOG_BUFFER_SIZE: parseInt(process.env.LOG_BUFFER_SIZE ?? '100'),
  };
}
```

## Usage Standards

### 1. Service Logging

```typescript
// Server-side service
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger, getRequestLogger } = createServiceLogger('AUTH-SERVICE');

export async function authenticateUser(email: string, requestId: string) {
  const logger = await getRequestLogger(requestId);

  logger.info('Authentication attempt', { email: sanitizeEmail(email) });

  try {
    const user = await findUser(email);
    logger.info('User authenticated successfully', { userId: user.id });
    return user;
  } catch (error) {
    logger.error('Authentication failed', {
      email: sanitizeEmail(email),
      error,
    });
    throw error;
  }
}
```

### 2. Client-Side Logging

```typescript
// Client component
import { createClientLogger } from '@kit/shared/logger';

const logger = createClientLogger('USER-PROFILE');

export function UserProfile() {
  const handleSubmit = async (data: FormData) => {
    logger.info('Profile update initiated');

    try {
      await updateProfile(data);
      logger.info('Profile updated successfully');
    } catch (error) {
      logger.error('Profile update failed', { error });
      // Error automatically sent to monitoring
    }
  };
}
```

### 3. Database Logging

```typescript
// Replace simple logger in database adapter
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('DB-ADAPTER');

class DatabaseAdapterManager {
  private logger = await getLogger();

  async createAdapter() {
    this.logger.info('Creating database adapter', {
      environment: this.environment,
      poolConfig: this.getPoolConfig()
    });
  }
}
```

## Migration Guide

### 1. Console.log Replacement

**Before:**

```typescript
console.log('Processing user data', userData);
console.error('Failed to process:', error);
```

**After:**

```typescript
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('USER-SERVICE');

const logger = await getLogger();
logger.info('Processing user data', { userData: sanitizeUserData(userData) });
logger.error('Failed to process user data', { error, userId: userData.id });
```

### 2. Environment Logger Migration

**Before:**

```typescript
import { createEnvironmentLogger } from '@kit/shared/logger';

const logger = createEnvironmentLogger('SURVEY-API');
```

**After:**

```typescript
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('SURVEY-API');
const logger = await getLogger();
```

### 3. Monitoring Integration

**Before:**

```typescript
try {
  await apiCall();
} catch (error) {
  console.error('API call failed', error);
  monitoring.captureException(error);
}
```

**After:**

```typescript
try {
  await apiCall();
} catch (error) {
  logger.error('API call failed', { error });
  // Monitoring integration automatic for errors
}
```

## ESLint Configuration

```json
{
  "rules": {
    "no-console": [
      "error",
      {
        "allow": ["warn", "error"]
      }
    ],
    "@typescript-eslint/no-console": "error",
    "kit/use-logger": "error"
  }
}
```

## Environment Variables

```bash
# Core logging
LOGGER=pino                           # Logger provider
LOG_LEVEL=info                        # Global log level
DISABLE_LOGGING=false                 # Emergency logging disable

# Environment-specific
ENABLE_STRUCTURED_LOGGING=true        # JSON formatted logs
ENABLE_DATA_SANITIZATION=true         # Sanitize sensitive data

# Monitoring integration
ENABLE_MONITORING_LOGS=true           # Send logs to monitoring
MONITORING_LOG_THRESHOLD=error        # Minimum level for monitoring

# Performance
ENABLE_PERFORMANCE_LOGS=false         # Performance metrics logging
LOG_BUFFER_SIZE=100                   # Log buffer size

# Legacy (deprecated)
API_LOG_LEVEL=info                    # Use LOG_LEVEL instead
ENABLE_DB_METRICS_LOGGING=false       # Use ENABLE_PERFORMANCE_LOGS
```

## Testing Strategy

### 1. Logger Testing

```typescript
import { createTestLogger } from '@kit/shared/logger/testing';

describe('UserService', () => {
  it('should log authentication attempts', async () => {
    const logger = createTestLogger();
    const userService = new UserService(logger);

    await userService.authenticate('user@example.com');

    expect(logger.info).toHaveBeenCalledWith(
      'Authentication attempt',
      expect.objectContaining({ email: 'u***@example.com' }),
    );
  });
});
```

### 2. Monitoring Integration Testing

```typescript
describe('Logger monitoring integration', () => {
  it('should send errors to monitoring service', async () => {
    const mockMonitoring = createMockMonitoring();
    const logger = createLogger({ monitoring: mockMonitoring });

    const error = new Error('Test error');
    await logger.error('Operation failed', { error });

    expect(mockMonitoring.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ message: 'Operation failed' }),
    );
  });
});
```

## Monitoring and Metrics

### 1. Key Metrics

- Log volume by service and level
- Error rate trends
- Performance impact of logging
- Monitoring integration success rate

### 2. Alerts

- High error rate in specific services
- Logging system failures
- Monitoring integration failures
- Performance degradation due to logging

### 3. Dashboard Components

- Service-specific log volumes
- Error trends over time
- Most common error patterns
- Logging performance metrics

## Benefits of Unified Approach

1. **Consistency**: Single logging interface across all services
2. **Monitoring Integration**: Automatic error forwarding to monitoring services
3. **Security**: Built-in data sanitization and sensitive field masking
4. **Performance**: Configurable logging levels and buffering
5. **Debugging**: Structured logging with request correlation
6. **Maintenance**: Single point of configuration and updates
7. **Standards**: Clear conventions prevent logging fragmentation
8. **Testing**: Mockable logger interface for unit tests
