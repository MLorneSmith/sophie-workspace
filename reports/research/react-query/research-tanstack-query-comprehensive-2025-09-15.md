# Comprehensive Research: TanStack Query v5 Patterns and Integration

**Research Date:** September 15, 2025
**Focus:** React Query patterns, TanStack Query v5, Next.js 15 & Supabase integration
**Scope:** Core concepts, implementation patterns, troubleshooting, best practices

## Executive Summary

TanStack Query v5 represents a significant evolution in data-fetching libraries with streamlined APIs, improved TypeScript support, and enhanced SSR capabilities. This research provides comprehensive guidance for AI agents and developers on implementing robust data-fetching patterns with Next.js 15 and Supabase.

**Key Findings:**

- TanStack Query v5 introduces breaking API changes requiring migration planning
- Hierarchical query key patterns and factories are essential for maintainable applications
- SSR/hydration issues require specific patterns to avoid mismatches
- Integration with Supabase real-time features requires careful cache invalidation strategies

## 1. Core Concepts and Definitions

### Query Lifecycle and States

TanStack Query v5 manages queries through distinct lifecycle states:

- **`isPending`** (formerly `isLoading`): Query is currently executing
- **`isStale`**: Data is considered outdated based on `staleTime`
- **`isFetching`**: Background refetch in progress
- **`isError`**: Query encountered an error
- **`isSuccess`**: Query completed successfully

**Critical Change in v5:** `isLoading` renamed to `isPending` for clearer semantics.

```typescript
const { data, isPending, isError, error } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

### Mutation Patterns

**v5 Mutation Syntax:**

```typescript
const mutation = useMutation({
  mutationFn: (newPost) => createPost(newPost),
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  },
  onError: (error) => {
    console.error('Mutation failed:', error)
  }
})
```

### Cache Management and Optimization

**Key Configuration Options:**

- **`staleTime`**: How long data is considered fresh (default: 0)
- **`gcTime`** (formerly `cacheTime`): How long unused data stays in cache (default: 5 minutes)
- **`refetchOnWindowFocus`**: Refetch when window regains focus (default: true)
- **`refetchOnMount`**: Refetch when component mounts (default: true)

## 2. Implementation Patterns and Best Practices

### Server-Side Rendering with Hydration

**Next.js 15 App Router Pattern:**

```typescript
// app/layout.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Server Component Data Prefetching:**

```typescript
// app/posts/page.tsx
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { PostsList } from './posts-list'

export default async function PostsPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: () => fetchPosts(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostsList />
    </HydrationBoundary>
  )
}
```

### Optimistic Updates Pattern

```typescript
const updatePostMutation = useMutation({
  mutationFn: updatePost,
  onMutate: async (variables) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['posts', variables.id] })

    // Snapshot previous value
    const previousPost = queryClient.getQueryData(['posts', variables.id])

    // Optimistically update
    queryClient.setQueryData(['posts', variables.id], {
      ...previousPost,
      ...variables
    })

    return { previousPost }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousPost) {
      queryClient.setQueryData(['posts', variables.id], context.previousPost)
    }
  },
  onSettled: (data, error, variables) => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['posts', variables.id] })
  },
})
```

### Infinite Queries and Pagination

