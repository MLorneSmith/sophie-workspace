---
id: service-patterns
title: Service Patterns Architecture
version: 2.0.0
category: pattern
description: Comprehensive guide to the hybrid service architecture combining class-based services with functional server actions
tags: ["services", "architecture", "patterns", "server-actions", "business-logic", "testing"]
dependencies: ["project-architecture", "database-patterns", "testing-strategy"]
cross_references:
  - id: project-architecture
    type: prerequisite
    description: Overall application architecture understanding
  - id: database-patterns
    type: related
    description: Database access and query patterns
  - id: testing-strategy
    type: related
    description: Testing approaches for services
created: 2024-12-15
last_updated: 2025-09-12
author: create-context
---

# Service Patterns Architecture

## Overview

Our application follows a **hybrid service architecture** that combines class-based services for business logic encapsulation with functional server actions for request handling. This approach leverages the benefits of both object-oriented and functional paradigms, providing clear separation of concerns, testability, and type safety throughout the application stack.

## Architecture Philosophy

### Hybrid Approach Benefits

The codebase strategically uses:
- **Class-based services** for complex business logic and stateful operations
- **Factory functions** for dependency injection and service instantiation
- **Functional server actions** for request handling and validation
- **Functional composition** for combining simple operations

This hybrid model provides:
- Clear encapsulation of business logic
- Testable service boundaries
- Type-safe interfaces
- Flexible dependency injection
- Progressive enhancement support

## Service Pattern Types

### 1. Class-Based Services with Factory Functions

Services encapsulate business logic using classes with factory function instantiation:

```typescript
// packages/features/team-accounts/src/server/services/create-team-account.service.ts
import "server-only";
import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Factory function for dependency injection
export function createCreateTeamAccountService(
  client: SupabaseClient<Database>
) {
  return new CreateTeamAccountService(client);
}

// Service class encapsulating business logic
class CreateTeamAccountService {
  private readonly namespace = "accounts.create-team-account";

  constructor(private readonly client: SupabaseClient<Database>) {}

  async createNewOrganizationAccount(params: { 
    name: string; 
    userId: string 
  }) {
    const logger = await getLogger();
    const ctx = { ...params, namespace: this.namespace };

    logger.info(ctx, "Creating new team account...");

    const { error, data } = await this.client.rpc("create_team_account", {
      account_name: params.name,
    });

    if (error) {
      logger.error({ error, ...ctx }, "Error creating team account");
      throw new Error("Error creating team account");
    }

    logger.info(ctx, "Team account created successfully");
    return { data, error };
  }
}
```

### 2. Server Actions with enhanceAction

Server actions provide a functional interface for handling requests with built-in validation, authentication, and error handling:

```typescript
// packages/features/team-accounts/src/server/actions/create-team-account-server-actions.ts
"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { CreateTeamSchema } from "../../schema/create-team.schema";
import { createCreateTeamAccountService } from "../services/create-team-account.service";

export const createTeamAccountAction = enhanceAction(
  async ({ name }, user) => {
    const logger = await getLogger();
    const client = getSupabaseServerClient();
    const service = createCreateTeamAccountService(client);

    const ctx = {
      name: "team-accounts.create",
      userId: user.id,
      accountName: name,
    };

    logger.info(ctx, "Creating team account...");

    const { data, error } = await service.createNewOrganizationAccount({
      name,
      userId: user.id,
    });

    if (error) {
      logger.error({ ...ctx, error }, "Failed to create team account");
      return { error: true };
    }

    logger.info(ctx, "Team account created");
    const accountHomePath = `/home/${data.slug}`;
    redirect(accountHomePath);
  },
  {
    schema: CreateTeamSchema,
    auth: true,  // Requires authentication
    captcha: false  // Optional CAPTCHA verification
  }
);
```

### 3. API Classes for Data Access

API classes provide structured data access patterns:

