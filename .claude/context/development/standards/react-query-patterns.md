---
# Identity
id: "react-query-patterns"
title: "React Query Patterns and Best Practices"
version: "2.0.0"
category: "pattern"

# Discovery
description: "Comprehensive guide for TanStack Query v5 patterns with Next.js 15 and Supabase integration"
tags: ["tanstack-query", "react-query", "data-fetching", "ssr", "hydration", "supabase", "nextjs", "caching", "mutations"]

# Relationships
dependencies: ["supabase-patterns", "nextjs-patterns", "server-actions"]
cross_references:
  - id: "server-actions"
    type: "related"
    description: "Server actions are commonly used with mutations"
  - id: "supabase-patterns"
    type: "prerequisite"
    description: "Supabase client setup required for queries"
  - id: "typescript-patterns"
    type: "related"
    description: "TypeScript integration for type-safe queries"

# Maintenance
created: "2025-01-14"
last_updated: "2025-09-15"
author: "create-context"
---

# React Query Patterns and Best Practices

## Overview

This guide provides comprehensive patterns for using TanStack Query v5 (formerly React Query) with Next.js 15 and Supabase. TanStack Query v5 introduces significant API changes including `isPending` instead of `isLoading`, `gcTime` instead of `cacheTime`, and stricter TypeScript patterns for improved developer experience and performance.

## Key Concepts

### Core Terminology
- **Query**: Declarative dependency on an asynchronous data source tied to a unique key
- **Mutation**: Function that performs side effects and optionally invalidates queries
- **Query Key**: Unique identifier for queries, should be hierarchical and serializable
- **Query Client**: Central store managing all queries and mutations
- **Hydration**: Process of transferring server-fetched data to client
- **Stale Time**: Duration data is considered fresh (no refetches)
- **GC Time**: Duration inactive data remains in cache before garbage collection

### Query States (v5 Changes)
- **`isPending`**: Query is currently executing (was `isLoading` in v4)
- **`isStale`**: Data is outdated based on `staleTime`
- **`isFetching`**: Background refetch in progress
- **`isError`**: Query encountered an error
- **`isSuccess`**: Query completed successfully
- **`isPlaceholderData`**: Using placeholder data while fetching

## Project Setup

### Provider Configuration

Our app uses a custom ReactQueryProvider configured for SSR:

```tsx
// apps/web/components/react-query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider(props: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevents immediate refetching on client after SSR
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
```

## Data Fetching Patterns

### Query Function Structure

Always structure Supabase query functions in a reusable way:

```typescript
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@kit/supabase/database';

type TypedSupabaseClient = SupabaseClient<Database>;

// Simple query function
export function getData(client: TypedSupabaseClient) {
  return client
    .from('table_name')
    .select(`*`) // Or specific columns
    .throwOnError(); // Important for error handling
}

// Query with parameters
export function getDataById(client: TypedSupabaseClient, id: string) {
  return client
    .from('table_name')
    .select(`*`)
    .eq('id', id)
    .throwOnError()
    .single();
}

// Query with joins
export function getDataWithRelations(client: TypedSupabaseClient) {
  return client
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id,
        name,
        avatar_url
      ),
      comments(
        id,
        content,
        created_at
      )
    `)
    .throwOnError();
}
```

### Query Key Factories

Use query key factories for maintainable cache management:

```typescript
// Query key factory pattern
const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

