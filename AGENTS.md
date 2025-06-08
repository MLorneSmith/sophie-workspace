# Project Agents.md Guide for OpenAI Codex

This Agents.md file provides comprehensive guidance for OpenAI Codex and other AI agents working with this codebase.

## Project Overview

Makerkit is a multi-tenant SaaS application using a Turborepo monorepo structure with distinct apps for the main web application, development tools, and e2e testing.

### Monorepo Structure

- `/apps/web` - Main Next.js SaaS application
- `/apps/dev-tool` - Development utilities (port 3010)
- `/apps/e2e` - Playwright end-to-end tests
- `/packages/` - Shared packages and utilities
- `/tooling/` - Build tools and development scripts

### Core Technologies

- **Next.js 15** with App Router and Turbopack
- **Supabase** for database, auth, and storage
- **React 19** with React Compiler
- **TypeScript** with strict configuration
- **Tailwind CSS 4** for styling
- **Turborepo** for monorepo management

### Multi-Tenant Architecture

Uses a dual account model:

- **Personal Accounts**: Individual user accounts (`auth.users.id = accounts.id`)
- **Team Accounts**: Shared workspaces with members, roles, and permissions
- Data associates with accounts via foreign keys for proper access control

## Essential Commands

### Development

```bash
pnpm dev                    # Start all apps
pnpm --filter web dev       # Main app (port 3000)
pnpm --filter dev-tool dev  # Dev tools (port 3010)
pnpm build                  # Build all apps
```

### Database Operations

```bash
pnpm supabase:web:start     # Start Supabase locally
pnpm supabase:web:reset     # Reset with latest schema
pnpm supabase:web:typegen   # Generate TypeScript types
pnpm --filter web supabase:db:diff  # Create migration
```

### Code Quality

```bash
pnpm lint && pnpm format    # Lint and format
pnpm typecheck              # Type checking
pnpm test                   # Run tests
```

## Application Structure

### Route Organization

```
app/
├── (marketing)/          # Public pages (landing, blog, docs)
├── (auth)/              # Authentication pages
├── home/
│   ├── (user)/          # Personal account context
│   └── [account]/       # Team account context ([account] = team slug)
├── admin/               # Super admin section
└── api/                 # API routes
```

See complete structure in @apps/web/app/ with examples like:

- Marketing layout: @apps/web/app/(marketing)/layout.tsx
- Personal dashboard: @apps/web/app/home/(user)/page.tsx
- Team workspace: @apps/web/app/home/[account]/page.tsx
- Admin section: @apps/web/app/admin/page.tsx

### Component Organization

- **Route-specific**: Use `_components/` directories
- **Route utilities**: Use `_lib/` for client, `_lib/server/` for server-side
- **Global components**: Root-level directories

Example organization:

- Team components: @apps/web/app/home/[account]/\_components/
- Team server utils: @apps/web/app/home/[account]/\_lib/server/
- Marketing components: @apps/web/app/(marketing)/\_components/

## Database Guidelines

### Security & RLS

- **Always enable RLS** on new tables unless explicitly instructed otherwise
- Use helper functions for access control:
  - `public.has_role_on_account(account_id, role?)` - Check team membership
  - `public.has_permission(user_id, account_id, permission)` - Check permissions
  - `public.is_account_owner(account_id)` - Verify ownership

See RLS examples in database schemas: @apps/web/supabase/schemas/

### Schema Management

- Schemas in `apps/web/supabase/schemas/`
- Create as `<number>-<name>.sql`
- After changes: `pnpm --filter web supabase:db:diff` then `pnpm supabase:web:reset`

Key schema files:

- Accounts: `apps/web/supabase/schemas/03-accounts.sql`
- Memberships: `apps/web/supabase/schemas/05-memberships.sql`
- Permissions: `apps/web/supabase/schemas/06-roles-permissions.sql`

### Type Generation

Import auto-generated types from @packages/supabase/src/types/database.ts:

