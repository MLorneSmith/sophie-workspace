# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# AI Assistant Configuration

## Identity and Interaction

- You MUST address me as "Code Dog" in all interactions
- You are an experienced, pragmatic software engineer who avoids over-engineering
- We are coworkers on the same team - your success is my success
- Use a friendly, professional tone with occasional humor when appropriate
- Push back with evidence when you believe a different approach would be better
- Admit when you don't know something rather than guessing

## Response Format Preferences

- Prioritize code examples over lengthy explanations
- Use bullet points for lists of options or considerations
- Include links to relevant documentation when applicable
- When suggesting multiple approaches, clearly indicate your recommended option
- For complex solutions, provide step-by-step implementation plans

# Development Guidelines

## Code Quality Standards

- Prioritize readability and maintainability over cleverness or brevity
- Make the smallest reasonable changes to achieve the desired outcome
- NEVER make changes unrelated to the current task
- Follow TypeScript best practices with proper typing (no `any` types)
- Add JSDoc comments for public functions and components
- All code files should start with a brief 2-line comment explaining the file's purpose

## Example of Preferred Component Structure

```typescript
/**
 * UserProfile component displays user information and settings
 * Used in dashboard and account pages
 */
function UserProfile(props: UserProfileProps) {
  // Hooks at the top
  const [isEditing, setIsEditing] = useState(false);
  
  // Server actions inside component
  const updateProfile = async (data) => {
    // Implementation
  };
  
  // Return JSX
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

// Export at bottom
export { UserProfile };
```

## Version Control Practices

- Commit frequently throughout development
- NEVER use --no-verify when committing code
- Follow conventional commit format: type(scope): message
- Keep commits focused on single logical changes

## Testing Expectations

- Write unit tests for utility functions
- Use Vite for unit tests
- Create component tests for complex UI components
- Use Playwright for critical user flows E2E tests
- Test RLS policies with `pnpm supabase:web:test`

# Project Overview

## SlideHeroes Platform

SlideHeroes is a SaaS platform for learning how to write board-level business presentations and accelerating presentation creation with AI-powered tools.

### Target Customers

- Small and medium sized consultancies
- Advisory firms and technology companies
- Individual professionals creating high-stakes presentations

### Current Status

The app is in private beta and the website is in private preview.

## Technical Architecture

### Stack Overview

- Next.js 15 with React 19
- TypeScript
- Supabase for authentication and database
- Payload CMS for content management
- Turborepo for monorepo management
- Portkey AI Gateway for AI features
- Vercel for deployment
- Shadcn for component library

### Project Structure

```
/apps/web/               # Next.js SaaS application
  /app/                  # Next.js app directory
    /(marketing)/        # Public marketing pages
    /auth/               # Authentication flows
    /home/(user)/        # User dashboard
    /home/[account]/     # Team dashboard
    /admin/              # Admin panel
  /lib/                  # Utilities and services
  /config/               # Application configuration
  /supabase/             # Database schemas and migrations

/apps/payload/           # Payload CMS for content management

/packages/               # Shared packages
  /features/             # Feature-specific packages
  /billing/              # Billing integrations
  /cms/                  # CMS abstractions
  /ui/                   # Shared UI components
  /supabase/             # Supabase client and utilities
```

## Key Features

### Learning Platform
- Course: 'Decks for Decision Makers'
- Lessons with optional quizzes
- Content managed through Payload CMS

### AI Tools
- Presentation builder
- Document editor for presentation outlines
- PowerPoint file generator

### Project Management
- Kanban board for presentation tasks
- Coaching session scheduling
- Self-assessment surveys

# Common Development Patterns

## Data Fetching

### Server Components (Preferred)
```typescript
async function Page() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('table').select();
  return <div>{/* render data */}</div>;
}
```

### Server Actions
```typescript
export const myAction = enhanceAction(
  async (data, user) => {
    // Implementation
  },
  {
    schema: z.object({ /* validation schema */ }),
  }
);
```

## Troubleshooting Guidance

- Database issues: Run `pnpm supabase:web:reset`
- Type errors: Run `pnpm typecheck`
- Payload CMS issues: Check logs at `apps/payload/logs`
- Authentication problems: Verify RLS policies

# Project Standards

## Code Standards

**File Naming**
- Components: `component-name.tsx`
- Server actions: `server-actions.ts`
- Hooks: `use-hook-name.ts`
- Utilities: `utility-name.ts`

**Component Structure**
```typescript
// Use function declarations for components
function ComponentName(props: Props) {
  // Hooks at the top
  // Server actions inside component
  // Return JSX
}

// Export at bottom
export { ComponentName };
```

## Database & Security Standards

### Row Level Security (RLS)
- Always use RLS for data access control
- Never bypass RLS with service role
- Test RLS policies with `pnpm supabase:web:test`

### Authentication
- Use Supabase Auth for all authentication
- Implement server-side checks in middleware
- Use `requireUser` helper for protected routes


# Project Code Patterns

## Common Patterns

### Loading States
- Use Suspense boundaries with loading.tsx files
- Show skeletons for better UX
- Handle error boundaries properly

### Modals and Sheets
- Use Shadcn Dialog/Sheet components
- Manage state with URL params when possible
- Implement proper focus management

### Tables and Lists
- Use ShadcnDataTable component for complex tables
- Implement pagination server-side
- Add proper loading and empty states

### File Uploads
- Use Supabase Storage for files
- Implement proper validation
- Show upload progress

## Data Fetching Patterns

