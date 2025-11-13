---
id: "architecture-patterns"
title: "Architecture: Implementation Patterns"
version: "2.0.0"
category: "pattern"
description: "Core architectural patterns and conventions for the 2025slideheroes Next.js monorepo application"
tags: ["architecture", "patterns", "next.js", "typescript", "supabase", "monorepo"]
dependencies: []
cross_references:
  - id: "supabase-patterns"
    type: "related"
    description: "Database and authentication patterns"
  - id: "testing-patterns"
    type: "related"
    description: "Testing strategies and patterns"
created: "2025-09-13"
last_updated: "2025-09-13"
author: "create-context"
---

# Architecture: Implementation Patterns

Core architectural patterns for the 2025slideheroes Next.js 15 monorepo with Supabase backend.

## Project Structure

### Monorepo Organization

```
apps/
├── web/                   # Main Next.js application
├── payload/               # Payload CMS
├── dev-tool/              # Development tooling
└── e2e/                   # End-to-end tests

packages/
├── ai-gateway/            # AI service integration
├── database-webhooks/     # Database webhook handlers
├── monitoring/            # Monitoring (api, core, newrelic, sentry)
├── next/                  # Next.js utilities & enhanceAction
├── shared/                # Shared utilities
├── supabase/              # Supabase client/utilities
└── ui/                    # UI components library
```

### Application Structure (apps/web)

```
app/                       # Next.js App Router
├── (marketing)/           # Marketing pages group
├── admin/                 # Admin dashboard
├── api/                   # API routes
├── auth/                  # Authentication pages
├── home/(user)/           # User dashboard
│   ├── ai/               # AI features
│   ├── course/           # Course management
│   └── kanban/           # Kanban board
└── onboarding/           # User onboarding

supabase/
├── migrations/           # Database migrations
└── functions/            # Edge functions
```

## Component Conventions

### File Organization

- **Route components**: `app/home/(user)/course/_components/`
- **Route logic**: `app/home/(user)/course/_lib/client/` and `_lib/server/`
- **Global components**: `components/` at root
- **Naming**: PascalCase for components, camelCase for utils, `Action` suffix for server actions

## Server Actions Pattern

### Enhanced Action (Project-Specific)

All server actions MUST use `enhanceAction` for consistent auth, validation, and error handling:

```typescript
"use server";
import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
});

export const updateProfileAction = enhanceAction(
  async (data, user) => {
    const supabase = getSupabaseServerClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({ name: data.name, email: data.email, bio: data.bio })
      .eq("user_id", user.id)
      .single();

    if (error) throw new Error("Failed to update profile");
    return { success: true, profile };
  },
  {
    auth: true,                    // Require authentication (default)
    schema: UpdateProfileSchema,   // Validate with Zod
    captcha: false,                // Optional CAPTCHA
  }
);
```

## Database Patterns

### Row-Level Security (RLS)

**CRITICAL**: All tables MUST have RLS enabled:

```sql
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON public.table_name FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify own data"
  ON public.table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Type Safety

```typescript
import type { Database } from "~/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type InsertProfile = Database["public"]["Tables"]["profiles"]["Insert"];
```

## Error Handling

### Structured Logging

```typescript
import { createServiceLogger } from "@kit/shared/logger";

const { getLogger } = createServiceLogger("SERVICE_NAME");

export async function performOperation() {
  const logger = await getLogger();

  try {
    const result = await riskyOperation();
    logger.info("Operation successful", { operation: "performOperation", result });
    return { success: true, data: result };
  } catch (error) {
    logger.error("Operation failed", {
      operation: "performOperation",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: "Failed to complete operation" };
  }
}
```

## Testing Patterns

### Test Configuration

Tests use Vitest with configuration in `packages/vitest.config.base.ts`:

```typescript
// Unit tests
import { describe, it, expect, vi } from "vitest";

// Mock Supabase client
vi.mock("@kit/supabase/server-client");

// E2E tests use Playwright
// See apps/e2e for test infrastructure
```

### Test Commands

```bash
pnpm test:unit        # Unit tests
pnpm test:e2e        # E2E tests
pnpm test:coverage   # Coverage report
```

## State Management

- **Server State**: Use server components and server actions
- **Client State**: Zustand for complex state, React hooks for simple state
- **Form State**: React Hook Form with Zod validation
- **Data Fetching**: SWR or React Query for client-side caching

## Security Patterns

### Input Validation

```typescript
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const UserInputSchema = z.object({
  content: z.string()
    .min(1)
    .max(1000)
    .transform((val) => DOMPurify.sanitize(val)),
  tags: z.array(z.string()).max(10),
});
```

### Authentication

```typescript
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

export async function protectedAction() {
  const client = getSupabaseServerClient();
  const auth = await requireUser(client);

  if (!auth.data) redirect(auth.redirectTo);
  return performAction(auth.data.id);
}
```

## Performance Patterns

- **Parallel Data Fetching**: Use `Promise.all()` for multiple queries
- **React Components**: Use `memo` sparingly, only for expensive renders
- **Images**: Use Next.js `Image` component with proper sizing
- **Code Splitting**: Leverage Next.js automatic code splitting

## Development Workflow

### Environment Variables

```typescript
// Type-safe environment variables
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
```

### Key Scripts

```json
{
  "dev": "turbo dev --parallel",
  "build": "turbo build",
  "lint": "biome lint . && pnpm lint:yaml && pnpm lint:md",
  "typecheck": "turbo typecheck",
  "test": "turbo test --filter=!web-e2e"
}
```

## Architecture Decisions

### Key Technology Choices

- **Next.js 15 App Router**: Server components for performance, better data fetching
- **Supabase**: Built-in auth, RLS for security, real-time subscriptions
- **pnpm Workspaces**: Efficient disk usage, strict dependency resolution
- **Biome**: Fast linting/formatting, replaces ESLint + Prettier
- **Vitest**: Fast unit testing with native TypeScript support
- **enhanceAction Pattern**: Consistent server action handling (project-specific)

### Trade-offs Accepted

- Vendor lock-in to Supabase for simpler auth and real-time features
- Monorepo complexity for better code sharing and type safety
- Server components learning curve for improved performance

---

**Related Contexts**: See specific pattern documentation in `.claude/context/` for detailed implementation guidance.