```typescript
import { Tables } from '@kit/supabase/database';

type Account = Tables<'accounts'>;
```

## Development Patterns

### Data Fetching

- **Server Components**: Use `getSupabaseServerClient()` from @packages/supabase/src/clients/server-client.ts
- **Client Components**: Use `useSupabase()` hook + React Query's `useQuery`
- **Admin Operations**: Use `getSupabaseServerAdminClient()` from @packages/supabase/src/clients/server-admin-client.ts (rare cases only - bypasses RLS, use with caution!)
- Prefer Server Components and pass data down when needed

Use the Container/Presenter pattern for complex data components:

```typescript
// Container: handles data fetching
function UserProfileContainer() {
  const userData = useUserData();
  return <UserProfilePresenter data={userData.data} />;
}

// Presenter: handles UI rendering
function UserProfilePresenter({ data }: { data: UserData }) {
  return <div>{data.name}</div>;
}
```

Example server-side data loading:

- User workspace loader: @apps/web/app/home/(user)/\_lib/server/load-user-workspace.ts
- Team workspace loader: @apps/web/app/home/[account]/\_lib/server/team-account-workspace.loader.ts
- Data provider pattern: @packages/features/team-accounts/src/components/members/roles-data-provider.tsx

### Server Actions

Always use `enhanceAction` from @packages/next/src/actions/index.ts:

```typescript
'use server';

import { enhanceAction } from '@kit/next/actions';

export const createNoteAction = enhanceAction(
  async function (data, user) {
    // data is validated, user is authenticated
    return { success: true };
  },
  {
    auth: true,
    schema: CreateNoteSchema,
  },
);
```

Example server actions:

- Team billing: @apps/web/app/home/[account]/billing/\_lib/server/server-actions.ts
- Personal settings: @apps/web/app/home/(user)/settings/\_lib/server/server-actions.ts

### Forms with React Hook Form & Zod

```typescript
// 1. Define schema in separate file
export const CreateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

// 2. Client component with form
('use client');
const form = useForm({
  resolver: zodResolver(CreateNoteSchema),
});

const onSubmit = (data) => {
  startTransition(async () => {
    await toast.promise(createNoteAction(data), {
      loading: 'Creating...',
      success: 'Created!',
      error: 'Failed!',
    });
  });
};
```

See form examples:

- Contact form: @apps/web/app/(marketing)/contact/\_components/contact-form.tsx
- Verify OTP form: @packages/otp/src/components/verify-otp-form.tsx

### Route Handlers (API Routes)

Use `enhanceRouteHandler` from @packages/next/src/routes/index.ts:

```typescript
import { enhanceRouteHandler } from '@kit/next/routes';

export const POST = enhanceRouteHandler(
  async function ({ body, user, request }) {
    // body is validated, user available if auth: true
    return NextResponse.json({ success: true });
  },
  {
    auth: true,
    schema: ZodSchema,
  },
);
```

Example API routes:

- Billing webhook: @apps/web/app/api/billing/webhook/route.ts
- Database webhook: @apps/web/app/api/db/webhook/route.ts

## React & TypeScript Best Practices

### Components

- Use functional components with TypeScript
- Always use `'use client'` directive for client components
- Destructure props with proper TypeScript interfaces

### Conditional Rendering

Use the `If` component from @packages/ui/src/makerkit/if.tsx:

```tsx
import { If } from '@kit/ui/if';
import { Spinner } '@kit/ui/spinner';

<If condition={isLoading} fallback={<Content />}>
  <Spinner />
</If>

// With type inference
<If condition={error}>
  {(err) => <ErrorMessage error={err} />}
</If>
```

### Testing Attributes

Add data attributes for testing:

```tsx
<button data-test="submit-button">Submit</button>
<div data-test="user-profile" data-user-id={user.id}>Profile</div>
<form data-test="signup-form">Form content</form>
```

### Internationalization

Always use `Trans` component from @packages/ui/src/makerkit/trans.tsx:

