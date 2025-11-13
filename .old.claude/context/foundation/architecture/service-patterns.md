---
id: service-patterns
title: Service Patterns Architecture
version: 3.0.0
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
last_updated: 2025-09-15
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
// Factory function with multiple dependencies
export const createNotificationService = (
  client: SupabaseClient<Database>,
  emailService: EmailService,
  pushService: PushNotificationService
) => new NotificationService(client, emailService, pushService);
```

### Service Composition Pattern

Compose multiple services for complex operations:

```typescript
// Orchestrate multiple services in a single operation
export async function completeOnboarding(params: OnboardingParams) {
  const client = getSupabaseServerClient();
  const services = {
    team: createTeamService(client),
    billing: createBillingService(client),
    email: createEmailService()
  };

  // Execute operations in sequence or parallel as needed
  const team = await services.team.create(params);
  await Promise.all([
    services.billing.initialize(team.id),
    services.email.sendWelcome(team.id)
  ]);
  return team;
}
```

### Error Handling Patterns

Use the Result pattern for explicit error handling:

```typescript
// Result Pattern for explicit, type-safe error handling
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Usage in services
class UserService {
  async updateProfile(userId: string, data: ProfileData): Promise<ServiceResult<User>> {
    const validation = profileSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
    }
    // Perform operation and return result
  }
}
```

### Transaction Management

For complex operations requiring transaction boundaries, use database RPC functions:

```typescript
// Use RPC for transactional operations
const { data, error } = await client.rpc('transfer_account_ownership', {
  p_account_id: accountId,
  p_from_user: fromUserId,
  p_to_user: toUserId
});
```

## Performance Optimization

### Key Performance Principles

1. **Always use parallel data fetching** for independent queries (60-80% improvement)
2. **Use proper database joins** instead of N+1 queries
3. **Implement caching** at appropriate layers (memory, Redis, CDN)

```typescript
// ✅ Parallel fetching example
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
]);

// ✅ Optimized query with joins
const { data } = await supabase
  .from('accounts')
  .select(`
    *,
    members:accounts_memberships(user:public_users(*)),
    subscription:billing_subscriptions(*)
  `)
  .eq('id', accountId)
  .single();
```

## Related Files

From repository scan:

- `/packages/features/*/src/server/services/*.service.ts`: Service implementations
- `/packages/features/*/src/server/actions/*-server-actions.ts`: Server action handlers
- `/packages/features/*/src/server/api.ts`: API class definitions
- `/packages/next/src/actions/index.ts`: enhanceAction implementation
- `/packages/features/admin/src/lib/server/services/*.test.ts`: Service test examples

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `createXService is not a function` | Missing export or incorrect import | Verify factory function export and path |
| Authentication redirects unexpectedly | Missing/expired session | Check `auth: true` in enhanceAction config |
| Partial data saved, inconsistent state | Multi-step operation failure | Use database transactions or RPC functions |
| Slow queries, timeouts | N+1 queries, missing indexes | Use joins, add indexes, implement caching |

## See Also

- [[project-architecture]]: Overall application structure
- [[database-patterns]]: Database access and RLS patterns
- [[testing-strategy]]: Comprehensive testing approaches
- [[error-handling]]: Error management strategies
- [[performance-optimization]]: Performance best practices
