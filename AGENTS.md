# AGENTS.md

## Project Overview

SlideHeroes — AI-powered presentation platform built with Next.js 16, Supabase, and TypeScript in a pnpm monorepo.

## Identity & Interaction

- Experienced, pragmatic software engineer who avoids over-engineering
- Push back with evidence when you believe a different approach would be better
- Admit when you don't know something rather than guessing
- Do what's asked; nothing more, nothing less

## Core Technologies

- **Next.js 16** with App Router
- **Supabase** for database, auth, and storage
- **React 19.2**
- **TypeScript** (strict mode)
- **Tailwind CSS 4**, Shadcn UI, Lucide React
- **Turborepo** (pnpm workspace)

## Monorepo Structure

- `apps/web` — Main Next.js SaaS application
- `apps/web/supabase` — Supabase folder (migrations, schemas, tests)
- `apps/e2e` — Playwright end-to-end tests
- `packages/features/*` — Feature packages
- `packages/` — Shared packages and utilities

## Multi-Tenant Architecture

- **Personal Accounts**: Individual user accounts (auth.users.id = accounts.id)
- **Team Accounts**: Shared workspaces with members, roles, and permissions
- Data associates with accounts via foreign keys for proper access control

## Core Development Principles

1. **Never expose API keys** — Use server actions for AI/external APIs
2. **Always validate input** — Use Zod schemas everywhere
3. **Follow RLS patterns** — Never bypass security policies
4. **Use enhanceAction** — For all server actions (@packages/next/src/actions/index.ts)
5. **Implement proper error handling** — User-friendly messages
6. **Schema-first development** — Define Zod schemas first, derive types from schemas

## TypeScript Rules

- No `any` types — use `unknown` with type guards
- Strict mode enabled
- Use implicit type inference where possible
- Handle errors gracefully using try/catch
- Use service pattern for server-side APIs
- Add `import 'server-only';` to exclusively server-side code
- Never mix client and server imports

## React Rules

- Write small, composable, well-named components
- Always use `react-hook-form` and `@kit/ui/form` for forms
- Always use `'use client'` directive for client components
- `useEffect` is a code smell — avoid if possible
- Prefer single state object over many separate `useState`
- Prefer server-side data fetching using RSC
- Add `data-testid` for E2E tests where appropriate

## Next.js Rules

- Use `enhanceAction` for Server Actions
- Use `enhanceRouteHandler` for API Routes
- Export page components using `withI18n` utility
- Prefer Server Components; client components only when needed for interactivity
- Use `Promise.all()` for parallel data fetching in Server Components

## Data Fetching Architecture

### Server Components with Loaders (Reading Data)

Use async server components that call loader functions:

```typescript
// Page: apps/web/app/home/[account]/page.tsx
async function TeamAccountPage({ params }: Props) {
  const client = getSupabaseServerClient();
  const slug = (await params).account;
  const [projects, workspace] = await loadProjectsPageData(client, slug);
  return <ProjectsList projects={projects} />;
}

// Loader: _lib/server/projects-page.loader.ts
import 'server-only';
export async function loadProjectsPageData(client: SupabaseClient<Database>, slug: string) {
  return Promise.all([loadProjects(client, slug), loadTeamWorkspace(slug)]);
}
```

### Server Actions (Mutations Only)

Use `enhanceAction` for create/update/delete:

```typescript
'use server';
import { enhanceAction } from '@kit/next/actions';

export const createProject = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const service = createProjectsService();
    const response = await service.createProject(data);
    if (response.error) throw response.error;
    return { success: true, data: response.data };
  },
  { schema: CreateProjectSchema },
);
```

## Database & Supabase

### Critical Workflow ⚠️

Always follow this exact order:

1. Create/modify schema file in `apps/web/supabase/schemas/XX-feature.sql`
2. Generate migration: `pnpm --filter web supabase:db:diff -f <migration_name>`
3. Apply changes: `pnpm --filter web supabase migration up` (or `pnpm supabase:web:reset`)
4. Generate types: `pnpm supabase:web:typegen`
5. Verify types exist before using in code

**NEVER skip step 2** — schema files alone don't create tables!

### RLS Rules

- Always enable RLS on new tables
- Create separate policies for SELECT, INSERT, UPDATE, DELETE
- Index RLS filter columns (user_id, tenant_id, etc.)
- Use ownership patterns: `auth.uid() = user_id`
- Never use SECURITY DEFINER without explicit access controls
- Use `security_invoker=true` for views

## File Organization

### Route Structure

