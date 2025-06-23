# Component Patterns

## Component Structure

### Client Components

```tsx
'use client'; // Required for client components

import { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * ComponentName - Brief description of the component
 * Used in: PageA, PageB, etc.
 */
function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // 1. Hooks
  const [state, setState] = useState(initialState);
  
  // 2. Derived state
  const derivedValue = useMemo(() => computeValue(prop1), [prop1]);
  
  // 3. Event handlers
  const handleEvent = useCallback(() => {
    // Implementation
  }, [dependencies]);
  
  // 4. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 5. Render
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}

// Props interface
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

// Export patterns - check existing conventions in the directory
export default ComponentName;
// OR
export { ComponentName };
```

### Server Components (Default)

```tsx
// No 'use client' directive - this is a Server Component

import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * ServerComponent - Fetches data on the server
 * Used in: Dashboard pages, data-heavy views
 */
async function ServerComponent({ userId }: { userId: string }) {
  // Direct database access in Server Components
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', userId);

  return (
    <div>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

export default ServerComponent;
```

## Component Types

### 1. UI Components

- Pure presentational components
- No data fetching or business logic
- Highly reusable across the application
- Located in `packages/ui` or `apps/web/components/ui`

### 2. Aceternity Components

- Pre-built animated UI components from the aceternity library
- Located in `packages/ui/src/aceternity`
- Examples: `CardSpotlight`, `StickyScrollReveal`, `BackgroundBoxes`
- Used for marketing pages and visual effects

### 3. ShadcnUI Components

- Core UI primitives built on Radix UI
- Located in `packages/ui/src/shadcn`
- Examples: `Button`, `Dialog`, `Form`, `Input`
- Foundation for most interactive components

### 4. Feature Components

- Implement specific feature functionality
- May contain business logic
- Specific to a particular feature
- Located in `packages/features` or `apps/web/app/[feature]/components`

### 5. Page Components

- Top-level components for routes
- Compose UI and feature components
- Handle data fetching (Server Components)
- Located in `apps/web/app/[route]/page.tsx`

### 6. Layout Components

- Define the structure of pages
- Handle navigation and common UI elements
- Located in `apps/web/app/[route]/layout.tsx`

## Best Practices

1. **Composition over Inheritance**: Build complex UIs by composing simple components
2. **Prop Drilling Alternatives**: Use context or composition patterns for deep prop passing
3. **Loading States**: Always handle loading states with skeletons or spinners
4. **Error States**: Always handle error states with appropriate messaging
5. **Empty States**: Always handle empty data states with appropriate messaging
6. **Responsive Design**: Design components to work across all device sizes
7. **Accessibility**: Ensure all components meet WCAG 2.1 AA standards
8. **Type Safety**: Always define proper TypeScript interfaces - no `any` types
9. **Server vs Client**: Default to Server Components, use Client Components only when needed for interactivity
10. **Import Aliases**: Use `@kit/*` import aliases for shared packages

## Real-World Examples

### Form Component with Server Action

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';

import { updateProfileAction } from '../_lib/server/server-actions';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

function ProfileForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const result = await updateProfileAction(data);
    
    if (result.error) {
      // Handle error
    } else {
      // Handle success
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update Profile</Button>
      </form>
    </Form>
  );
}
```

### Mobile Navigation Component (Real Example)

```tsx
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Trans } from '@kit/ui/trans';

function MobileNavigationDropdown({
  links,
}: {
  links: {
    path: string;
    label: string;
  }[];
}) {
  const path = usePathname();

  const items = useMemo(
    function MenuItems() {
      return Object.values(links).map((link) => {
        return (
          <DropdownMenuItem key={link.path}>
            <Link
              className={'flex h-full w-full items-center'}
              href={link.path}
            >
              <Trans i18nKey={link.label} defaults={link.label} />
            </Link>
          </DropdownMenuItem>
        );
      });
    },
    [links],
  );

  // Component implementation continues...
}

export default MobileNavigationDropdown;
```
