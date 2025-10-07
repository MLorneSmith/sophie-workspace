# Agent Instructions

This file provides guidance to AI Agents and Claude Code when working with code in this repository.

## Core Technologies

- **Next.js 15** with App Router
- **Supabase** for database, auth, and storage
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**, Shadcn UI, Lucide React
- **Turborepo**

## Monorepo Structure

- `apps/web` - Main Next.js SaaS application
- `apps/web/supabase` - Supabase folder (migrations, schemas, tests)
- `apps/e2e` - Playwright end-to-end tests
- `packages/features/*` - Feature packages
- `packages/` - Shared packages and utilities

## Multi-Tenant Architecture

**Personal Accounts**: Individual user accounts (auth.users.id = accounts.id)
**Team Accounts**: Shared workspaces with members, roles, and permissions

Data associates with accounts via foreign keys for proper access control.

## Essential Commands

### Development Workflow

```bash
pnpm dev                    # Start all apps
pnpm --filter web dev       # Main app (port 3000)
```

### Database Operations

```bash
pnpm supabase:web:start     # Start Supabase locally
pnpm --filter web supabase migrations up     # Apply new migrations
pnpm supabase:web:reset     # Reset with latest schema (clean rebuild)
pnpm supabase:web:typegen   # Generate TypeScript types
pnpm --filter web supabase:db:diff  # Create migration
```text

The typegen command must be run after applying migrations or resetting the database.

## Database Workflow - CRITICAL SEQUENCE ⚠️

When adding new database features, ALWAYS follow this exact order:

1. **Create/modify schema file** in `apps/web/supabase/schemas/XX-feature.sql`
2. **Generate migration**: `pnpm --filter web supabase:db:diff -f <migration_name>`
3. **Apply changes**: `pnpm --filter web supabase migration up` (or `pnpm supabase:web:reset` for clean rebuild)
4. **Generate types**: `pnpm supabase:web:typegen`
5. **Verify types exist** before using in code

⚠️ **NEVER skip step 2** - schema files alone don't create tables! The migration step is required to apply changes to the database.

**Migration vs Reset**:
- Use `migration up` for normal development (applies only new migrations)
- Use `reset` when you need a clean database state or have schema conflicts

### Code Quality

```bash
pnpm format:fix
pnpm lint:fix
pnpm typecheck
```

- Run the typecheck command regularly to ensure your code is type-safe.
- Run the linter and the formatter when your task is complete.
## Typescript

- Write clean, clear, well-designed, explicit TypeScript
- Avoid obvious comments
- Avoid unnecessary complexity or overly abstract code
- Always use implicit type inference, unless impossible
- You must avoid using `any`
- Handle errors gracefully using try/catch and appropriate error types
- Use service pattern for server-side APIs
- Add `import 'server-only';` to code that is exclusively server-side
- Never mix client and server imports from a file or a package
- Extract self-contained classes/utilities (ex. algortihmic code) from classes that cross the network boundary

## React

- Encapsulate repeated blocks of code into reusable local components
- Write small, composable, explicit, well-named components
- Always use `react-hook-form` and `@kit/ui/form` for writing forms
- Use functional components
- Always use 'use client' directive for client components
- Add `data-test` for E2E tests where appropriate
- `useEffect` is a code smell and must be justified - avoid if possible
- Do not write many (such as 4-5) separate `useState`, prefer single state object (unless required)
- Prefer server-side data fetching using RSC
- Display loading indicators (ex. with LoadingSpinner) component where appropriate

## Next.js

- Use `enhanceAction` for Server Actions
- Use `use server` in server actions files
- Use `enhanceRouteHandler` for API Routes
- Export page components using the `withI18n` utility
- Add well-written page metadata to pages
- Redirect using `redirect` following a server action instead of using client-side router
- Since `redirect` throws an error, handle `catch` block using `isRedirectError` from `next/dist/client/components/redirect-error` in client-side forms when calling the server action

## UI Components

- UI Components are placed at `packages/ui`. Call MCP tool to list components to verify they exist.

## Form Architecture

Always organize schemas for reusability between server actions and client forms:

```
_lib/
├── schemas/
│   └── feature.schema.ts    # Shared Zod schemas
├── server/
│   └── server-actions.ts # Server actions import schemas
└── client/
    └── forms.tsx    # Forms import same schemas
```