// Usage
useQuery({ queryKey: postKeys.detail(postId), queryFn: () => getPost(postId) });
```

### Using Queries in Components

```typescript
// Example from packages/features/accounts/src/hooks/use-personal-account-data.ts
export function usePersonalAccountData(
  userId: string,
  partialAccount?: PartialAccount,
) {
  const client = useSupabase();
  const queryKey = ["account:data", userId];

  const queryFn = async () => {
    if (!userId) return null;

    const response = await client
      .from("accounts")
      .select(`id, name, picture_url, public_data`)
      .eq("primary_owner_user_id", userId)
      .eq("is_personal_account", true)
      .single();

    if (response.error) throw response.error;
    return response.data;
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!userId, // Conditional fetching
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: partialAccount?.id ? partialAccount : undefined,
  });
}
```

## Server Actions Integration

### Action Definition with enhanceAction

Use the `enhanceAction` helper for all server actions:

```typescript
// Server action with validation and auth
export const createItemAction = enhanceAction(
  async function (data, user) {
    const supabase = getSupabaseServerClient();
    const logger = await getLogger();
    const ctx = { name: 'createItem', userId: user.id };

    try {
      const result = await createItem(supabase, data);
      logger.info(ctx, 'Item created successfully');

      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error) {
      logger.error(ctx, 'Failed to create item', { error });

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  },
  {
    auth: true, // Requires authentication
    schema: CreateItemSchema, // Zod schema for validation
    captcha: false, // Optional CAPTCHA validation
  },
);
```

### Mutations with Server Actions

```typescript
function CreateItemComponent() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateItemInput) => {
      const result = await createItemAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['items'] });

      // Or update cache directly
      queryClient.setQueryData(['items', data.id], data);

      toast.success('Item created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      mutation.mutate(Object.fromEntries(formData));
    }}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Creating...' : 'Create Item'}
      </button>
    </form>
  );
}
```

## Optimistic Updates

### Pattern 1: Simple Optimistic Update

```typescript
const updateMutation = useMutation({
  mutationFn: updateItem,
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['items', variables.id] });

    // Snapshot previous value
    const previousItem = queryClient.getQueryData(['items', variables.id]);

    // Optimistically update
    queryClient.setQueryData(['items', variables.id], (old) => ({
      ...old,
      ...variables,
    }));

    return { previousItem };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousItem) {
      queryClient.setQueryData(['items', variables.id], context.previousItem);
    }
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

### Pattern 2: List Optimistic Updates

```typescript
const addItemMutation = useMutation({
  mutationFn: createItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ['items'] });

    const previousItems = queryClient.getQueryData(['items']);

    // Add optimistically
    queryClient.setQueryData(['items'], (old) => [...(old || []), newItem]);

    return { previousItems };
  },
  onError: (err, newItem, context) => {
    queryClient.setQueryData(['items'], context.previousItems);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

## SSR and Hydration

### Server Component Prefetching

```typescript
// app/posts/page.tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PostsList } from './_components/posts-list';

export default async function PostsPage() {
  const queryClient = new QueryClient();
  const supabase = getSupabaseServerClient();

  // Prefetch data on server
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: () => getPosts(supabase),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostsList />
    </HydrationBoundary>
  );
}
```

### Parallel Prefetching

```typescript
export async function prefetchDashboardData() {
  const supabase = getSupabaseServerClient();
  const queryClient = new QueryClient();

  // Parallel prefetching for performance
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['user-stats'],
      queryFn: () => getUserStats(supabase),
    }),
    queryClient.prefetchQuery({
      queryKey: ['recent-activity'],
      queryFn: () => getRecentActivity(supabase),
    }),
    queryClient.prefetchQuery({
      queryKey: ['notifications'],
      queryFn: () => getNotifications(supabase),
    }),
  ]);

  return queryClient;
}
```

## Advanced Patterns

### Infinite Queries

```typescript
// v5 requires initialPageParam
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['posts', 'infinite'],
  queryFn: async ({ pageParam }) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(pageParam * 10, (pageParam + 1) * 10 - 1);

    if (error) throw error;
    return data;
  },
  initialPageParam: 0, // Required in v5
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.length === 10 ? allPages.length : undefined;
  },
});
```

### Dependent Queries

```typescript
function UserProfile({ userId }: { userId: string }) {
  // First query
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  // Dependent query - only runs when user is available
  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => getUserPosts(user.id),
    enabled: !!user?.id, // Only fetch when user.id exists
  });

  return <div>{/* Render user and posts */}</div>;
}
```

### Real-time Subscriptions with Supabase

```typescript
function useRealtimeQuery(table: string, queryKey: string[]) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          // Invalidate queries when data changes
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, table, queryKey]);
}
```

### Parallel Queries

```typescript
function Dashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['stats'],
        queryFn: fetchStats,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
        staleTime: 1 * 60 * 1000,
      },
      {
        queryKey: ['activities'],
        queryFn: fetchActivities,
        staleTime: 30 * 1000,
      },
    ],
  });

  const isLoading = results.some(result => result.isLoading);
  const hasError = results.some(result => result.isError);

  if (isLoading) return <LoadingSpinner />;
  if (hasError) return <ErrorMessage />;

  return <DashboardContent data={results} />;
}
```

## TypeScript Integration

### Database Types

Always use the Database type from Supabase:

```typescript
import { type Database } from '@kit/supabase/database';

// Table types
type Item = Database['public']['Tables']['items']['Row'];
type ItemInsert = Database['public']['Tables']['items']['Insert'];
type ItemUpdate = Database['public']['Tables']['items']['Update'];