```text
apps/web/app/home/[account]/
├── page.tsx
├── _components/           # Route-specific components
├── _lib/
│   ├── server/            # Server-side logic
│   │   ├── *-page.loader.ts
│   │   └── *-server-actions.ts
│   └── schemas/           # Zod validation schemas
│       └── *.schema.ts
```

### Naming Conventions

- Pages: `page.tsx`
- Loaders: `{feature}-page.loader.ts`
- Actions: `{feature}-server-actions.ts`
- Schemas: `{feature}.schema.ts`
- Components: `kebab-case.tsx`

## UI Components

Located at `packages/ui` — 45+ shadcn/ui components plus custom ones.

```bash
# Add component
pnpm --filter @kit/ui ui:add button

# Search components
pnpm --filter @kit/ui ui:search -q "form"

# Community registries
cd packages/ui && npx shadcn@latest add @magicui/animated-button
```

After adding via CLI, update exports in `packages/ui/package.json`.

## Git Commit Convention

Format: `type(scope): description [agent: name]`

```text
feat(auth): add OAuth2 social login support [agent: codex]
fix(cms): resolve quiz relationship bug [agent: codex]
chore(deps): update Next.js to v16.2 [agent: codex]
```

**Types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
**Scopes:** web, payload, e2e, dev-tool, auth, billing, canvas, course, quiz, admin,
api, cms, ui, migration, config, deps, tooling, ci, deploy, docker, security

**Rules:**

- Present tense: "add" not "added"
- Lowercase after colon
- 50-72 chars for description
- Body lines max 100 chars
- No period at end

## Essential Commands

### Development

```bash
pnpm dev                              # Start all apps
pnpm build                            # Build production
```

### Code Quality

```bash
pnpm typecheck                        # Type checking (MUST pass)
pnpm lint:fix                         # Lint + auto-fix
pnpm format:fix                       # Format code
pnpm codecheck                        # Full code quality check
```

### Database

```bash
pnpm supabase:web:start               # Start local Supabase
pnpm --filter web supabase migration up  # Apply migrations
pnpm supabase:web:reset               # Reset database
pnpm supabase:web:typegen             # Generate TypeScript types
pnpm --filter web supabase:db:diff    # Create migration
```

### Testing

```bash
pnpm test:unit                        # Unit tests
pnpm test:e2e                         # E2E tests
pnpm test:coverage                    # Tests with coverage
```

### Git

```bash
git status --porcelain                # Check status
git diff --name-only                  # Changed files
git log --oneline -5                  # Recent commits
```

## Research Tools

Research tools are available in `.ai/bin/`:

```bash
# Library documentation lookup
.ai/bin/context7-search "library name"
.ai/bin/context7-get-context OWNER REPO --topic "topic" --tokens 2500

# AI-powered web search
.ai/bin/perplexity-chat "question" --show-citations
.ai/bin/perplexity-search "query" --recency month

# Web search & content
.ai/bin/exa-search "query"
.ai/bin/exa-answer "question"
.ai/bin/exa-get-contents "url"
```

## Context Documentation

Detailed docs are in `.ai/ai_docs/context-docs/`:

- **Development:** architecture-overview, database-patterns, server-actions,
  react-query-patterns, shadcn-ui-components, makerkit-integration
- **Infrastructure:** auth-overview, auth-implementation, docker-setup,
  vercel-deployment, ci-cd-complete
- **Testing:** fundamentals, e2e-testing, integration-testing, vitest-configuration

Read relevant docs before implementing complex features.

## Reports Directory

```text
.ai/reports/
├── bug-reports/YYYY-MM-DD/
├── feature-reports/YYYY-MM-DD/
├── chore-reports/YYYY-MM-DD/
└── research-reports/YYYY-MM-DD/
```

## Quality Checklist

**MANDATORY before every commit.** CI will reject PRs that fail these checks.

```bash
# 1. Format code (Biome)
pnpm format:fix

# 2. Lint and auto-fix (Biome)
pnpm lint:fix

# 3. Type check (TypeScript)
pnpm typecheck
```

**All three must pass before committing.** If `typecheck` fails, fix the type errors — don't use `any` or `@ts-ignore`.

After fixing, commit with `--no-verify` if the local pre-commit hook
times out on TruffleHog or markdownlint for non-code files — but
**only after confirming the three checks above pass**.

### Commit workflow

```bash
pnpm format:fix && pnpm lint:fix && pnpm typecheck
git add -A
git commit -m "type(scope): description [agent: agent]"
git push origin <branch>
```

## Key Reminders

- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless requested
- Fix the code, not the test (when tests fail)
- Use `Promise.all()` for parallel fetching
- Handle errors with proper logging via `@kit/shared/logger`
