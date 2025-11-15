# Development Documentation

Core development patterns, frameworks, and architectural guidance for SlideHeroes.

## Overview

This directory contains essential documentation for building features in the SlideHeroes platform. Topics cover architecture, data patterns, frameworks, and development workflows.

## Files in This Category

### Architecture & Core Patterns

#### [architecture-overview.md](./architecture-overview.md)

System architecture, monorepo structure, technology stack, and core design patterns.

**When to use**: Understanding overall system design, technology choices, or project structure.

#### [database-patterns.md](./database-patterns.md)

Database patterns including RLS (Row Level Security), migrations, junction tables, and type safety.

**When to use**: Creating tables, writing migrations, implementing RLS policies, managing relationships.

#### [server-actions.md](./server-actions.md)

Server action patterns with `enhanceAction`, service architecture, and error handling.

**When to use**: Creating API endpoints, implementing mutations, handling server-side logic.

### Frameworks & Integration

#### [react-query-patterns.md](./react-query-patterns.md)

TanStack Query v5 patterns for data fetching, mutations, SSR hydration, and caching.

**When to use**: Fetching data in client components, implementing optimistic updates, SSR integration.

#### [react-query-advanced.md](./react-query-advanced.md)

Advanced React Query patterns: infinite queries, dependent queries, real-time subscriptions.

**When to use**: Complex data fetching scenarios, pagination, Supabase real-time integration.

#### [makerkit-integration.md](./makerkit-integration.md)

MakerKit template usage, upstream syncing, and merge automation (95% conflict reduction).

**When to use**: Syncing with MakerKit upstream, resolving template conflicts, understanding template patterns.

#### [prime-framework.md](./prime-framework.md)

PRIME methodology for creating slash commands with action-first design.

**When to use**: Building new slash commands, creating command workflows.

#### [ccpm-system.md](./ccpm-system.md)

CCPM (Concurrent Claude Project Management) for parallel agent execution and 3x faster delivery.

**When to use**: Large features requiring parallel implementation, multi-agent workflows.

### UI & Components

#### [shadcn-ui-components.md](./shadcn-ui-components.md)

Component inventory (40 components), usage patterns, and dark mode support.

**When to use**: Selecting UI components, understanding component APIs, implementing dark mode.

## Common Workflows

### Starting a New Feature

1. Review [architecture-overview.md](./architecture-overview.md) for system structure
2. Check [database-patterns.md](./database-patterns.md) if data models needed
3. Use [server-actions.md](./server-actions.md) for backend logic
4. Apply [react-query-patterns.md](./react-query-patterns.md) for data fetching
5. Use [shadcn-ui-components.md](./shadcn-ui-components.md) for UI elements

### Implementing Authentication Flow

1. [architecture-overview.md](./architecture-overview.md) - Understand auth architecture
2. [database-patterns.md](./database-patterns.md) - RLS patterns for data access
3. [server-actions.md](./server-actions.md) - Auth-protected actions
4. See also: [../infrastructure/auth-overview.md](../infrastructure/auth-overview.md)

### Setting Up Data Fetching

1. [react-query-patterns.md](./react-query-patterns.md) - Basic query setup
2. [server-actions.md](./server-actions.md) - Mutation endpoints
3. [react-query-advanced.md](./react-query-advanced.md) - Complex scenarios
4. [database-patterns.md](./database-patterns.md) - Database queries

## Prerequisites

Before diving into this documentation:

- **Required reading**: [CLAUDE.md](./../../CLAUDE.md) for project-wide conventions
- **Environment setup**: Local development environment configured
- **Technology familiarity**: Next.js 15, React 19, TypeScript, Supabase basics

## Related Documentation

- **Testing**: [../testing+quality/](../testing+quality/) - Testing patterns for features
- **Infrastructure**: [../infrastructure/](../infrastructure/) - Deployment and CI/CD
- **Tools**: [../tools/](../tools/) - CLI tools and external services

## Quick Reference

### Key Technologies

- **Framework**: Next.js 15 with App Router
- **Backend**: Supabase (database, auth, storage)
- **UI**: React 19, Tailwind CSS 4, Shadcn UI
- **Data Fetching**: TanStack Query v5
- **Validation**: Zod schemas
- **Type Safety**: TypeScript strict mode

### Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm typecheck             # Check TypeScript
pnpm lint:fix              # Fix linting issues

# Database
pnpm supabase:web:start    # Start local Supabase
pnpm --filter web supabase migration up    # Apply migrations
pnpm supabase:web:typegen  # Generate types
```

See [../tools/cli-references.md](../tools/cli-references.md) for complete command reference.

---

*Last updated: 2025-11-14*