// Enum types
type Status = Database['public']['Enums']['status'];

// Function return types
type FunctionResult = Database['public']['Functions']['calculate_total']['Returns'];
```

### Type-Safe Query Hooks

```typescript
// Custom hook with proper typing
function useItems(filters?: ItemFilters) {
  const supabase = useSupabase();

  return useQuery<Item[], Error>({
    queryKey: ['items', filters],
    queryFn: async () => {
      let query = supabase.from('items').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.throwOnError();
      return data;
    },
  });
}
```

## Error Handling

### Query Error Boundaries

```typescript
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function MyApp() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>Something went wrong: {error.message}</p>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          <App />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

### Mutation Error Handling

```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  onError: (error, variables, context) => {
    // Log to error tracking service
    logger.error('Mutation failed', { error, variables });

    // Show user-friendly message
    if (error.code === 'PGRST116') {
      toast.error('Item not found');
    } else if (error.code === '23505') {
      toast.error('This item already exists');
    } else {
      toast.error('An unexpected error occurred');
    }
  },
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
});
```

## Performance Optimization

### Query Data Selectors

```typescript
// Avoid unnecessary re-renders with select
const { data: userName } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => getUser(userId),
  select: (data) => data.name, // Only subscribe to name changes
});
```

### Placeholder Data

```typescript
const { data } = useQuery({
  queryKey: ['post', postId],
  queryFn: () => getPost(postId),
  placeholderData: (previousData) => previousData, // Keep previous data while fetching
});
```

### Query Suspension

```typescript
// For React Suspense integration
const { data } = useSuspenseQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
});
```

## Common Troubleshooting

### Issue: Hydration Mismatch
**Symptoms**: "Text content does not match server-rendered HTML"
**Cause**: Server and client data differ due to timing or authentication
**Solution**:
```typescript
// Ensure consistent staleTime between server and client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // Same on server and client
      refetchOnMount: false, // Prevent immediate refetch
    },
  },
});
```

### Issue: Stale Closures in Mutations
**Symptoms**: Mutations use outdated state values
**Cause**: Closure captures old values
**Solution**:
```typescript
// Use function updates or fresh values
const mutation = useMutation({
  mutationFn: updateItem,
  onSuccess: (data) => {
    // Use function update to ensure fresh state
    queryClient.setQueryData(['items'], (old) =>
      old ? [...old, data] : [data]
    );
  },
});
```

### Issue: Memory Leaks
**Symptoms**: Increasing memory usage, slow performance
**Cause**: QueryClient instances not cleaned up
**Solution**:
```typescript
// Create QueryClient once, not on every render
const [queryClient] = useState(() => new QueryClient());
```

### Issue: Race Conditions
**Symptoms**: Inconsistent data after rapid mutations
**Cause**: Overlapping requests without cancellation
**Solution**:
```typescript
// Cancel in-flight queries before mutations
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: ['items'] });
  // ... rest of optimistic update
}
```

## Related Files

From repository analysis:
- `/apps/web/components/react-query-provider.tsx`: Main QueryClient provider setup
- `/packages/features/accounts/src/hooks/use-personal-account-data.ts`: Example of typed query hook
- `/packages/next/src/actions/index.ts`: enhanceAction helper for server actions
- `/packages/supabase/src/hooks/`: Various Supabase-specific hooks

## Best Practices Summary

1. **Query Keys**: Use hierarchical factories for maintainable cache management
2. **Error Handling**: Always use `throwOnError()` in Supabase queries
3. **Loading States**: Handle `isPending`, `isFetching`, and error states
4. **TypeScript**: Leverage Database types for full type safety
5. **SSR**: Set appropriate `staleTime` to prevent hydration issues
6. **Mutations**: Use optimistic updates for better UX
7. **Performance**: Use query selectors and placeholder data
8. **Testing**: Mock with MSW, not at the query level
9. **Real-time**: Integrate Supabase subscriptions with cache invalidation
10. **Forms**: Combine with Zod schemas and server actions

## See Also

- [[server-actions]]: Server action patterns with enhanceAction
- [[supabase-patterns]]: Supabase client configuration and patterns
- [[typescript-patterns]]: TypeScript best practices
- [[testing-patterns]]: Testing React Query with MSW
- [TanStack Query v5 Docs](https://tanstack.com/query/latest)
- [Supabase Cache Helpers](https://github.com/psteinroe/supabase-cache-helpers)