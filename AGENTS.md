# Project Agents.md Guide for OpenAI Codex

This Agents.md file provides comprehensive guidance for OpenAI Codex and other AI agents working with this codebase.

## Project Overview

Makerkit - Supabase SaaS Starter Kit (Turbo Edition) is a multi-tenant SaaS application built with Next.js, Supabase, and Tailwind CSS. The project uses a Turborepo monorepo structure with distinct apps for the main web application, development tools, and e2e testing.

## Architecture

### Monorepo Structure

- `/apps/web` - Main Next.js SaaS application
- `/apps/dev-tool` - Development utilities (runs on port 3010)
- `/apps/e2e` - Playwright end-to-end tests
- `/packages/` - Shared packages and utilities
- `/tooling/` - Build tools, linting, and development scripts

### Core Technologies

- **Next.js 15** with App Router and Turbopack
- **Supabase** for database, auth, and storage
- **React 19** with React Compiler
- **TypeScript** with strict configuration
- **Tailwind CSS 4** for styling
- **Turborepo** for monorepo management

### Multi-Tenant Architecture

The application uses a dual account model:

- **Personal Accounts**: Individual user accounts (auth.users.id = accounts.id)
- **Team Accounts**: Shared workspaces with members, roles, and permissions
- Data is associated with accounts via foreign keys for proper access control

## Common Commands

### Development

```bash
# Start all apps in development
pnpm dev

# Start specific app
pnpm --filter web dev          # Main app (port 3000)
pnpm --filter dev-tool dev     # Dev tools (port 3010)

# Build all apps
pnpm build

# Run tests
pnpm test                      # All tests
pnpm --filter e2e test         # E2E tests only
```

### Code Quality

```bash
# Lint all code
pnpm lint
pnpm lint:fix                  # Auto-fix issues

# Format code
pnpm format
pnpm format:fix               # Auto-fix formatting

# Type checking
pnpm typecheck
```

### Database Operations

```bash
# Start Supabase locally
pnpm supabase:web:start

# Reset database with latest schema
pnpm supabase:web:reset

# Generate TypeScript types from database
pnpm supabase:web:typegen

# Run database tests
pnpm supabase:web:test

# Create migration from schema changes
pnpm --filter web supabase:db:diff

# Stop Supabase
pnpm supabase:web:stop
```

## Database Guidelines

### Schema Management

- Database schemas are in `apps/web/supabase/schemas/`
- Create new schemas as `<number>-<name>.sql`
- After schema changes: run `pnpm --filter web supabase:db:diff` then `pnpm supabase:web:reset`

### Security & RLS

- **Always enable RLS** on new tables unless explicitly instructed otherwise
- Use helper functions for access control:
  - `public.has_role_on_account(account_id, role?)` - Check team membership
  - `public.has_permission(user_id, account_id, permission)` - Check specific permissions
  - `public.is_account_owner(account_id)` - Verify account ownership
- Associate data with accounts using foreign keys for proper access control

### Type Generation

Import auto-generated types from `@kit/supabase/database`:

```typescript
import { Tables } from '@kit/supabase/database';

type Account = Tables<'accounts'>;
```

## Development Patterns

### Data Fetching

- **Server Components**: Use `getSupabaseServerClient()` directly
- **Client Components**: Use `useSupabase()` hook + React Query's `useQuery`
- Prefer Server Components and pass data down to Client Components when needed

### Server Actions

- Always use `enhanceAction` from `@kit/next/actions`
- Name files as `server-actions.ts` and functions with `Action` suffix
- Place Zod schemas in separate files for reuse with forms
- Use `'use server'` directive at top of file

### Error Handling & Logging

- Use `@kit/shared/logger` for logging
- Don't swallow errors - handle them appropriately
- Provide context without sensitive data

### Component Organization

- Route-specific components in `_components/` directories
- Route-specific utilities in `_lib/` directories
- Server-side utilities in `_lib/server/`
- Global components and utilities in root-level directories

### Permission Patterns

- Check permissions before data operations using helper functions
- Guard premium features with subscription checks (`public.has_active_subscription`)
- Use role hierarchy to control member management actions
- Primary account owners have special privileges that cannot be revoked

## Testing

### E2E Tests

```bash
pnpm --filter e2e test        # Run all E2E tests
```

Test files are in `apps/e2e/tests/` organized by feature area.

## Important Notes

- Uses pnpm as package manager
- Database types are auto-generated - don't write manually if shape matches DB
- Always use explicit schema references in SQL (`public.table_name`)
- Documentation available at: https://makerkit.dev/docs/next-supabase-turbo/introduction