**v5 Infinite Query Requirements:**

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  initialPageParam: 0, // REQUIRED in v5
  getNextPageParam: (lastPage, pages) => {
    return lastPage.hasMore ? pages.length : undefined
  },
})
```

### Parallel and Dependent Queries

**Parallel Queries:**

```typescript
function UserDashboard({ userId }) {
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  const postsQuery = useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => fetchUserPosts(userId)
  })

  const commentsQuery = useQuery({
    queryKey: ['comments', 'user', userId],
    queryFn: () => fetchUserComments(userId)
  })

  if (userQuery.isPending) return <div>Loading user...</div>

  return (
    <div>
      <UserProfile user={userQuery.data} />
      <UserPosts posts={postsQuery.data} isLoading={postsQuery.isPending} />
      <UserComments comments={commentsQuery.data} isLoading={commentsQuery.isPending} />
    </div>
  )
}
```

**Dependent Queries:**

```typescript
function UserPosts({ userId }) {
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  const postsQuery = useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!userQuery.data?.id, // Only run when user data is available
  })

  return (
    <div>
      {postsQuery.data?.map(post => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  )
}
```

### Background Refetching Strategies

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 1000 * 60 * 15, // 15 minutes for critical data
    },
  },
})
```

## 3. Common Troubleshooting Scenarios

### Hydration Mismatches

**Problem:** Server-rendered data doesn't match client-rendered data, causing hydration errors.

**Root Causes:**

- Stale server-side cache with newer client mutations
- Different query keys between server and client
- Time-sensitive data (timestamps, user-specific content)

**Solutions:**

```typescript
// 1. Align server/client cache timestamps
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Force refetch on mount for critical data
      refetchOnMount: true,
    },
  },
})

// 2. Skip hydration for dynamic content
function UserGreeting() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Hello, Guest!</div>
  }

  return <div>Hello, {user.name}!</div>
}

// 3. Use suspense boundaries for problematic components
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <DynamicContent />
    </Suspense>
  )
}
```

### Stale Closures in Mutations

**Problem:** Mutation callbacks capture outdated props or state values.

**Solution:**

```typescript
function EditPost({ postId, onSuccess }) {
  const queryClient = useQueryClient()

  // ❌ Bad - captures stale onSuccess
  const mutation = useMutation({
    mutationFn: updatePost,
    onSuccess: () => {
      onSuccess() // May be stale
    }
  })

  // ✅ Good - use current values
  const mutation = useMutation({
    mutationFn: updatePost,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] })
      // Pass current callback as ref or use query context
    }
  })
}
```

### Race Conditions

**Problem:** Overlapping requests cause inconsistent cache states.

**Solutions:**

```typescript
// 1. Cancel previous queries
const { data } = useQuery({
  queryKey: ['search', searchTerm],
  queryFn: ({ signal }) => searchPosts(searchTerm, { signal }),
  enabled: !!searchTerm,
})

// 2. Use keepPreviousData for smooth transitions
const { data, isPending } = useQuery({
  queryKey: ['posts', page],
  queryFn: () => fetchPosts(page),
  placeholderData: keepPreviousData,
})
```

### Memory Leaks

**Problem:** Multiple QueryClient instances or improper cleanup.

**Prevention:**

```typescript
// ✅ Singleton pattern for QueryClient
let globalQueryClient: QueryClient

function getQueryClient() {
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,
        },
      },
    })
  }
  return globalQueryClient
}

// ✅ Proper cleanup in SSR
function createSSRQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: false, // Disable retries in SSR
      },
    },
  })
}
```

## 4. Query Key Management Best Practices

### Hierarchical Key Structure

```typescript
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    posts: (id: string) => [...queryKeys.users.detail(id), 'posts'] as const,
  },
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    comments: (id: string) => [...queryKeys.posts.detail(id), 'comments'] as const,
  }
}
```

### Query Factories Pattern

```typescript
// Create reusable query configurations
export const userQueries = {
  all: () => ({
    queryKey: queryKeys.users.all,
    queryFn: fetchUsers,
  }),

  detail: (id: string) => ({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => fetchUser(id),
    staleTime: 5 * 60 * 1000,
  }),

  posts: (userId: string) => ({
    queryKey: queryKeys.users.posts(userId),
    queryFn: () => fetchUserPosts(userId),
    enabled: !!userId,
  }),
}

// Usage in components
function UserProfile({ userId }) {
  const { data: user } = useQuery(userQueries.detail(userId))
  const { data: posts } = useQuery(userQueries.posts(userId))

  return <div>{/* component content */}</div>
}
```

### Strategic Invalidation Patterns

```typescript
// Invalidate all user-related queries
queryClient.invalidateQueries({ queryKey: queryKeys.users.all })

// Invalidate specific user's data
queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })

// Invalidate user's posts only
queryClient.invalidateQueries({ queryKey: queryKeys.users.posts(userId) })

// Smart invalidation after mutations
const updateUserMutation = useMutation({
  mutationFn: updateUser,
  onSuccess: (updatedUser) => {
    // Update specific user in cache
    queryClient.setQueryData(
      queryKeys.users.detail(updatedUser.id),
      updatedUser
    )

    // Invalidate user lists to reflect changes
    queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
  },
})
```

## 5. Next.js 15 Integration Patterns

### App Router with Server Components

```typescript
// app/posts/loading.tsx
export default function Loading() {
  return <PostsListSkeleton />
}

// app/posts/error.tsx
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}

// app/posts/page.tsx
import { Suspense } from 'react'
import { PostsList } from '@/components/posts-list'
import { prefetchPosts } from '@/lib/queries'

export default async function PostsPage() {
  // Prefetch on server
  const dehydratedState = await prefetchPosts()

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense fallback={<PostsListSkeleton />}>
        <PostsList />
      </Suspense>
    </HydrationBoundary>
  )
}
```

### Client Components with TanStack Query

```typescript
// components/posts-list.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { postQueries } from '@/lib/queries'

export function PostsList() {
  const {
    data: posts,
    isPending,
    isError,
    error
  } = useQuery(postQueries.list())

  if (isPending) return <PostsListSkeleton />
  if (isError) return <ErrorMessage error={error} />

  return (
    <div className="space-y-4">
      {posts?.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

## 6. Supabase Integration Patterns

### Real-time Subscriptions with Cache Updates

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabaseClient } from '@/hooks/use-supabase'

function usePostsWithRealtime() {
  const supabase = useSupabaseClient()
  const queryClient = useQueryClient()

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          queryClient.setQueryData(['posts'], (old: Post[] = []) =>
            [payload.new as Post, ...old]
          )
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          queryClient.setQueryData(['posts'], (old: Post[] = []) =>
            old.map(post =>
              post.id === payload.new.id ? payload.new as Post : post
            )
          )
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          queryClient.setQueryData(['posts'], (old: Post[] = []) =>
            old.filter(post => post.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, queryClient])

  return postsQuery
}
```

### Supabase Cache Helpers Integration

```typescript
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSupabaseClient } from '@/hooks/use-supabase'

function PostsList() {
  const supabase = useSupabaseClient()

  const { data: posts, isPending } = useQuery(
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false }),
    {
      staleTime: 5 * 60 * 1000,
    }
  )

  if (isPending) return <div>Loading...</div>

  return (
    <div>
      {posts?.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

## 7. Form Library Integration Patterns

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
})

type PostForm = z.infer<typeof postSchema>

function CreatePostForm() {
  const queryClient = useQueryClient()

  const form = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  })

  const createPostMutation = useMutation({
    mutationFn: (data: PostForm) => createPost(data),
    onSuccess: (newPost) => {
      // Update cache with new post
      queryClient.setQueryData(['posts'], (old: Post[] = []) => [
        newPost,
        ...old,
      ])

      // Reset form
      form.reset()

      // Show success message
      toast.success('Post created successfully!')
    },
    onError: (error) => {
      toast.error('Failed to create post')
    },
  })

  const onSubmit = (data: PostForm) => {
    createPostMutation.mutate(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          {...form.register('title')}
          disabled={createPostMutation.isPending}
        />
        {form.formState.errors.title && (
          <span className="error">{form.formState.errors.title.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          {...form.register('content')}
          disabled={createPostMutation.isPending}
        />
        {form.formState.errors.content && (
          <span className="error">{form.formState.errors.content.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={createPostMutation.isPending}
      >
        {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  )
}
```

### TanStack Form Integration

```typescript
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'

function EditPostForm({ post }: { post: Post }) {
  const queryClient = useQueryClient()

  const updatePostMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(['posts', post.id], updatedPost)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const form = useForm({
    defaultValues: {
      title: post.title,
      content: post.content,
    },
    onSubmit: async ({ value }) => {
      await updatePostMutation.mutateAsync({
        id: post.id,
        ...value,
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field
        name="title"
        validators={{
          onChange: ({ value }) =>
            !value ? 'Title is required' : undefined,
        }}
      >
        {(field) => (
          <div>
            <label htmlFor={field.name}>Title:</label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors && (
              <em>{field.state.meta.errors}</em>
            )}
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <button type="submit" disabled={!canSubmit}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        )}
      </form.Subscribe>
    </form>
  )
}
```

## 8. Testing Strategies

### Unit Testing with MSW

```typescript
// __tests__/setup.ts
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// __tests__/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/posts', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', title: 'Test Post 1', content: 'Content 1' },
        { id: '2', title: 'Test Post 2', content: 'Content 2' },
      ])
    )
  }),

  rest.post('/api/posts', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '3',
        title: 'New Post',
        content: 'New Content',
      })
    )
  }),
]

// __tests__/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Component Testing

```typescript
// __tests__/components/posts-list.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostsList } from '@/components/posts-list'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

const renderWithQuery = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('PostsList', () => {
  it('renders posts when data is loaded', async () => {
    renderWithQuery(<PostsList />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Test Post 2')).toBeInTheDocument()
  })

  it('handles error state', async () => {
    server.use(
      rest.get('/api/posts', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    renderWithQuery(<PostsList />)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### Custom Hook Testing

```typescript
// __tests__/hooks/use-posts.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePosts } from '@/hooks/use-posts'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('usePosts', () => {
  it('returns posts data', async () => {
    const { result } = renderHook(() => usePosts(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data[0].title).toBe('Test Post 1')
  })
})
```

## 9. Performance Optimization Patterns

### Selective Query Subscription

```typescript
// Only subscribe to specific parts of query state
function PostTitle({ postId }: { postId: string }) {
  const title = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetchPost(postId),
    select: (post) => post.title, // Only re-render when title changes
    staleTime: 5 * 60 * 1000,
  })

  return <h1>{title.data}</h1>
}
```

### Query Data Transformation

```typescript
// Transform data at query level to avoid component re-processing
function useUserPosts(userId: string) {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => fetchUserPosts(userId),
    select: (posts) => ({
      published: posts.filter(post => post.status === 'published'),
      drafts: posts.filter(post => post.status === 'draft'),
      total: posts.length,
    }),
    staleTime: 2 * 60 * 1000,
  })
}
```

### Parallel Data Fetching

```typescript
// Fetch related data in parallel
function UserDashboard({ userId }: { userId: string }) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['user', userId],
        queryFn: () => fetchUser(userId),
      },
      {
        queryKey: ['posts', 'user', userId],
        queryFn: () => fetchUserPosts(userId),
      },
      {
        queryKey: ['analytics', 'user', userId],
        queryFn: () => fetchUserAnalytics(userId),
      },
    ],
    combine: (results) => ({
      data: {
        user: results[0].data,
        posts: results[1].data,
        analytics: results[2].data,
      },
      isPending: results.some(result => result.isPending),
      isError: results.some(result => result.isError),
    }),
  })

  if (queries.isPending) return <DashboardSkeleton />
  if (queries.isError) return <ErrorMessage />

  return (
    <div>
      <UserProfile user={queries.data.user} />
      <PostsSection posts={queries.data.posts} />
      <AnalyticsSection analytics={queries.data.analytics} />
    </div>
  )
}
```

## 10. Advanced Patterns

### Query Middleware Pattern

```typescript
// Create reusable query middleware
function withErrorHandling<T>(queryFn: () => Promise<T>) {
  return async () => {
    try {
      return await queryFn()
    } catch (error) {
      if (error instanceof AuthError) {
        // Redirect to login
        window.location.href = '/login'
      }
      throw error
    }
  }
}

// Usage
const { data } = useQuery({
  queryKey: ['protected-data'],
  queryFn: withErrorHandling(() => fetchProtectedData()),
})
```

### Query Composition Pattern

```typescript
// Compose multiple queries into a single hook
function usePostWithComments(postId: string) {
  const postQuery = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetchPost(postId),
  })

  const commentsQuery = useQuery({
    queryKey: ['comments', 'post', postId],
    queryFn: () => fetchPostComments(postId),
    enabled: !!postQuery.data,
  })

  return {
    post: postQuery.data,
    comments: commentsQuery.data,
    isLoading: postQuery.isPending || commentsQuery.isPending,
    error: postQuery.error || commentsQuery.error,
    refetch: () => {
      postQuery.refetch()
      commentsQuery.refetch()
    },
  }
}
```

### Conditional Query Pattern

```typescript
function useConditionalData(userId?: string, type: 'public' | 'private' = 'public') {
  const publicQuery = useQuery({
    queryKey: ['data', 'public'],
    queryFn: fetchPublicData,
    enabled: type === 'public',
  })

  const privateQuery = useQuery({
    queryKey: ['data', 'private', userId],
    queryFn: () => fetchPrivateData(userId!),
    enabled: type === 'private' && !!userId,
  })

  if (type === 'public') {
    return {
      data: publicQuery.data,
      isPending: publicQuery.isPending,
      error: publicQuery.error,
    }
  }

  return {
    data: privateQuery.data,
    isPending: privateQuery.isPending,
    error: privateQuery.error,
  }
}
```

## 11. Migration Guide: v4 to v5

### Breaking Changes Summary

1. **Single Object Parameter**: All hooks now use single object parameter
2. **State Renaming**: `isLoading` → `isPending`, `cacheTime` → `gcTime`
3. **Infinite Query Changes**: `initialPageParam` is now required
4. **Removed Features**: `keepPreviousData` replaced with `placeholderData`

### Migration Steps

```typescript
// Before (v4)
useQuery(
  ['posts', page],
  () => fetchPosts(page),
  {
    staleTime: 5000,
    cacheTime: 10000,
    keepPreviousData: true,
  }
)

// After (v5)
useQuery({
  queryKey: ['posts', page],
  queryFn: () => fetchPosts(page),
  staleTime: 5000,
  gcTime: 10000,
  placeholderData: keepPreviousData,
})
```

### Automated Migration Tools

```bash
# Use codemod for automatic migration
npx @tanstack/react-query-codemods v5/remove-overloads
npx @tanstack/react-query-codemods v5/rename-properties
```

## Key Takeaways for AI Agents

1. **Always use hierarchical query keys** with query factories for maintainable cache management
2. **Implement proper error boundaries** and loading states for robust UX
3. **Use optimistic updates judiciously** - only for operations with high success probability
4. **Prefer server-side prefetching** in Next.js App Router for better performance
5. **Test with MSW** to avoid coupling tests to real API endpoints
6. **Monitor cache size** and configure appropriate `gcTime` values
7. **Use TypeScript strictly** to catch query key and data mismatches early
8. **Implement proper cleanup** in SSR environments to prevent memory leaks

## Additional Resources

- [TanStack Query v5 Official Documentation](https://tanstack.com/query/v5)
- [Migration Guide v4 → v5](https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Cache Helpers](https://supabase-cache-helpers.vercel.app/)
- [React Hook Form Integration](https://react-hook-form.com/)

---

*This comprehensive research provides a foundation for implementing robust, scalable data-fetching patterns with TanStack Query v5, Next.js 15, and Supabase. Regular updates to this document will reflect evolving best practices and new patterns.*
