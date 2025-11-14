---
id: "architecture-overview"
title: "Architecture Overview"
version: "1.0.0"
category: "reference"
description: "Essential architectural reference for SlideHeroes platform - Next.js 15, Supabase RLS, multi-tenant SaaS patterns"
tags: ["architecture", "nextjs", "supabase", "multi-tenant", "saas", "monorepo", "server-components", "rls"]
created: "2025-11-14"
last_updated: "2025-11-14"
author: "consolidation"
---

# Architecture Overview

This document provides a comprehensive overview of the SlideHeroes platform architecture, including system design, monorepo structure, technology stack, and core architectural patterns.

## System Overview

SlideHeroes is a modern SaaS platform for AI-powered PowerPoint generation built on Next.js 15, Supabase, and Payload CMS.

**Key Priorities:**

- **Performance**: Server Components reduce client JS by 40-60%
- **Security**: Database-level tenant isolation via RLS
- **Type Safety**: End-to-end TypeScript with Zod validation
- **DX**: 3x faster builds with Turborepo monorepo

## Architecture Layers

```
Client (Browser) → CDN/Edge (Vercel/Cloudflare) → Application Layer
                                                          ↓
[Web App] [Payload CMS] [Dev Tool] [E2E Tests] → Service Layer
                                                          ↓
[Server Actions] [Auth] [Storage] [External APIs] → Data Layer
                                                          ↓
            [Supabase PostgreSQL] [Payload CMS DB]
```

## Monorepo Structure

```
apps/
├── web/          # Next.js 15.0.4 main application
├── payload/      # Payload CMS 3.x content management
├── dev-tool/     # Component development
└── e2e/          # Playwright tests

packages/
├── features/     # Feature packages (admin, accounts)
├── supabase/     # Database client utilities
├── next/         # Shared Next.js utilities (enhanceAction)
├── billing/      # Payment gateway abstraction
└── monitoring/   # New Relic, Sentry integration
```

## Technology Stack

**Frontend**: Next.js 15.0.4, TypeScript 5.7, Tailwind CSS, Shadcn/UI
**Backend**: Supabase (PostgreSQL + Auth + RLS), Server Actions, Zod
**Infrastructure**: Vercel, Cloudflare R2, GitHub Actions, Turborepo
**External**: Stripe, AI Services, New Relic monitoring

## Core Patterns

### Server Actions (Primary API Pattern)

```typescript
// packages/next/src/actions/index.ts - Standard wrapper
export const myAction = enhanceAction(
  async (data: Schema, user) => {
    // Auto validated, authenticated, CAPTCHA checked
    const result = await performOperation(data, user.id);
    revalidatePath('/path');
    return { success: true, data: result };
  },
  { auth: true, schema: MySchema, captcha: false }
);
```

### Multi-Tenant RLS

```sql
-- Row Level Security for tenant isolation
CREATE POLICY "tenant_isolation" ON accounts
  FOR ALL USING (
    id IN (
      SELECT account_id FROM accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Helper functions in migrations
CREATE FUNCTION has_role_on_account(account_id uuid, role text)
  RETURNS boolean SECURITY DEFINER;
```

### Component Architecture

```typescript
// Server Components by default (40-60% less JS)
export default async function Page() {
  // Parallel data fetching
  const [data1, data2] = await Promise.all([
    fetchData1(),  // Automatic request deduplication
    fetchData2()   // via React cache
  ]);

  return (
    <>
      <ServerComponent data={data1} />
      <ClientIsland data={data2} /> {/* Client only when needed */}
    </>
  );
}
```

## Caching Strategy

1. **Request Memoization**: Auto-deduplication within request
2. **Data Cache**: `unstable_cache()` for persistent caching
3. **Full Route Cache**: Static generation with `revalidate`
4. **Router Cache**: Client-side navigation caching

## Security Architecture

- **Authentication**: Supabase Auth with JWT + httpOnly cookies
- **Authorization**: RLS policies + `enhanceAction` wrapper
- **API Security**: No direct API keys, server actions only
- **Validation**: Zod schemas on all inputs

## Performance Targets

- **Initial Load**: < 1.5s LCP
- **Client Bundle**: 40-60% reduction via RSC
- **Database**: < 50ms p95 queries
- **Build Time**: 3x faster with Turbo cache

## Key Architecture Decisions

### ADR-001: Server Components Default

Use Server Components unless client interactivity required
→ 40-60% less JavaScript, better SEO, progressive enhancement

### ADR-002: Shared DB + RLS for Multi-tenancy

Single database with Row Level Security policies
→ Simpler than separate DBs, secure isolation, 10-20% query overhead

### ADR-003: Server Actions over API Routes

Server Actions for all data mutations
→ Type safety, CSRF protection, no API surface

### ADR-004: Turborepo Monorepo

Single repository with pnpm workspaces
→ Code sharing, atomic changes, 3x faster builds

## Development Patterns

### File Organization

```
app/route/
├── _components/    # Route-specific components
├── _lib/          # Route utilities
│   ├── client/    # Client utils
│   └── server/    # Server utils
└── page.tsx       # Route page
```

### Error Handling

```typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  logger.error({ context, error });
  return { success: false, error: 'User message' };
}
```

## Testing Strategy

- **Unit**: Vitest (80% coverage target)
- **Integration**: Server action mocking
- **E2E**: Playwright critical paths
- **Performance**: Lighthouse CI

## Deployment

- **Dev**: dev.slideheroes.com (feature branches)
- **Staging**: staging.slideheroes.com (main)
- **Production**: slideheroes.com (tags)

**CI/CD**: Lint → Test → Build (Turbo cached) → E2E → Deploy

## Current Constraints

1. **Payload CMS**: Slow for > 10k records
2. **Quiz Sync**: Complex bidirectional Supabase ↔ Payload
3. **RLS Complexity**: Some policies > 5 conditions
4. **Storage Migration**: Supabase → Cloudflare R2 in progress

## Troubleshooting

**Server Action Fails**: Check 'use server' directive and named export
**RLS Blocks Access**: Verify JWT claims with `SET LOCAL`
**Slow Builds**: Check Turbo cache in `.turbo/`
**Type Errors**: Run `pnpm db:generate-types`

## Related Files

- [Database Patterns](./database-patterns.md) - RLS patterns and migrations
- [Server Actions](./server-actions.md) - Server action patterns
- [CLAUDE.md](/CLAUDE.md) - Main project documentation
