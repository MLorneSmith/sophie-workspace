---
id: "server-actions"
title: "Server Actions"
version: "1.0.0"
category: "pattern"
description: "Server action patterns, enhanceAction wrapper, service architecture, and API implementation best practices"
tags: ["server-actions", "api", "nextjs", "enhanceAction", "service-patterns", "validation", "authentication"]
created: "2025-11-14"
last_updated: "2025-11-14"
author: "consolidation"
---

# Server Actions

This document consolidates server action patterns, API conventions, service architecture, and implementation best practices for the SlideHeroes platform.

## Overview

SlideHeroes uses Next.js App Router with server actions (via `enhanceAction`) and minimal API routes. All server actions follow a hybrid service architecture combining class-based services for business logic with functional server actions for request handling.

## Core Pattern

### Server Action Pattern

```typescript
import { enhanceAction } from "@kit/next/actions";

export const action = enhanceAction(
  async (data, user) => {
    // Auto-validated, authenticated, CAPTCHA checked
    const result = await performOperation(data, user.id);
    revalidatePath('/path');
    return { success: true, data: result };
  },
  { schema: ZodSchema, auth: true, captcha: false }
);
```

### Authentication Clients

- **Client**: `createBrowserClient` from `@kit/supabase/browser-client`
- **Server**: `getSupabaseServerClient` from `@kit/supabase/server-client`
- **Admin**: `getSupabaseServerAdminClient` from `@kit/supabase/server-admin-client`

## Service Architecture

### Hybrid Approach

The codebase strategically uses:

- **Class-based services** for complex business logic and stateful operations
- **Factory functions** for dependency injection and service instantiation
- **Functional server actions** for request handling and validation
- **Functional composition** for combining simple operations

### Service Pattern with Factory Functions

```typescript
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

### Server Action Integration

```typescript
"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { CreateTeamSchema } from "../../schema/create-team.schema";
import { createCreateTeamAccountService } from "../services/create-team-account.service";

export const createTeamAccountAction = enhanceAction(
  async ({ name }, user) => {
    const client = getSupabaseServerClient();
    const service = createCreateTeamAccountService(client);

    const { data, error } = await service.createNewOrganizationAccount({
      name,
      userId: user.id,
    });

    if (error) {
      return { error: true };
    }

    const accountHomePath = `/home/${data.slug}`;
    redirect(accountHomePath);
  },
  {
    schema: CreateTeamSchema,
    auth: true,
    captcha: false
  }
);
```

## Complete Server Action Example

```typescript
"use server";

import { enhanceAction } from "@kit/next/actions";
import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { redirect } from "next/navigation";
import { z } from "zod";

const { getLogger } = createServiceLogger("MY-SERVICE");

const MyActionSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  amount: z.number().positive().optional(),
});

export const myCompleteAction = enhanceAction(
  async (data, user) => {
    const logger = getLogger();
    const client = getSupabaseServerClient();

    const ctx = {
      name: "my-action",
      userId: user.id,
      data: data.name,
    };

    logger.info(ctx, "Starting action...");

    try {
      // Database operation
      const { data: result, error } = await client
        .from('my_table')
        .insert({
          user_id: user.id,
          name: data.name,
          email: data.email,
          amount: data.amount,
        })
        .select()
        .single();

      if (error) {
        logger.error({ ...ctx, error }, "Database operation failed");
        throw error;
      }

      logger.info(ctx, "Action completed successfully");

      // Redirect on success
      redirect(`/success?id=${result.id}`);
    } catch (error) {
      logger.error({ ...ctx, error }, "Action failed");

      return {
        error: true,
        message: "Operation failed",
      };
    }
  },
  {
    schema: MyActionSchema,
    auth: true,
    captcha: false,
  }
);
```

## API Routes (Minimal)

Server actions are preferred, but API routes are used for specific cases:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | None | Health check |
| `/api/billing/webhook` | POST | Signature | Stripe/Lemon webhooks |
| `/api/db/webhook` | POST | Signature | Supabase webhooks |
| `/api/ai-usage/session-cost` | POST | Bearer | AI usage tracking |

## Security Configuration

### Authentication

- Default: `auth: true` on all server actions
- Admin actions require `admin:panel` permission
- Public actions need `auth: false` + optional `captcha: true`

### Validation

All actions use Zod schemas:

```typescript
const Schema = z.object({
  field: z.string().min(1).max(100)
});
```

### Rate Limits

- **Public**: 100 req/min/IP
- **Authenticated**: 1000 req/hr/user
- **Admin**: 5000 req/hr/user
- **AI**: Based on subscription
- **Webhooks**: No limit (signature required)

## Common Patterns

### Pagination

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export const listItemsAction = enhanceAction(
  async (params: PaginationParams, user) => {
    const client = getSupabaseServerClient();

    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const orderBy = params.orderBy || 'created_at';
    const order = params.order || 'desc';

    const { data, count, error } = await client
      .from('items')
      .select('*', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)
      .order(orderBy, { ascending: order === 'asc' });

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        current_page: page,
        total_pages: Math.ceil((count || 0) / limit),
        total_count: count || 0,
      },
    };
  },
  { schema: PaginationSchema }
);
```

