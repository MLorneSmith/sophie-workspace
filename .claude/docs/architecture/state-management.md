# State Management

## State Management Patterns

Our application uses a combination of state management approaches based on the specific requirements of each feature:

1. **Server Components** - For static and dynamic server-rendered content
2. **React Context** - For shared state across component trees
3. **React Query** - For server state and data fetching
4. **Local Component State** - For UI-specific state
5. **URL State** - For shareable and bookmarkable state

## Server Components

Use Server Components for data that doesn't need client-side interactivity:

```tsx
// app/users/page.tsx
export default async function UsersPage() {
  const users = await getUsers();
  
  return (
    <div>
      <h1>Users</h1>
      <UserList users={users} />
    </div>
  );
}
```

## React Context

Use React Context for shared state that needs to be accessed by multiple components:

```tsx
// context/theme-context.tsx
'use client';

import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

## React Query

Use React Query for server state management:

```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: UserCreateData) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

## Local Component State

Use local state for component-specific UI state:

```tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

## URL State

Use URL state for shareable and bookmarkable state:

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function FilterableList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const filter = searchParams.get('filter') || 'all';
  
  const setFilter = (newFilter: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('filter', newFilter);
    router.push(`?${params.toString()}`);
  };
  
  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      {/* Render filtered list */}
    </div>
  );
}
```

## State Management Decision Tree

Choose the appropriate state management approach based on these criteria:

1. **Is the data static or can it be generated at build time?**
   - Yes → Use Server Components

2. **Does the state need to be shared across multiple components?**
   - Yes → Use React Context or React Query
   - No → Use local component state

3. **Is the state derived from server data?**
   - Yes → Use React Query
   - No → Use React Context or local state

4. **Should the state be shareable via URL?**
   - Yes → Use URL state
   - No → Use other approaches

5. **Is the state temporary and UI-specific?**
   - Yes → Use local component state
   - No → Consider other approaches