```typescript
// packages/features/team-accounts/src/server/api.ts
export class TeamAccountsApi {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getTeamAccount(slug: string) {
    const { data, error } = await this.client
      .from("accounts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  }

  async getTeamAccountMembers(accountId: string) {
    return this.client
      .from("accounts_memberships")
      .select(`
        user:public_users!inner(id, email, display_name),
        role:role_id,
        created_at
      `)
      .eq("account_id", accountId)
      .throwOnError();
  }
}
```

### 4. Integration Services

Integration services handle external API communication and complex orchestration:

```typescript
// apps/web/lib/ai/ai-service.ts
export async function generateContent(params: {
  prompt: string;
  userId: string;
  sessionId?: string;
}) {
  const config = await ConfigManager.getInstance();
  
  try {
    // External API integration
    const response = await getChatCompletion({
      messages: buildMessages(params.prompt),
      options: config.getModelConfig(),
    });

    // Store result in database
    const supabase = getSupabaseServerClient();
    await supabase.from("ai_generations").insert({
      user_id: params.userId,
      session_id: params.sessionId,
      prompt: params.prompt,
      response: response.content,
    });

    return response;
  } catch (error) {
    logger.error("AI generation failed", { error, params });
    throw new Error("Failed to generate content");
  }
}
```

## Implementation Patterns

### Dependency Injection Pattern

Services use constructor-based dependency injection for testability:

```typescript
// Service with multiple dependencies
export function createNotificationService(
  client: SupabaseClient<Database>,
  emailService: EmailService,
  pushService: PushNotificationService
) {
  return new NotificationService(client, emailService, pushService);
}

class NotificationService {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly emailService: EmailService,
    private readonly pushService: PushNotificationService
  ) {}

  async sendNotification(params: NotificationParams) {
    // Store in database
    await this.createDatabaseRecord(params);
    
    // Send via appropriate channel
    if (params.channel === 'email') {
      await this.emailService.send(params);
    } else if (params.channel === 'push') {
      await this.pushService.send(params);
    }
  }
}
```

### Service Composition Pattern

Compose multiple services for complex operations:

```typescript
export async function completeOnboarding(params: {
  userId: string;
  teamData: TeamData;
  billingPlan: string;
}) {
  const client = getSupabaseServerClient();
  
  // Initialize services
  const teamService = createCreateTeamAccountService(client);
  const billingService = createBillingService(client);
  const emailService = createEmailService();
  
  try {
    // Orchestrate multiple operations
    const team = await teamService.createNewOrganizationAccount({
      name: params.teamData.name,
      userId: params.userId,
    });

    await billingService.initializePlan({
      accountId: team.data.id,
      plan: params.billingPlan,
    });

    await emailService.sendWelcomeSequence({
      userId: params.userId,
      teamId: team.data.id,
    });

    return { success: true, teamId: team.data.id };
  } catch (error) {
    logger.error("Onboarding failed", { error, params });
    throw error;
  }
}
```

### Error Handling Patterns

Consistent error handling with proper context and logging:

```typescript
// Result Pattern for explicit error handling
type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

class UserService {
  async updateProfile(
    userId: string, 
    data: ProfileData
  ): Promise<ServiceResult<User>> {
    const ctx = { userId, operation: 'updateProfile' };
    
    try {
      // Validate input
      const validation = profileSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false,
          error: "Invalid profile data",
          code: "VALIDATION_ERROR"
        };
      }

      // Perform update
      const { data: user, error } = await this.client
        .from("users")
        .update(validation.data)
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        logger.error({ ...ctx, error }, "Database update failed");
        return {
          success: false,
          error: "Failed to update profile",
          code: "DATABASE_ERROR"
        };
      }

      return { success: true, data: user };
    } catch (error) {
      logger.error({ ...ctx, error }, "Unexpected error");
      return {
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR"
      };
    }
  }
}
```

### Transaction Management

Handle complex operations with transaction boundaries:

