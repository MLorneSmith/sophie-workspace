---
# Identity
id: "react-query-advanced"
title: "Advanced React Query Patterns"
version: "1.0.0"
category: "pattern"

# Discovery
description: "Advanced TanStack Query v5 patterns including infinite queries, dependent queries, real-time subscriptions, and parallel queries"
tags: ["tanstack-query", "react-query", "infinite-queries", "realtime", "parallel-queries", "supabase", "advanced"]

# Relationships
dependencies: ["react-query-patterns", "supabase-patterns"]
cross_references:
  - id: "react-query-patterns"
    type: "prerequisite"
    description: "Core patterns and setup required before using advanced patterns"
  - id: "supabase-patterns"
    type: "related"
    description: "Supabase real-time subscriptions integration"

# Maintenance
created: "2025-01-14"
last_updated: "2025-01-14"
author: "create-context"
---

# Advanced React Query Patterns

This document covers advanced TanStack Query v5 patterns for complex use cases. Before using these patterns, ensure you're familiar with the [core React Query patterns](./react-query-patterns.md).

## Infinite Queries

Infinite queries enable pagination with automatic loading of additional pages. TanStack Query v5 requires `initialPageParam` to be explicitly defined.

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

### Usage in Components

```typescript
function InfinitePostsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: fetchPosts,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });

  if (isPending) return <LoadingSpinner />;

  return (
    <div>
      {data?.pages.map((page) =>
        page.map((post) => <PostItem key={post.id} post={post} />)
      )}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Dependent Queries

Dependent queries only execute when their dependencies are available. Use the `enabled` option to control query execution.

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

### Multi-Level Dependencies

```typescript
function ComplexProfile({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: () => getSettings(user.id),
    enabled: !!user?.id,
  });

  const { data: preferences } = useQuery({
    queryKey: ['preferences', settings?.id],
    queryFn: () => getPreferences(settings.id),
    enabled: !!settings?.id,
  });

  return <div>{/* Render with cascading data */}</div>;
}
```

## Real-time Subscriptions with Supabase

Integrate Supabase real-time subscriptions with React Query to automatically update cached data when the database changes.

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

### Optimized Real-time Updates

For better performance, update the cache directly instead of invalidating:

```typescript
function useOptimizedRealtimeQuery(table: string, queryKey: string[]) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload) => {
          // Add new record to cache
          queryClient.setQueryData(queryKey, (old: any[] = []) => [
            ...old,
            payload.new,
          ]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        (payload) => {
          // Update existing record
          queryClient.setQueryData(queryKey, (old: any[] = []) =>
            old.map((item) =>
              item.id === payload.new.id ? payload.new : item
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table },
        (payload) => {
          // Remove deleted record
          queryClient.setQueryData(queryKey, (old: any[] = []) =>
            old.filter((item) => item.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, table, queryKey]);
}
```

## Parallel Queries

Execute multiple queries simultaneously using `useQueries` for better performance.

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

  const isPending = results.some(result => result.isPending);
  const hasError = results.some(result => result.isError);

  if (isPending) return <LoadingSpinner />;
  if (hasError) return <ErrorMessage />;

  return <DashboardContent data={results} />;
}
```

### Dynamic Parallel Queries

When the number of queries is determined at runtime:

```typescript
function UserPosts({ userIds }: { userIds: string[] }) {
  const results = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user', id, 'posts'],
      queryFn: () => getUserPosts(id),
      staleTime: 2 * 60 * 1000,
    })),
  });

  const allLoaded = results.every((r) => !r.isPending);
  const hasError = results.some((r) => r.isError);

  if (!allLoaded) return <LoadingSpinner />;
  if (hasError) return <ErrorMessage />;

  return (
    <div>
      {results.map((result, index) => (
        <UserPostList key={userIds[index]} posts={result.data} />
      ))}
    </div>
  );
}
```

## Best Practices

1. **Infinite Queries**: Always define `initialPageParam` in v5
2. **Dependent Queries**: Use `enabled` to prevent unnecessary fetches
3. **Real-time**: Consider cache updates vs. invalidation for performance
4. **Parallel Queries**: Use `useQueries` for multiple simultaneous fetches
5. **Type Safety**: Leverage TypeScript for all query functions
6. **Error Handling**: Handle errors at both individual and aggregate levels
7. **Performance**: Set appropriate `staleTime` for each query's data freshness needs

## Related Files

- `/apps/web/components/react-query-provider.tsx`: QueryClient provider configuration
- `/packages/supabase/src/hooks/`: Supabase-specific hooks with real-time support

## See Also

- [react-query-patterns.md](./react-query-patterns.md) - Core React Query patterns and setup
- [database-patterns.md](./database-patterns.md) - Supabase client configuration and real-time subscriptions
- [TanStack Query v5 Docs](https://tanstack.com/query/latest)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