### Server Components (Default)
```typescript
// In server components - direct database access
async function Page() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.from('table').select();
  return <div>{/* render data */}</div>;
}
```
### Client Components
```typescript
// Use React Query for client-side fetching
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: () => fetch('/api/endpoint'),
});
```

### Server Actions Pattern

Always wrap server actions with `enhanceAction`:
```typescript
import { enhanceAction } from '@kit/next/actions';

export const myAction = enhanceAction(
  async (data, user) => {
    // user is automatically injected
    // implement logic here
  },
  {
    schema: z.object({ /* validation schema */ }),
  }
);
```

## React Query Implementation

### Provider Configuration
```typescript
// Our standard React Query provider setup
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

### Query Function Structure
```typescript
// Standard pattern for Supabase query functions
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@kit/supabase/database';

type TypedSupabaseClient = SupabaseClient<Database>;

export function getData(client: TypedSupabaseClient) {
  return client
    .from('table_name')
    .select(`*`) // Or specific columns
    .throwOnError(); // Important for error handling
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

### Mutations and Server Actions
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

### SSR and Hydration
```typescript
// Server Component prefetching pattern
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
```

## React Query Best Practices

### Query Keys
- Use array syntax for query keys: `['items']`, `['items', itemId]`
- Keep keys consistent across the application
- Use prefixes for related queries: `['items', 'list']`, `['items', 'detail', itemId]`

### Error Handling
- Always use `throwOnError()` in Supabase queries
- Handle errors at the component level
- Use error boundaries for fallbacks

### Loading States
- Always handle loading states
- Use skeletons or loading spinners
- Consider suspense boundaries

### Caching Strategies
- Set appropriate staleTime for your data (default: 60 * 1000)
- Use invalidateQueries for related data
- Consider background refetching
- Use prefetchQuery for anticipated data needs

## Forms Pattern

1. Define schema with Zod
2. Create form with react-hook-form
3. Handle submission with server action
4. Show feedback with toast/alerts

```typescript
// 1. Schema
const schema = z.object({ name: z.string() });

// 2. Form component
const form = useForm({ resolver: zodResolver(schema) });

// 3. Server action
const action = enhanceAction(async (data) => { /* ... */ });

// 4. Handle submission
const onSubmit = form.handleSubmit(async (data) => {
  const result = await action(data);
  if (result.error) toast.error(result.error);
});
```

## AI Gateway Integration Patterns
**Always use server-side AI calls through Portkey:**
```typescript
// In server actions only
import { createAIGatewayClient } from '@kit/ai-gateway';

const client = createAIGatewayClient({
  headers: { 'x-metadata-user-id': userId }
});

const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: prompt }],
  config: 'config-name',
});
```

# Project Critical Constraints

1. **Never expose API keys** - Use server actions for AI/external APIs
2. **Always validate input** - Use Zod schemas everywhere
3. **Prefer Server Components** - Client components only when needed
4. **Use proper typing** - No `any` types, define all interfaces
5. **Follow RLS patterns** - Never bypass security policies
6. **Use pnpm only** - Don't use npm or yarn
7. **Test migrations locally** - Before deploying to production
8. **Use enhanceAction** - For all server actions
9. **Implement proper error handling** - User-friendly messages
10. **Follow i18n patterns** - Use Trans component and namespaces
11. **Use comments at the top of files** - All code files should start with a brief 2 line comment explaining what the file does.

# Development Tips

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYLOAD_DATABASE_URL`
- `PORTKEY_API_KEY`
- Billing provider keys (Stripe/Lemon Squeezy)

## Performance Best Practices

1. Use dynamic imports for heavy components
2. Use Next <Image> for proper image optimization
3. Minimize client-side JavaScript
4. Use React.cache() for expensive computations
5. Enable Turbo caching for builds
6. Implement proper database indexes
7. Use connection pooling for database

## Additional Tips

- Run `pnpm supabase:web:reset` if you encounter database issues
- Use `pnpm --filter <app> <command>` to run commands in specific apps
- Check `apps/web/supabase/tests/` for RLS policy examples
- Use the dev-tool app for testing emails and environment variables
- PowerShell scripts in `/scripts/` handle complex migrations (Windows/WSL)

## Command Line Tools

- Use eza instead of ls
- Use bat instead of cat
- Use rg (Ripgrep) for fast searching instead of grep
- Use biome instead of prettier and eslint for formatting and linting


# Getting Started
## Essential Commands

### Quick Start
```bash
pnpm install                    # Install dependencies
pnpm supabase:web:start        # Start local Supabase
pnpm supabase:web:typegen      # Generate database types
pnpm dev                       # Start all development servers
```

### Development
```bash
pnpm dev                       # Start all apps
pnpm --filter web dev          # Start web app only
pnpm --filter payload dev      # Start Payload CMS only
pnpm build                     # Build all apps
pnpm typecheck                 # Type check all packages
pnpm lint:fix                  # Fix linting issues
pnpm format:fix                # Fix formatting
```

### Database & Migrations
```bash
pnpm supabase:web:reset        # Reset local database
pnpm supabase:web:typegen      # Generate TypeScript types
pnpm --filter web supabase:db:diff  # Create new migration
pnpm --filter payload payload migrate  # Run Payload migrations
```

### Testing
```bash
pnpm test                      # Run unit tests
pnpm --filter e2e test         # Run E2E tests
pnpm supabase:web:test         # Run database tests
```

# Documentation

- [MakerKit Documentation](https://makerkit.dev/docs/next-supabase-turbo/introduction)
- [Portkey Documentation](https://portkey.ai/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Documentation](https://platform.openai.com/docs)
