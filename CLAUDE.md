# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Turborepo monorepo for SlideHeroes - a SaaS platform for creating AI-powered presentations and educational content. Built with Next.js 15, React 19, TypeScript, Supabase, and Payload CMS.

### Key Applications
- **apps/web** - Main Next.js SaaS application (port 3000)
- **apps/payload** - Payload CMS for content management (port 3020)
- **apps/e2e** - Playwright E2E tests
- **apps/dev-tool** - Development utilities

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

## Architecture Patterns

### Project Structure
```
/apps/web/
  /app/                       # Next.js app directory
    /(marketing)/            # Public marketing pages
    /auth/                   # Authentication flows
    /home/(user)/           # User dashboard
    /home/[account]/        # Team dashboard
    /admin/                 # Admin panel
  /lib/                     # Utilities and services
  /config/                  # Application configuration
  /supabase/               # Database schemas and migrations

/packages/
  /features/               # Feature-specific packages
  /billing/               # Billing integrations
  /cms/                  # CMS abstractions
  /ui/                   # Shared UI components
  /supabase/             # Supabase client and utilities
```

### Code Standards

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

## Database & Security

### Row Level Security (RLS)
- Always use RLS for data access control
- Never bypass RLS with service role
- Test RLS policies with `pnpm supabase:web:test`

### Authentication
- Use Supabase Auth for all authentication
- Implement server-side checks in middleware
- Use `requireUser` helper for protected routes

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

## Server Actions Pattern

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

## AI Gateway Integration

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

## Critical Constraints

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
- Use DataTable component for complex tables
- Implement pagination server-side
- Add proper loading and empty states

### File Uploads
- Use Supabase Storage for files
- Implement proper validation
- Show upload progress

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
2. Implement proper image optimization
3. Minimize client-side JavaScript
4. Use React.cache() for expensive computations
5. Enable Turbo caching for builds
6. Implement proper database indexes
7. Use connection pooling for database

## Development Tips

- Run `pnpm supabase:web:reset` if you encounter database issues
- Use `pnpm --filter <app> <command>` to run commands in specific apps
- Check `apps/web/supabase/tests/` for RLS policy examples
- Use the dev-tool app for testing emails and environment variables
- PowerShell scripts in `/scripts/` handle complex migrations (Windows/WSL)