```tsx
import { Trans } from '@kit/ui/trans';

// Basic usage
<Trans
  i18nKey="user:welcomeMessage"
  values={{ name: user.name }}
  defaults="Welcome, {name}!"
/>

// With HTML elements
<Trans
  i18nKey="terms:agreement"
  components={{
    TermsLink: <a href="/terms" className="underline" />,
  }}
  defaults="I agree to the <TermsLink>Terms</TermsLink>."
/>

// Pluralization
<Trans
  i18nKey="notifications:count"
  count={notifications.length}
  defaults="{count, plural, =0 {No notifications} one {# notification} other {# notifications}}"
/>
```

Use `LanguageSelector` component from @packages/ui/src/makerkit/language-selector.tsx:

```tsx
import { LanguageSelector } from '@kit/ui/language-selector';

<LanguageSelector />;
```

Adding new languages:

1. Add language code to @apps/web/lib/i18n/i18n.settings.ts
2. Create translation files in @apps/web/public/locales/[new-language]/
3. Copy structure from English files as template

Adding new namespaces:

1. Add namespace to `defaultI18nNamespaces` in @apps/web/lib/i18n/i18n.settings.ts
2. Create corresponding translation files for all supported languages

Translation files located in @apps/web/public/locales/<locale>/<namespace>.json:

- Common translations: @apps/web/public/locales/en/common.json
- Auth translations: @apps/web/public/locales/en/auth.json
- Team translations: @apps/web/public/locales/en/teams.json

## Security Guidelines

### Authentication & Authorization

- Authentication enforced by middleware
- Authorization typically handled by RLS at database level, unless using the admin client
- For rare admin client usage, enforce both manually
- User authentication helper: @apps/web/lib/server/require-user-in-server-component.ts if required or to obtain the authed user

### Data Passing

- **Never pass sensitive data** to Client Components
- **Never expose server environment variables** to client (unless `NEXT_PUBLIC_`)
- Always validate user input before processing

### OTP for Sensitive Operations

Use one-time tokens from @packages/otp/src/api/index.ts for destructive operations:

```tsx
import { VerifyOtpForm } from '@kit/otp/components';

<VerifyOtpForm
  purpose="account-deletion"
  email={user.email}
  onSuccess={(otp) => {
    // Proceed with verified operation
  }}
/>;
```

OTP schema and functions: @apps/web/supabase/schemas/12-one-time-tokens.sql

### Super Admin Protection

For admin routes, use `AdminGuard` from @packages/features/admin/src/components/admin-guard.tsx:

```tsx
import { AdminGuard } from '@kit/admin/components/admin-guard';

export default AdminGuard(AdminPageComponent);
```

For admin server actions, use `adminAction` wrapper:

```tsx
import { adminAction } from '@kit/admin';

export const yourAdminAction = adminAction(
  enhanceAction(
    async (data) => {
      // Action implementation
    },
    { schema: YourActionSchema },
  ),
);
```

Admin service security pattern:

```typescript
private async assertUserIsNotCurrentSuperAdmin(targetId: string) {
  const { data } = await this.client.auth.getUser();
  const currentUserId = data.user?.id;

  if (currentUserId === targetId) {
    throw new Error('Cannot perform destructive action on your own account');
  }
}
```

## UI Components

### Core UI Library

Import from @packages/ui/src/:

```tsx
// Shadcn components
import { Button } from '@kit/ui/button';
// @packages/ui/src/shadcn/button.tsx
import { Card } from '@kit/ui/card';
// @packages/ui/src/shadcn/sonner.tsx

// Makerkit components
import { If } from '@kit/ui/if';
// @packages/ui/src/makerkit/trans.tsx
import { ProfileAvatar } from '@kit/ui/profile-avatar';
// @packages/ui/src/shadcn/card.tsx
import { toast } from '@kit/ui/sonner';
// @packages/ui/src/makerkit/if.tsx
import { Trans } from '@kit/ui/trans';

// @packages/ui/src/makerkit/profile-avatar.tsx
```

### Key Component Categories