**Example implementation:**

```typescript
// _lib/schemas/project.schema.ts
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

// _lib/server/project.mutations.ts
import { CreateProjectSchema } from '../schemas/project.schema';

export const createProjectAction = enhanceAction(
  async (data) => { /* implementation */ },
  { schema: CreateProjectSchema }
);

// _components/create-project-form.tsx
import { CreateProjectSchema } from '../_lib/schemas/project.schema';

const form = useForm({
  resolver: zodResolver(CreateProjectSchema)
});
```

## Import Guidelines - ALWAYS Check These

**UI Components**: Always check `@kit/ui` first before external packages:
- Toast notifications: `import { toast } from '@kit/ui/sonner'`
- Forms: `import { Form, FormField, ... } from '@kit/ui/form'`
- All UI components: Use MCP tool to verify: `mcp__makerkit__get_components`

**React Hook Form Pattern**:
```typescript
// ❌ WRONG - Redundant generic with resolver
const form = useForm<FormData>({
  resolver: zodResolver(Schema)
});

// ✅ CORRECT - Type inference from resolver
const form = useForm({
  resolver: zodResolver(Schema)
});
```

## Data Fetching Architecture

Makerkit uses a clear separation between data fetching and mutations:

### Server Components with Loaders (Reading Data)

**Pattern**: Use async server components that call loader functions for initial data fetching.

```typescript
// Page component (apps/web/app/home/[account]/page.tsx)
async function TeamAccountPage({ params }: Props) {
  const client = getSupabaseServerClient();
  const slug = (await params).account;

  const [projects, workspace] = await loadProjectsPageData(client, slug);

  return <ProjectsList projects={projects} />;
}

// Loader function (_lib/server/projects-page.loader.ts)
import 'server-only';

export async function loadProjectsPageData(
  client: SupabaseClient<Database>,
  slug: string,
) {
  return Promise.all([
    loadProjects(client, slug),
    loadTeamWorkspace(slug),
  ]);
}

async function loadProjects(client: SupabaseClient<Database>, slug: string) {
  const { data, error } = await client.rpc('get_team_projects', {
    account_slug: slug,
  });

  if (error) throw error;
  return data ?? [];
}
```

### Server Actions (Mutations Only)

**Pattern**: Use `enhanceAction` for create/update/delete operations with schema validation.

```typescript
// server-actions.ts
'use server';

import { enhanceAction } from '@kit/next/actions';

export const createProject = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createProjectsService();

    const response = await service.createProject(data);

    if (response.error) {
      throw response.error;
    }

    return {
      success: true,
      data: response.data,
    };
  },
  {
    schema: CreateProjectSchema,
  },
);
```

### Authorization & RLS

- **Server Components**: RLS automatically enforces access control
- **Server Actions**: RLS validates permissions on mutations
- **No manual auth checks needed** when using standard Supabase client
- **Admin client**: Only for bypassing RLS (rare cases, requires careful manual validation)

## File Organization Patterns

### Route Structure
```
apps/web/app/home/[account]/
├── page.tsx                    # Team dashboard
├── members/
│   ├── page.tsx               # Members listing
│   └── _lib/server/           # Server-side utilities
│       └── members-page.loader.ts
├── projects/                  # New feature example
│   ├── page.tsx              # Projects listing
│   ├── [id]/                 # Individual project
│   │   └── page.tsx          # Project detail page
│   ├── _components/          # Feature-specific components
│   │   ├── project-list.tsx
│   │   └── create-project-form.tsx
│   └── _lib/
│       ├── server/           # Server-side logic
│       │   ├── projects-page.loader.ts
│       │   └── projects-server-actions.ts
│       └── schemas/          # Zod validation schemas
│           └── project.schema.ts
└── _components/              # Shared team account components
    └── team-account-layout-page-header.tsx
```

### Naming Conventions
- **Pages**: `page.tsx` (Next.js convention)
- **Loaders**: `{feature}-page.loader.ts`
- **Actions**: `{feature}-server-actions.ts`
- **Schemas**: `{feature}.schema.ts`
- **Components**: `kebab-case.tsx`

## Verification Steps

After implementation:

1. **Run `pnpm typecheck`** - Must pass without errors
2. **Run `pnpm lint:fix`** - Auto-fix issues
3. **Run `pnpm format:fix`** - Format code
