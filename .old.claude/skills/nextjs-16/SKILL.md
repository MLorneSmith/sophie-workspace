---
name: nextjs-16
description: This skill provides comprehensive knowledge about Next.js 16, including breaking changes, new features, and migration guidance from Next.js 15. Use this skill when working with Next.js 16 codebases, migrating from earlier versions, or when encountering Next.js 16-specific patterns that models trained before October 2025 would not know about.
---

# Next.js 16 Knowledge Skill

## Purpose

Next.js 16 was released in October 2025 with significant breaking changes and new features. Models trained before this date (including Claude Opus, Sonnet, and Haiku) are unaware of these changes. This skill provides up-to-date knowledge about:

- Breaking changes requiring code modifications
- New caching philosophy and Cache Components
- Async request APIs (params, searchParams, cookies, headers)
- Turbopack as default bundler
- proxy.ts replacing middleware.ts
- React 19.2 support and React Compiler
- Migration patterns and best practices

## When to Use This Skill

Invoke this skill when:

- Working with a Next.js 16 codebase
- Migrating from Next.js 15 to Next.js 16
- Encountering async params/searchParams patterns
- Implementing caching with "use cache" directive
- Configuring Turbopack or migrating from Webpack
- Creating proxy.ts files
- Debugging Next.js 16-specific errors
- Need clarification on what changed between Next.js 15 and 16

## Critical Breaking Changes

### 1. Async Request APIs (Most Impactful)

All request-scoped APIs must now be accessed asynchronously:

**Affected APIs**:

- `params` prop (in pages, layouts, route handlers, metadata files)
- `searchParams` prop
- `cookies()`, `headers()`, `draftMode()`

**Code Pattern**:

```typescript
// Page component
export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  // ... use params and searchParams
}

// Using cookies/headers
const cookieStore = await cookies();
const headersList = await headers();
```

**References**: See `references/migration-guide.md` for comprehensive migration examples including layouts, metadata files, and server actions.

### 2. Middleware Renamed to Proxy

Rename `middleware.ts` to `proxy.ts` and change the export:

```typescript
// proxy.ts (formerly middleware.ts)
export function proxy(request: NextRequest) {
  // ... proxy logic
}
```

**Key difference**: proxy.ts runs on Node.js runtime (not Edge).

**References**: See `references/new-features.md` section "proxy.ts" for detailed usage patterns.

### 3. Turbopack is Default

Turbopack is now the default bundler. Projects with Webpack configurations must either:

- Migrate configuration to Turbopack syntax
- Opt-out using `--webpack` flag: `next dev --webpack`

**References**: See `references/new-features.md` section "Turbopack" for configuration examples.

## New Features

### Cache Components ("use cache")

Next.js 16 shifts from implicit to explicit caching using the `"use cache"` directive:

```typescript
'use cache';

export async function MyComponent() {
  cacheLife('hours');  // Optional cache profile
  cacheTag('my-tag');  // Optional cache tag

  const data = await fetchData();
  return <div>{data}</div>;
}
```

**New caching APIs**:

- `updateTag()` - Immediate read-your-writes semantics
- `revalidateTag(tag, cacheLife)` - Enhanced with cache profiles
- `refresh()` - Refresh only uncached data

**References**: See `references/new-features.md` section "Cache Components" for comprehensive usage patterns and cache configuration.

### Next.js DevTools MCP

Built-in Model Context Protocol integration for AI-assisted debugging with contextual Next.js knowledge.

### Enhanced Logging

Development and build logs now show detailed timing breakdowns for compile, render, and build steps.

## Migration Strategy

### Automated Migration

Run the official codemod:

```bash
npx @next/codemod@canary upgrade latest
```

This automates:

- Adding `await` to params/searchParams
- Adding `await` to cookies()/headers()/draftMode()
- Renaming middleware.ts to proxy.ts
- Turbopack config migration (if applicable)

### Manual Migration Steps

1. **Verify Node.js version**: 20.9.0 or higher required
2. **Verify TypeScript version**: 5.1.0 or higher required
3. **Run codemod**: `npx @next/codemod@canary upgrade latest`
4. **Add default.js to parallel routes**: All parallel route slots now require default.js
5. **Update image configuration**: If using custom image config, check new defaults
6. **Test thoroughly**: Run `next dev` and `next build`

**References**: See `references/migration-guide.md` for complete migration checklist and detailed examples.

## Common Patterns

### Page Components with Async Props

```typescript
interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  // Parallel data fetching
  const [data1, data2] = await Promise.all([
    fetchData1(params.id),
    fetchData2(searchParams.filter)
  ]);

  return <div>...</div>;
}
```

### Server Actions with Cache Invalidation

```typescript
'use server';

import { updateTag, revalidateTag } from 'next/cache';

export async function createItem(data: ItemData) {
  const item = await db.item.create({ data });

  // Immediate UI update
  updateTag('items');

  return item;
}

export async function updateItem(id: string, data: ItemData) {
  const item = await db.item.update({ where: { id }, data });

  // Revalidate with cache profile
  revalidateTag('items', 'hours');

  return item;
}
```

**References**: See `references/common-patterns.md` for extensive pattern library covering:

- Async props in pages and layouts
- Metadata generation
- Server actions with cookies/headers
- Cache component patterns
- Proxy patterns (authentication, geo-routing, A/B testing)
- Error handling and loading states
- Type-safe patterns

## Using the Reference Documentation

This skill includes three comprehensive reference documents:

1. **migration-guide.md**: Step-by-step migration from Next.js 15, with before/after examples for every breaking change
2. **new-features.md**: In-depth coverage of Cache Components, Turbopack, proxy.ts, React 19.2, and React Compiler
3. **common-patterns.md**: Practical code patterns for real-world Next.js 16 development

Load these references into context when:

- Detailed migration guidance is needed
- Implementing specific features (caching, routing, etc.)
- Need comprehensive examples for a particular pattern
- Debugging complex Next.js 16 issues

## Key Reminders

- **Always await params and searchParams** - No exceptions in Next.js 16
- **Always await cookies(), headers(), draftMode()** - Synchronous access removed
- **Caching is explicit** - Use "use cache" directive for opt-in caching
- **Turbopack is default** - Use --webpack flag only if necessary
- **proxy.ts runs on Node.js** - Not Edge runtime like middleware.ts was
- **All parallel routes need default.js** - Builds fail without them
- **Node.js 20.9.0+ required** - Node.js 18 no longer supported

## Quick Reference: What Changed From Next.js 15

| Aspect | Next.js 15 | Next.js 16 |
|--------|------------|------------|
| Params/SearchParams | Synchronous | **Async (await required)** |
| cookies()/headers() | Synchronous | **Async (await required)** |
| Caching | Implicit by default | **Explicit opt-in ("use cache")** |
| Bundler | Webpack default | **Turbopack default** |
| Network boundary | middleware.ts | **proxy.ts** |
| Runtime (middleware) | Edge | **Node.js (in proxy.ts)** |
| Parallel routes | default.js optional | **default.js required** |
| Node.js min version | 18.18.0 | **20.9.0** |
| TypeScript min version | 5.0.0 | **5.1.0** |
| React version | 19.0 | **19.2** |
| React Compiler | Experimental | **Stable** |

## Additional Resources

For the most current information, consult:

- Official migration guide: <https://nextjs.org/docs/app/guides/upgrading/version-16>
- Next.js 16 announcement: <https://nextjs.org/blog/next-16>
- Turbopack documentation: <https://nextjs.org/docs/app/api-reference/turbopack>