### File Upload

```typescript
export const uploadFileAction = enhanceAction(
  async (data: { file: File, folder: string }, user) => {
    const client = getSupabaseServerClient();

    // Generate unique filename
    const fileExt = data.file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${data.folder}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await client.storage
      .from('uploads')
      .upload(filePath, data.file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = client.storage
      .from('uploads')
      .getPublicUrl(filePath);

    return { url: publicUrl };
  },
  { schema: FileUploadSchema }
);
```

### Redirect After Action

```typescript
redirect(`/success?id=${result.id}`);
```

### Revalidation

```typescript
revalidatePath('/home/[account]', 'layout');
```

## Service Composition

Compose multiple services for complex operations:

```typescript
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

## Error Handling

### Format

```typescript
{ error: true, message?: string, code?: string, details?: any }
```

### Common Codes

`validation_failed`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `rate_limit_exceeded`, `internal_error`

### Result Pattern

```typescript
type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

class UserService {
  async updateProfile(userId: string, data: ProfileData): Promise<ServiceResult<User>> {
    const validation = profileSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: "Invalid data", code: "VALIDATION_ERROR" };
    }
    // Perform operation
  }
}
```

## Webhook Handler Pattern

```typescript
import { enhanceRouteHandler } from "@kit/next/routes";
import { headers } from "next/headers";
import crypto from "crypto";

export const POST = enhanceRouteHandler(
  async ({ request }) => {
    const body = await request.text();
    const signature = headers().get('x-webhook-signature');

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return new Response('Invalid signature', { status: 401 });
    }

    const data = JSON.parse(body);

    // Process webhook
    switch (data.event) {
      case 'payment.completed':
        await handlePaymentCompleted(data);
        break;
      default:
        console.log('Unhandled webhook event:', data.event);
    }

    return new Response('OK', { status: 200 });
  },
  { auth: false }
);
```

## Performance Optimization

### Parallel Data Fetching

```typescript
// ✅ Parallel fetching example (60-80% faster)
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

## Testing Server Actions

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { myAction } from "./server-actions";

// Mock dependencies
vi.mock("@kit/next/actions", () => ({
  enhanceAction: (fn: Function, _config: any) => fn,
}));

vi.mock("@kit/supabase/server-client", () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe("myAction", () => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getSupabaseServerClient as any).mockReturnValue(mockClient);
  });

  it("should create a record successfully", async () => {
    const mockData = { id: "123", name: "Test" };
    mockClient.single.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await myAction(
      { name: "Test" },
      { id: "user123", email: "test@example.com" }
    );

    expect(mockClient.from).toHaveBeenCalledWith("my_table");
    expect(result).toEqual({ success: true, data: mockData });
  });
});
```

## Architecture Notes

- **Prefer server actions** over API routes
- **API routes only for**: webhooks, health checks, file ops, 3rd party integrations
- **All actions use** `enhanceAction` wrapper
- **RLS enforced** unless using admin client

## Related Files

- [Architecture Overview](./architecture-overview.md) - System architecture
- [Database Patterns](./database-patterns.md) - RLS and migrations
- `/packages/next/src/actions/index.ts` - enhanceAction implementation
- `/packages/features/*/src/server/actions/` - Server action examples
- `/packages/features/*/src/server/services/` - Service implementations
