---
id: "api-patterns"
title: "API Implementation Patterns"
version: "1.0.0"
category: "api"
description: "Detailed implementation patterns for API endpoints and server actions"
tags: ["patterns", "implementation", "examples"]
dependencies: ["api-endpoints"]
created: "2025-09-12"
last_updated: "2025-09-12"
---

# API Implementation Patterns

This document contains detailed implementation examples referenced in the main API documentation.

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

## Pagination Implementation

### Full Pagination with Supabase

```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export const listItemsAction = enhanceAction(
  async (params: PaginationParams, user) => {
    const client = getSupabaseServerClient();
    
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const orderBy = params.orderBy || 'created_at';
    const order = params.order || 'desc';
    
    let query = client
      .from('items')
      .select('*', { count: 'exact' });
    
    // Add search filter if provided
    if (params.search) {
      query = query.ilike('name', `%${params.search}%`);
    }
    
    // Apply pagination
    const { data, count, error } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order(orderBy, { ascending: order === 'asc' });
    
    if (error) throw error;
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return {
      data: data || [],
      pagination: {
        current_page: page,
        per_page: limit,
        total_pages: totalPages,
        total_count: count || 0,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    };
  },
  {
    schema: PaginationSchema,
  }
);
```

## Transaction Pattern

```typescript
export const complexTransactionAction = enhanceAction(
  async (data, user) => {
    const client = getSupabaseServerClient();
    
    // Start transaction using RPC function
    const { data: result, error } = await client.rpc(
      'process_complex_transaction',
      {
        user_id: user.id,
        step1_data: data.step1,
        step2_data: data.step2,
        step3_data: data.step3,
      }
    );
    
    if (error) {
      // Transaction automatically rolled back
      throw error;
    }
    
    return { success: true, result };
  },
  {
    schema: TransactionSchema,
  }
);
```

## File Upload Pattern

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
    
    // Save reference in database
    const { error: dbError } = await client
      .from('user_files')
      .insert({
        user_id: user.id,
        file_path: filePath,
        file_url: publicUrl,
        file_name: data.file.name,
        file_size: data.file.size,
      });
    
    if (dbError) throw dbError;
    
    return { url: publicUrl };
  },
  {
    schema: FileUploadSchema,
  }
);
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
      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;
      default:
        console.log('Unhandled webhook event:', data.event);
    }
    
    return new Response('OK', { status: 200 });
  },
  {
    auth: false,
  }
);
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
    expect(mockClient.insert).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: mockData });
  });
});
```