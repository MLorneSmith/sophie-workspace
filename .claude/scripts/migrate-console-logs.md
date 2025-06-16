# Console.log to Enhanced Logger Migration Guide

## Overview

This guide helps migrate from `console.log/error/warn` to the unified enhanced logger implementation.

## Migration Patterns

### 1. Basic Console.log Replacement

**Before:**

```typescript
console.log('Processing user data', userData);
console.error('Failed to process:', error);
console.warn('Deprecated feature used');
```

**After:**

```typescript
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('YOUR-SERVICE-NAME');

export async function yourFunction() {
  const logger = await getLogger();

  logger.info('Processing user data', { userData });
  logger.error('Failed to process user data', { error });
  logger.warn('Deprecated feature used');
}
```

### 2. Client-Side Components

**Before:**

```typescript
export function MyComponent() {
  console.log('Component mounted');

  const handleClick = () => {
    console.error('Click failed', error);
  };
}
```

**After:**

```typescript
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('MY-COMPONENT');

export function MyComponent() {
  useEffect(() => {
    const initLogger = async () => {
      const logger = await getLogger();
      logger.info('Component mounted');
    };
    initLogger();
  }, []);

  const handleClick = async () => {
    const logger = await getLogger();
    logger.error('Click failed', { error });
  };
}
```

### 3. API Routes

**Before:**

```typescript
export async function POST(request: Request) {
  console.log('API called', request.url);
  try {
    // ... logic ...
  } catch (error) {
    console.error('API error:', error);
  }
}
```

**After:**

```typescript
import { createServiceLogger } from '@kit/shared/logger';

const { getRequestLogger } = createServiceLogger('API-ROUTE-NAME');

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = await getRequestLogger(requestId);

  logger.info('API called', { url: request.url });
  try {
    // ... logic ...
  } catch (error) {
    logger.error('API error', { error });
  }
}
```

### 4. Server Actions

**Before:**

```typescript
'use server';

export async function myServerAction(data: FormData) {
  console.log('Server action called');
  // ... logic ...
}
```

**After:**

```typescript
'use server';

import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('SERVER-ACTION-NAME');

export async function myServerAction(data: FormData) {
  const logger = await getLogger();
  logger.info('Server action called', {
    action: 'myServerAction',
    // Don't log sensitive form data
  });
  // ... logic ...
}
```

### 5. Database Operations

**Before:**

```typescript
const result = await supabase.from('users').select();
console.log('Query result:', result);
```

**After:**

```typescript
import { createServiceLogger } from '@kit/shared/logger';

const { getLogger } = createServiceLogger('DATABASE-SERVICE');

const logger = await getLogger();
const result = await supabase.from('users').select();

logger.debug('Database query executed', {
  operation: 'db_query',
  table: 'users',
  rowCount: result.data?.length,
  // Don't log actual user data
});
```

## Service Naming Conventions

Use UPPER-CASE-KEBAB naming for services:

- Components: `USER-PROFILE`, `NAVIGATION-MENU`
- API Routes: `AUTH-API`, `BILLING-API`
- Services: `DATABASE-SERVICE`, `EMAIL-SERVICE`
- Features: `ONBOARDING-FLOW`, `CHECKOUT-PROCESS`

## Common Gotchas

1. **Async Logger**: Remember that `getLogger()` is async
2. **Data Sanitization**: The logger automatically sanitizes sensitive fields in production
3. **Context Data**: Always pass data as an object in the second parameter
4. **No String Concatenation**: Use structured logging instead of string concatenation

## Testing

When writing tests, use the test logger:

```typescript
import { createTestLogger } from '@kit/shared/logger';

describe('MyService', () => {
  const logger = createTestLogger('TEST-SERVICE');

  it('should log operations', () => {
    // logger methods are synchronous in tests
    logger.info('Test operation');
  });
});
```

## Running the Migration

1. Run Biome to find all console usage:

   ```bash
   pnpm biome check --diagnostic-level=error apps/web
   ```

2. Fix files one at a time, grouping by service/feature

3. Test that logging still works as expected

4. Commit changes with clear messages

## Benefits After Migration

- Consistent log format across the application
- Automatic error forwarding to monitoring services
- Built-in data sanitization for security
- Request correlation for debugging
- Performance metrics tracking
- Structured logging for better searchability