```typescript
class AccountService {
  async transferOwnership(params: {
    accountId: string;
    fromUserId: string;
    toUserId: string;
  }) {
    const { accountId, fromUserId, toUserId } = params;
    
    // Use RPC for transactional operations
    const { data, error } = await this.client.rpc(
      'transfer_account_ownership',
      { 
        p_account_id: accountId,
        p_from_user: fromUserId,
        p_to_user: toUserId
      }
    );

    if (error) {
      if (error.code === 'P0001') {
        throw new BusinessError('Insufficient permissions');
      }
      throw error;
    }

    return data;
  }
}
```

## Data Fetching Patterns

### Server Components Pattern

Direct database access in server components for optimal performance:

```typescript
// app/home/[account]/teams/page.tsx
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export default async function TeamsPage({ 
  params 
}: { 
  params: { account: string } 
}) {
  const supabase = getSupabaseServerClient();

  // Parallel data fetching
  const [
    { data: teams },
    { data: invitations },
    { data: members }
  ] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('type', 'team')
      .eq('slug', params.account),
    supabase
      .from('invitations')
      .select('*')
      .eq('status', 'pending'),
    supabase
      .from('accounts_memberships')
      .select('*, user:public_users(*)')
  ]);

  return <TeamsPageClient teams={teams} invitations={invitations} members={members} />;
}
```

### Client-Side Data Fetching

Use SWR or React Query for client-side data management:

```typescript
'use client';

import useSWR from 'swr';

export function TeamMembersList({ teamId }: { teamId: string }) {
  const { data: members, error, mutate } = useSWR(
    `/api/teams/${teamId}/members`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  if (error) return <ErrorMessage />;
  if (!members) return <LoadingSpinner />;

  return (
    <div>
      {members.map(member => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}
```

## Testing Patterns

### Service Testing with Mocks

Test services in isolation with proper mocking:

```typescript
// __tests__/admin-accounts.service.test.ts
import { createAdminAccountsService } from "./admin-accounts.service";

// Helper to create mock Supabase client
function createMockSupabaseClient(config?: {
  deleteError?: any;
}): SupabaseClient<Database> {
  const mockBuilder = createMockDeleteBuilder({
    error: config?.deleteError,
  });

  return {
    from: vi.fn((table: string) => {
      if (table === "accounts") {
        return mockBuilder;
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  } as unknown as SupabaseClient<Database>;
}

describe('AdminAccountsService', () => {
  it('should delete an account successfully', async () => {
    const mockClient = createMockSupabaseClient();
    const service = createAdminAccountsService(mockClient);

    await service.deleteAccount('account-123');

    expect(mockClient.from).toHaveBeenCalledWith('accounts');
  });

  it('should handle deletion errors', async () => {
    const mockClient = createMockSupabaseClient({
      deleteError: new Error('Permission denied')
    });
    const service = createAdminAccountsService(mockClient);

    await expect(
      service.deleteAccount('account-123')
    ).rejects.toThrow('Permission denied');
  });
});
```

### Server Action Testing

Test server actions with authentication mocking:

```typescript
// __tests__/create-team-action.test.ts
vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: () => mockSupabaseClient,
}));

vi.mock('@kit/next/actions', () => ({
  enhanceAction: (fn: Function) => fn,
}));

describe('createTeamAccountAction', () => {
  it('should create team and redirect', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const teamData = { name: 'Test Team' };

    const result = await createTeamAccountAction(teamData, mockUser);

    expect(result).toBeUndefined(); // Due to redirect
  });
});
```

## Performance Optimization

### Parallel Data Fetching

Always use Promise.all for independent queries (60-80% performance improvement):

```typescript
// ✅ GOOD - Parallel fetching
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
]);

// ❌ BAD - Sequential fetching
const users = await fetchUsers();
const posts = await fetchPosts();
const comments = await fetchComments();
```

### Query Optimization

Use proper database joins and indexes:

```typescript
// ✅ Optimized query with single round-trip
const { data } = await supabase
  .from('accounts')
  .select(`
    *,
    members:accounts_memberships(
      user:public_users(id, email, display_name),
      role:role_id
    ),
    subscription:billing_subscriptions(*)
  `)
  .eq('id', accountId)
  .single();

// ❌ N+1 query problem
const account = await getAccount(accountId);
const members = await getMembers(accountId);
const subscription = await getSubscription(accountId);
```

