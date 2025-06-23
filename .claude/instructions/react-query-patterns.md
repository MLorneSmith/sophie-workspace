# React Query Patterns in Our App

This guide outlines the patterns and best practices for using React Query with Supabase in our Next.js application.

## Project Setup

### Provider Configuration

Our app uses a custom ReactQueryProvider that's configured for SSR:

```tsx
export function ReactQueryProvider(props: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevents immediate refetching on client
            staleTime: 60 * 1000,
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

export function getData(client: TypedSupabaseClient) {
  return client
    .from('table_name')
    .select(`*`) // Or specific columns
    .throwOnError(); // Important for error handling
}

export function getDataById(client: TypedSupabaseClient, id: string) {
  return client
    .from('table_name')
    .select(`*`)
    .eq('id', id)
    .throwOnError()
    .single();
}
```

### Using Queries in Components

```typescript
function MyComponent() {
  const supabase = useSupabase();

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => getData(supabase),
  });

  // Always handle loading and error states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <DataDisplay data={data} />;
}
```

## Server Actions Integration

### Action Definition

Use the enhanceAction helper for server actions:

```typescript
export const createItemAction = enhanceAction(
  async function (data, user) {
    const supabase = getSupabaseServerClient();

    try {
      const result = await createItem(supabase, data);
      return {
        message: 'Item created successfully',
        error: null,
        data: result,
      };
    } catch (err) {
      console.error('Error:', err);
      return {
        message: null,
        error: err instanceof Error ? err.message : 'An error occurred',
      };
    }
  },
  {
    auth: true, // Requires authentication
    schema: CreateItemSchema, // Zod schema for validation
  },
);
```

### Form Handling with Server Actions

```typescript
function CreateItemForm() {
  const [state, formAction] = useActionState(
    async (state: QueryTestResponse, formData: FormData) => {
      const data = {
        name: formData.get('name') as string,
        // ... other fields
      };
      return createItemAction(data);
    },
    initialState,
  );

  return (
    <form action={formAction}>
      {/* Form fields */}
    </form>
  );
}
```

### Mutations and Optimistic Updates

```typescript
function UpdateItemComponent() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const result = await updateItemAction(data);
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

## SSR and Hydration

### Server Component Prefetching

```typescript
// layout.tsx
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = await prefetchData();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

// actions.ts
export async function prefetchData() {
  const supabase = getSupabaseServerClient();
  const queryClient = new QueryClient();

  await prefetchQuery(queryClient, getData(supabase));

  return queryClient;
}
```

## TypeScript Integration

### Database Types

Always use the Database type from Supabase:

```typescript
import { type Database } from '@kit/supabase/database';

type Item = Database['public']['Tables']['items']['Row'];
type ItemInsert = Database['public']['Tables']['items']['Insert'];
```

### Type-Safe Queries

```typescript
const { data: items } = useQuery<Item[]>({
  queryKey: ['items'],
  queryFn: async () => {
    const { data } = await getItems(supabase);
    return data;
  },
});
```

## Best Practices

### Query Keys

1. Use array syntax for query keys:

   ```typescript
   // Simple key
   ['items'][
     // With parameters
     ('items', itemId)
   ][
     // With filters
     ('items', { status: 'active', type: 'user' })
   ];
   ```

2. Keep keys consistent across the application
3. Use prefixes for related queries:

   ```typescript
   ['items', 'list'][('items', 'detail', itemId)];
   ```

### Error Handling

1. Always use throwOnError() in Supabase queries
2. Handle errors at the component level
3. Use error boundaries for fallbacks

### Loading States

1. Always handle loading states
2. Use skeletons or loading spinners
3. Consider suspense boundaries

### Form Submission

1. Use Zod schemas for validation
2. Handle loading states during submission
3. Show success/error messages
4. Use optimistic updates when appropriate

### Caching Strategies

1. Set appropriate staleTime for your data
2. Use invalidateQueries for related data
3. Consider background refetching
4. Use prefetchQuery for anticipated data needs

## Examples

### Complete Component Example

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Database } from '@kit/supabase/database';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

type Item = Database['public']['Tables']['items']['Row'];

export function ItemsList() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  // Query
  const { data: items, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await getItems(supabase);
      return data;
    },
  });

  // Mutation
  const mutation = useMutation({
    mutationFn: async (data: ItemInput) => {
      const result = await createItemAction(data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Loading state
  if (isLoading) {
    return <ItemsSkeleton />;
  }

  return (
    <div>
      <ItemsList items={items} />
      <CreateItemForm onSubmit={mutation.mutate} />
    </div>
  );
}
```

Remember:

- Always use TypeScript for type safety
- Handle loading and error states
- Use appropriate query keys
- Implement proper error handling
- Consider SSR and hydration
- Use optimistic updates when appropriate
- Keep query functions reusable
- Validate data with Zod schemas
