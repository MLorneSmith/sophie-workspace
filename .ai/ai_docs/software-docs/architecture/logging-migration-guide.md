# Logging Migration Guide

This guide helps migrate from various logging approaches to the unified enhanced logger with New Relic integration.

## Quick Start

### Server-Side Components

```typescript
// OLD: Environment Logger
import { createEnvironmentLogger } from "@kit/shared/logger";
const logger = createEnvironmentLogger("SURVEY-API");

// NEW: Enhanced Logger with Monitoring
import { createServerLogger } from "@kit/shared/logger";
const { getLogger } = await createServerLogger("SURVEY-API");
const logger = getLogger();
```

### Client-Side Components

```typescript
// NEW: Client Logger
import { createClientLogger } from '@kit/shared/logger';

// OLD: Direct console.log
console.log('User action:', action);
console.error('Failed:', error);

const { getLogger } = createClientLogger('USER-PROFILE');
const logger = getLogger();

logger.info('User action', { action });
logger.error('Operation failed', { error });
```

## Migration Patterns

### 1. Environment Logger Migration

**Before:**

```typescript
import { createEnvironmentLogger } from '@kit/shared/logger';

export class PayloadApiService {
  private logger = createEnvironmentLogger('PAYLOAD-API');

  async fetchData() {
    this.logger.info('Fetching data...');
    try {
      const data = await fetch('/api/data');
      this.logger.info('Data fetched successfully');
      return data;
    } catch (error) {
      this.logger.error('Failed to fetch data', error);
      throw error;
    }
  }
}
```

**After:**

```typescript
import { createServerLogger } from '@kit/shared/logger';

export class PayloadApiService {
  private logger;

  constructor() {
    this.initializeLogger();
  }

  private async initializeLogger() {
    const { getLogger } = await createServerLogger('PAYLOAD-API');
    this.logger = getLogger();
  }

  async fetchData() {
    this.logger?.info('Fetching data');
    try {
      const data = await fetch('/api/data');
      this.logger?.info('Data fetched successfully', {
        dataSize: data.length,
      });
      return data;
    } catch (error) {
      this.logger?.error('Failed to fetch data', {
        error,
        endpoint: '/api/data',
      });
      throw error;
    }
  }
}
```

### 2. Console.log Migration

**Before:**

```typescript
export async function processPayment(userId: string, amount: number) {
  console.log(`Processing payment for user ${userId}`);

  try {
    const result = await paymentAPI.charge(userId, amount);
    console.log('Payment successful:', result.id);
    return result;
  } catch (error) {
    console.error('Payment failed:', error);
    throw error;
  }
}
```

**After:**

```typescript
import { createServerLogger } from '@kit/shared/logger';

const { getLogger, logUserAction } =
  await createServerLogger('PAYMENT-SERVICE');
const logger = getLogger();

export async function processPayment(userId: string, amount: number) {
  logger.info('Processing payment', { userId, amount });

  try {
    const result = await paymentAPI.charge(userId, amount);
    logUserAction(userId, 'payment_processed', true, {
      paymentId: result.id,
      amount,
    });
    return result;
  } catch (error) {
    logger.error('Payment failed', {
      error,
      userId,
      amount,
    });
    logUserAction(userId, 'payment_failed', false, {
      error: error.message,
      amount,
    });
    throw error;
  }
}
```

### 3. Database Adapter Migration

**Before:**

```typescript
const createSimpleLogger = (prefix: string) => ({
  info: (...args: any[]) => console.log(`[${prefix}]`, ...args),
  error: (...args: any[]) => console.error(`[${prefix}]`, ...args),
});

class DatabaseAdapter {
  private logger = createSimpleLogger('DB-ADAPTER');

  async query(sql: string) {
    this.logger.info('Executing query');
    const start = Date.now();
    const result = await db.query(sql);
    const duration = Date.now() - start;
    this.logger.info(`Query completed in ${duration}ms`);
    return result;
  }
}
```

**After:**

```typescript
import { createServerLogger } from '@kit/shared/logger';

class DatabaseAdapter {
  private logger;

  async initialize() {
    const { getLogger, logDatabaseQuery } =
      await createServerLogger('DB-ADAPTER');
    this.logger = { getLogger, logDatabaseQuery };
  }

  async query(sql: string) {
    const logger = this.logger?.getLogger();
    logger?.debug('Executing query', { sql: sql.substring(0, 100) });

    const start = Date.now();
    const result = await db.query(sql);
    const duration = Date.now() - start;

    this.logger?.logDatabaseQuery(sql, duration, result.rowCount);
    return result;
  }
}
```

### 4. API Route Migration

**Before:**

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log('API request received:', { userId });

  try {
    const data = await fetchUserData(userId);
    return Response.json(data);
  } catch (error) {
    console.error('API error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**After:**

```typescript
import { createServerLogger } from '@kit/shared/logger';

const { getLogger, logApiCall } = await createServerLogger('USER-API');
const logger = getLogger();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const start = Date.now();

  logger.info('API request received', {
    userId,
    endpoint: '/api/user',
    method: 'GET',
  });

  try {
    const data = await fetchUserData(userId);
    const duration = Date.now() - start;

    logApiCall('/api/user', 'GET', 200, duration);
    return Response.json(data);
  } catch (error) {
    const duration = Date.now() - start;

    logger.error('API error', {
      error,
      userId,
      endpoint: '/api/user',
    });

    logApiCall('/api/user', 'GET', 500, duration);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Environment Configuration

Add these environment variables to enable New Relic monitoring:

```bash
# .env.local
NEXT_PUBLIC_MONITORING_PROVIDER=newrelic
NEW_RELIC_LICENSE_KEY=your-license-key
NEW_RELIC_APP_NAME=SlideHeroes Web

# Logging configuration
LOG_LEVEL=info
ENABLE_MONITORING_LOGS=true
MONITORING_LOG_THRESHOLD=warn
ENABLE_STRUCTURED_LOGGING=true
ENABLE_DATA_SANITIZATION=true
```

## Benefits of Migration

1. **Automatic Error Tracking**: Errors are automatically sent to New Relic
2. **Structured Logging**: Consistent log format across all services
3. **Performance Tracking**: Built-in timing for API calls and database queries
4. **User Context**: Track user actions with proper attribution
5. **Security**: Automatic sanitization of sensitive data
6. **Request Correlation**: Track logs across a request lifecycle

## Testing the Migration

After migrating, verify:

1. **Logs appear in console** (development)
2. **Errors appear in New Relic** (all environments)
3. **Custom events are tracked** in New Relic
4. **No sensitive data** is exposed in logs
5. **Performance metrics** are recorded

## Rollback Plan

If issues occur, you can temporarily disable the enhanced logger:

```typescript
// Emergency fallback
const logger = process.env.USE_LEGACY_LOGGER
  ? createEnvironmentLogger('SERVICE')
  : (await createServerLogger('SERVICE')).getLogger();
```

## Next Steps

1. Migrate high-traffic services first
2. Monitor New Relic for proper data flow
3. Add custom attributes for business metrics
4. Create dashboards for key services
5. Set up alerts for error thresholds