### Caching Strategies

Implement multi-layer caching:

```typescript
class CachedUserService {
  private cache = new Map<string, CacheEntry>();
  
  async getUser(userId: string): Promise<User> {
    // Memory cache
    const cached = this.cache.get(userId);
    if (cached && !isExpired(cached)) {
      return cached.data;
    }

    // Redis cache
    const redisData = await redis.get(`user:${userId}`);
    if (redisData) {
      const user = JSON.parse(redisData);
      this.cache.set(userId, { data: user, timestamp: Date.now() });
      return user;
    }

    // Database fetch
    const user = await this.fetchFromDatabase(userId);
    
    // Update caches
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(user));
    this.cache.set(userId, { data: user, timestamp: Date.now() });
    
    return user;
  }
}
```

## Common Anti-Patterns to Avoid

### 1. Mixing Business Logic with Request Handling
```typescript
// ❌ BAD - Business logic in server action
export const createTeamAction = enhanceAction(
  async (data, user) => {
    // Don't put complex business logic here
    const slug = data.name.toLowerCase().replace(/\s+/g, '-');
    const exists = await checkSlugExists(slug);
    if (exists) {
      const slug = `${slug}-${Date.now()}`;
    }
    // ... more business logic
  }
);

// ✅ GOOD - Delegate to service
export const createTeamAction = enhanceAction(
  async (data, user) => {
    const service = createTeamService(getSupabaseServerClient());
    return service.createTeam(data, user.id);
  }
);
```

### 2. Inadequate Error Context
```typescript
// ❌ BAD - Generic error without context
catch (error) {
  throw new Error("Operation failed");
}

// ✅ GOOD - Detailed error with context
catch (error) {
  logger.error({
    operation: 'createTeamAccount',
    userId: user.id,
    teamName: data.name,
    error
  }, "Failed to create team account");
  
  throw new ServiceError(
    "Failed to create team account",
    "TEAM_CREATION_FAILED",
    { originalError: error }
  );
}
```

### 3. Skipping Validation Layers
```typescript
// ❌ BAD - No validation
export async function updateProfile(data: any) {
  return db.update('profiles').set(data);
}

// ✅ GOOD - Proper validation
export async function updateProfile(data: unknown) {
  const validated = profileSchema.parse(data);
  return db.update('profiles').set(validated);
}
```

## Related Files

From repository scan:
- `/packages/features/*/src/server/services/*.service.ts`: Service implementations
- `/packages/features/*/src/server/actions/*-server-actions.ts`: Server action handlers
- `/packages/features/*/src/server/api.ts`: API class definitions
- `/packages/next/src/actions/index.ts`: enhanceAction implementation
- `/packages/features/admin/src/lib/server/services/*.test.ts`: Service test examples

## Troubleshooting

### Issue: Service Not Found
**Symptoms**: TypeError: createXService is not a function
**Cause**: Missing export or incorrect import path
**Solution**: Ensure factory function is exported and path is correct

### Issue: Authentication Error in Server Action
**Symptoms**: Redirect to login despite being authenticated
**Cause**: Missing or expired session
**Solution**: Check auth configuration in enhanceAction options

### Issue: Transaction Rollback
**Symptoms**: Partial data saved, inconsistent state
**Cause**: Error in multi-step operation
**Solution**: Use database transactions or RPC functions

### Issue: Slow Query Performance
**Symptoms**: Long response times, timeout errors
**Cause**: N+1 queries, missing indexes
**Solution**: Use joins, add indexes, implement caching

## See Also

- [[project-architecture]]: Overall application structure
- [[database-patterns]]: Database access and RLS patterns
- [[testing-strategy]]: Comprehensive testing approaches
- [[error-handling]]: Error management strategies
- [[performance-optimization]]: Performance best practices