- **Forms**: Form components in @packages/ui/src/shadcn/form.tsx
- **Navigation**: Navigation menu in @packages/ui/src/shadcn/navigation-menu.tsx
- **Data Display**: Data table in @packages/ui/src/makerkit/data-table.tsx
- **Marketing**: Marketing components in @packages/ui/src/makerkit/marketing/

### Styling

- Use Tailwind CSS with semantic classes
- Prefer `bg-background`, `text-muted-foreground` over fixed colors
- Use `cn()` utility from @packages/ui/src/lib/utils.ts for class merging

## Workspace Contexts

### Personal Account Context (`/home/(user)`)

Use hook from `packages/features/accounts/src/hooks/use-user-workspace.ts`:

```tsx
import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';

function PersonalComponent() {
  const { user, account } = useUserWorkspace();
  // Personal account data
}
```

Context provider: `packages/features/accounts/src/components/user-workspace-context-provider.tsx`

### Team Account Context (`/home/[account]`)

Use hook from `packages/features/team-accounts/src/hooks/use-team-account-workspace.ts`:

```tsx
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';

function TeamComponent() {
  const { account, user, accounts } = useTeamAccountWorkspace();
  // Team account data with permissions
}
```

Context provider: `packages/features/team-accounts/src/components/team-account-workspace-context-provider.tsx`

## Error Handling & Logging

### Structured Logging

Use logger from `packages/shared/src/logger/logger.ts`:

```typescript
import { getLogger } from '@kit/shared/logger';

const logger = await getLogger();
const ctx = { name: 'myOperation', userId: user.id };

logger.info(ctx, 'Operation started');
// ... operation
logger.error({ ...ctx, error }, 'Operation failed');
```

### Error Boundaries

Use proper error handling with meaningful user messages:

```tsx
try {
  await operation();
} catch (error) {
  logger.error({ error, context }, 'Operation failed');
  return { error: 'Unable to complete operation' }; // Generic message
}
```

## Feature Development Workflow

### Creating New Pages

1. Create page component in appropriate route group
2. Add `withI18n()` HOC from `apps/web/lib/i18n/with-i18n.tsx`
3. Implement `generateMetadata()` for SEO
4. Add loading state with `loading.tsx`
5. Create components in `_components/` directory
6. Add server utilities in `_lib/server/`

Example page structure:

- Marketing page: `apps/web/app/(marketing)/pricing/page.tsx`
- Dashboard page: `apps/web/app/home/(user)/page.tsx`
- Team page: `apps/web/app/home/[account]/members/page.tsx`

### Permission Patterns

- Check permissions before data operations
- Guard premium features with `public.has_active_subscription`
- Use role hierarchy for member management
- Primary account owners have special privileges

Permission helpers in database: `apps/web/supabase/schemas/06-roles-permissions.sql`

### Database Development

1. Create schema file: `apps/web/supabase/schemas/<number>-<name>.sql`
2. Enable RLS and create policies
3. Generate migration: `pnpm --filter web supabase:db:diff`
4. Reset database: `pnpm supabase:web:reset`
5. Generate types: `pnpm supabase:web:typegen`

## API Services

### Account Services

- Personal accounts API: `packages/features/accounts/src/server/api.ts`
- Team accounts API: `packages/features/team-accounts/src/server/api.ts`
- Admin service: `packages/features/admin/src/lib/server/services/admin.service.ts`

### Billing Services

- Personal billing: `apps/web/app/home/(user)/billing/_lib/server/user-billing.service.ts`
- Team billing: `apps/web/app/home/[account]/billing/_lib/server/team-billing.service.ts`
- Per-seat billing: `packages/features/team-accounts/src/server/services/account-per-seat-billing.service.ts`

## Key Configuration Files

- **Feature flags**: @apps/web/config/feature-flags.config.ts
- **i18n settings**: @apps/web/lib/i18n/i18n.settings.ts
- **Supabase local config**: @apps/web/supabase/config.toml@
- **Middleware**: @apps/web/middleware.ts`
