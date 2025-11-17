---
id: "dependencies"
title: "Dependency Management Architecture"
version: "2.1.0"
category: "architecture"
description: "Dependency injection patterns, service lifecycle management, and provider architecture for the SlideHeroes Next.js monorepo"
tags: ["dependency-injection", "services", "providers", "monorepo", "factories", "registry"]
dependencies: []
cross_references:
  - id: "project-architecture"
    type: "related"
    description: "Overall project structure and monorepo organization"
  - id: "service-patterns"
    type: "pattern"
    description: "Common service implementation patterns"
created: "2025-01-13"
last_updated: "2025-01-13"
author: "create-context"
---

# Architecture: Dependency Management

Dependency injection patterns and service lifecycle management for SlideHeroes Next.js monorepo.

## Core Patterns

### 1. Factory Pattern for Services

```typescript
export function createAdminDashboardService(client: SupabaseClient<Database>) {
  return new AdminDashboardService(client);
}

export class AdminDashboardService {
  constructor(private readonly client: SupabaseClient<Database>) {}
  
  async getDashboardData() {
    const logger = await getLogger();
    // Parallel fetching for performance
    const [subscriptions, trials, accounts] = await Promise.all([
      this.fetchSubscriptions(),
      this.fetchTrials(),
      this.fetchAccounts(),
    ]);
    return { subscriptions, trials, accounts };
  }
}
```

### 2. Function-Based Client Creation

```typescript
// Server-side Supabase client (new instance per request)
export function getSupabaseServerClient<GenericSchema = Database>() {
  const keys = getSupabaseClientKeys();
  return createServerClient<GenericSchema>(keys.url, keys.publicKey, {
    cookies: { /* cookie handling */ }
  });
}
```

### 3. Registry Pattern for Dynamic Implementations

```typescript
const loggerRegistry = createRegistry<LoggerInstance, LoggerProvider>();

loggerRegistry.register("pino", async () => {
  const { Logger: PinoLogger } = await import("./impl/pino");
  return PinoLogger;
});

export async function getLogger() {
  return loggerRegistry.get(LOGGER); // LOGGER from env
}
```

## Server Actions with enhanceAction

All server actions use the `enhanceAction` wrapper:

```typescript
import { enhanceAction } from "@kit/next/actions";
import { z } from "zod";

const UpdateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const updateUserAction = enhanceAction(
  async (data, user) => {
    const service = createUserService(getSupabaseServerClient());
    return service.updateUser(user.id, data);
  },
  {
    auth: true,        // Requires authentication
    schema: UpdateUserSchema,  // Validates input
    captcha: false,    // Optional CAPTCHA
  }
);
```

## Client-Side Provider Architecture

React Context for client-side dependency injection:

```typescript
"use client";

const provider = getMonitoringProvider();
const Provider = provider
  ? lazy(() => monitoringProviderRegistry.get(provider))
  : null;

monitoringProviderRegistry.register("sentry", async () => {
  const { SentryProvider } = await import("@kit/sentry/provider");
  return {
    default: function SentryProviderWrapper({ children }) {
      return <SentryProvider>{children}</SentryProvider>;
    },
  };
});

export function MonitoringProvider({ children }) {
  if (!Provider) return <>{children}</>;
  return <Provider>{children}</Provider>;
}
```

## Monorepo Package Structure

```typescript
// Internal packages use @kit namespace
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { enhanceAction } from "@kit/next/actions";

// Service composition
export function createAdminService() {
  const client = getSupabaseServerClient();
  const logger = await getLogger();
  return new AdminService(client, logger);
}
```

## Testing Patterns

```typescript
// Mock dependencies for unit tests
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
} as unknown as SupabaseClient<Database>;

describe("AdminDashboardService", () => {
  it("should fetch dashboard data", async () => {
    const service = new AdminDashboardService(mockSupabaseClient);
    const result = await service.getDashboardData();
    expect(result).toHaveProperty("subscriptions");
  });
});

// Integration test helper
export function createTestClient(user?: User) {
  return createServerClient(TEST_URL, TEST_KEY, {
    auth: { persistSession: false },
    global: { headers: user ? { Authorization: `Bearer ${user.token}` } : {} },
  });
}
```

## Environment-Based Configuration

```typescript
// Dynamic provider selection
const MONITORING_PROVIDER = z
  .enum(["sentry", "newrelic", "datadog"])
  .optional()
  .transform((value) => value || undefined);

export function getMonitoringProvider() {
  return MONITORING_PROVIDER.parse(
    process.env.NEXT_PUBLIC_MONITORING_PROVIDER
  );
}

// Feature-specific providers
export function getAIProvider() {
  const provider = process.env.AI_PROVIDER || "openai";
  return aiProviderRegistry.get(provider);
}
```

## Lifecycle Management

```typescript
// Server components: new client per request
export default async function ServerPage() {
  const client = getSupabaseServerClient();
  const user = await requireUser(client);
  const service = createDashboardService(client);
  const data = await service.getData();
  return <Dashboard data={data} />;
}

// Client components: use hooks
export function ClientComponent() {
  const supabase = useSupabase(); // From context provider
  
  useEffect(() => {
    const subscription = supabase
      .from("table")
      .on("*", handleChange)
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [supabase]);
  
  return <div>{/* ... */}</div>;
}
```

## Performance Considerations

- **Parallel fetching**: Always use `Promise.all()` for multiple async operations
- **Lazy loading**: Registry pattern enables automatic code splitting
- **Singleton pattern**: Logger and browser clients cached appropriately
- See `performance.md` for detailed optimization patterns

## Key Decisions

### Factory Functions vs DI Container

- ✅ **Factory functions**: Type-safe, tree-shakeable, explicit dependencies
- ❌ **Trade-off**: Manual wiring, no automatic lifecycle management

### Registry Pattern for Implementations

- ✅ **Registry**: Runtime selection, lazy loading, clean separation
- ❌ **Trade-off**: Async initialization, runtime errors if missing

### Server Actions with enhanceAction

- ✅ **enhanceAction**: Consistent auth/validation, centralized error handling
- ❌ **Trade-off**: Schema definition overhead, less custom auth flexibility

---

**Related Files**:

- `/packages/next/src/actions/index.ts` - enhanceAction implementation
- `/packages/shared/src/registry/index.ts` - Registry pattern
- `/packages/supabase/src/clients/` - Client creation functions
- `/packages/monitoring/api/src/components/provider.tsx` - Provider pattern
