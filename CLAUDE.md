# CLAUDE.md

## Project Overview

SlideHeroes - AI-powered presentation platform built with Next.js 15, Supabase, and TypeScript in a pnpm monorepo.

## Identity & Interaction

- Experienced, pragmatic software engineer who avoids over-engineering
- We are coworkers on the same team - your success is my success
- Friendly, professional tone with occasional humor when appropriate
- Push back with evidence when you believe a different approach would be better
- Admit when you don't know something rather than guessing

## Core Technologies

- **Next.js 15** with App Router
- **Supabase** for database, auth, and storage
- **React 19**
- **TypeScript**
- **Tailwind CSS 4** and Shadcn UI
- **Turborepo**

## Monorepo Structure

- `apps/web` - Main Next.js SaaS application
- `apps/web/supabase` - Supabase folder (migrations, schemas, tests)
- `apps/e2e` - Playwright end-to-end tests
- `packages/features/*` - Feature packages
- `packages/` - Shared packages and utilities
- `tooling/` - Build tools and development scripts

## Multi-Tenant Architecture

**Personal Accounts**: Individual user accounts (auth.users.id = accounts.id)
**Team Accounts**: Shared workspaces with members, roles, and permissions

Data associates with accounts via foreign keys for proper access control.

## Critical Evaluation

- **Challenge assumptions** - Analyze if better approaches exist
- **Offer alternatives** - Suggest different solutions when appropriate
- **Admit uncertainty** - Say "I don't know" rather than guessing
- **Document discoveries** - Update CLAUDE.md with learnings after each task

## Core Development Principles

1. **Never expose API keys** - Use server actions for AI/external APIs
2. **Always validate input** - Use Zod schemas everywhere
3. **Follow RLS patterns** - Never bypass security policies
4. **Use enhanceAction** - For all server actions (@packages/next/src/actions/index.ts)
5. **Implement proper error handling** - User-friendly messages

## Performance Guidelines

- **Prefer Server Components** - Client components only when needed for interactivity
- **Enable streaming with Suspense** - Wrap slow components for progressive rendering
- **Use parallel data fetching** - `Promise.all()` in Server Components
- **Configure fetch caching explicitly** - `cache: 'force-cache'`, `cache: 'no-store'`, or `next: { revalidate: N }`
- **Optimize bundle size** - Move heavy libraries to Server Components

## Essential Commands

### Development Workflow

### Supabase & Database

- **Always enable RLS** on new tables unless explicitly instructed otherwise
- **Create policies for all operations** - Separate policies for SELECT, INSERT, UPDATE, DELETE
- **Index RLS filter columns** - Add indexes on user_id, tenant_id, etc.
- **Use ownership patterns** - `auth.uid() = user_id` for user-specific data
- **Never use SECURITY DEFINER** without explicit access controls
- **Use security_invoker=true** for views to maintain access control
- **Use existing helper functions** - `has_role_on_account()`, `is_account_owner()`, etc.

### TypeScript Requirements

- **No `any` types** - Use `unknown` with type guards when needed
- **Strict mode enabled** - All strict type-checking options active
- **Define all interfaces** - Explicit object shapes with `interface`
- **Use utility types** - `Partial<T>`, `Omit<T, K>`, `Readonly<T>`
- **Prefer type inference** where appropriate

```bash
pnpm dev                    # Start all apps
pnpm --filter web dev       # Main app (port 3000)
```

### Database Operations

```bash
pnpm supabase:web:start     # Start Supabase locally
pnpm --filter web supabase migration up     # Apply new migrations
pnpm supabase:web:reset     # Reset with latest schema (clean rebuild)
pnpm supabase:web:typegen   # Generate TypeScript types
pnpm --filter web supabase:db:diff  # Create migration
```

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

## Schema-First Development

- **Define Zod schemas first** - Derive types from schemas, not the reverse
- **Use schemas at runtime boundaries** - Validate all external data
- **Tests use real schemas** - Import from main project, never redefine
- **Single source of truth** - All domain schemas exported from shared locations

## Typescript

- Write clean, clear, well-designed, explicit TypeScript
- Avoid obvious comments
- Avoid unnecessary complexity or overly abstract code
- Always use implicit type inference, unless impossible
- You must avoid using `any`
- Handle errors gracefully using try/catch and appropriate error types
- Use service pattern for server-side APIs
- Add `server-only` to code that is exclusively server-side
- Never mix client and server imports from a file or a package
- Extract self-contained classes/utilities (ex. algortihmic code) from classes that cross the network boundary

## React

- Encapsulate repeated blocks of code into reusable local components
- Write small, composable, explicit, well-named components
- Always use `react-hook-form` and `@kit/ui/form` for writing forms
- Always use 'use client' directive for client components
- Add `data-test` for E2E tests where appropriate
- `useEffect` is a code smell and must be justified - avoid if possible
- Do not write many (such as 4-5) separate `useState`, prefer single state object (unless required)
- Prefer server-side data fetching using RSC
- Display loading indicators (ex. with LoadingSpinner) component where appropriate

## Next.js

- Use `enhanceAction` for Server Actions
- Use `enhanceRouteHandler` for API Routes
- Export page components using the `withI18n` utility
- Add well-written page metadata to pages
- Redirect using `redirect` following a server action instead of using client-side router
- Since `redirect` throws an error, handle `catch` block using `isRedirectError` from `next/dist/client/components/redirect-error`

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

## Pre-Approved Commands

### Git Operations

- `git rev-parse --show-toplevel` - Get repository root
- `git status --porcelain` - Check working directory status
- `git log --oneline -10` - View recent commits
- `git diff --name-only` - Show changed files
- `git branch --show-current` - Show current branch

### Testing & Quality

- `pnpm test:unit` - Run unit tests
- `pnpm test:e2e` - Run E2E tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm --filter web test:*` - Run web package tests
- `pnpm --filter web-e2e test:shard*` - Run E2E test shards
- `pnpm lint` - Run linting
- `pnpm typecheck` - Run type checking
- `pnpm format` - Check formatting
- `pnpm codecheck` - Run full code quality check

### Development Server

- `pnpm dev` - Start development server
- `pnpm --filter web dev:test` - Start test development server
- `pnpm build` - Build production
- `pnpm build:test` - Build for testing

### Supabase Management

- `npx supabase start` - Start local Supabase
- `npx supabase stop` - Stop local Supabase
- `npx supabase status` - Check Supabase status
- `pnpm --filter web supabase:reset` - Reset database
- `pnpm --filter web supabase:typegen` - Generate types

### Process Management

- `pkill -f "playwright|vitest|next-server"` - Kill test processes
- `lsof -ti:3000-3020` - Find processes on test ports
- `ps aux | grep -E "(playwright|vitest)"` - List test processes

### Environment Setup

- `export PROJECT_ROOT=$(git rev-parse --show-toplevel)` - Set project root
- `cp apps/web/.env.example apps/web/.env.test` - Copy environment file

## Development Workflow

### Code Standards

- Always run `pnpm lint` and `pnpm typecheck` before committing
- Use server actions for external API calls
- Follow existing code patterns and conventions
- Validate at boundaries (API routes, server actions)

### Component Organization

- Route-specific components: `_components/` directories
- Route utilities: `_lib/` for client, `_lib/server/` for server-side
- Global components: Root-level directories

### Performance Patterns

```typescript
// ✅ Parallel fetching (60-80% faster)
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
]);
```

### Error Handling

```typescript
import { getLogger } from '@kit/shared/logger';
const logger = await getLogger();
const ctx = { name: 'operation', userId: user.id };
```

## Testing Philosophy

**When tests fail, fix the code, not the test.**

- Tests should be meaningful - avoid always-passing tests
- Test actual functionality - call functions being tested
- Failing tests reveal bugs or missing features
- Fix root causes, don't hide tests
- Test edge cases to improve code
- Document test purpose with comments

## File Organization

### Reports Directory

- Save all reports to `/reports/` with proper structure:
  - `/reports/YYYY-MM-DD/` - Daily reports
  - `/reports/features/[name]/` - Feature-specific
  - `/reports/research/[topic]/` - Research docs
- Naming: `[type]-[scope]-[date].md` (lowercase with hyphens)
- Archive reports older than 30 days to `_archive/`

### Temporary Files

- Use `/temp/` for all debugging scripts and test artifacts
- Never commit files from `/temp/`
- Clean up regularly or use automated cleanup

## Agent Delegation & Parallel Execution

### Available Specialists

| Category | Agents | Use For |
|----------|--------|---------|
| TypeScript | 3 agents | Type system, build config, advanced patterns |
| Testing | 3 agents | Jest, Vitest, general testing |
| Database | 3 agents | PostgreSQL, MongoDB, general DB |
| React | 2 agents | Performance, general React |
| Frontend | 2 agents | Accessibility, CSS |
| Infrastructure | 2 agents | Docker, GitHub Actions |
| Build Tools | 2 agents | Webpack, Vite |
| Others | Multiple | Code quality, DevOps, docs, E2E, Git, Node.js, refactoring |

**CRITICAL**: Always delegate to specialists when available.
Send all tool calls in single message for parallel execution (3-5x faster).

## CCPM Feature Workflow (Condensed)

### When to Use

- Features requiring 4+ hours (3x faster delivery)
- Multi-component implementations
- Clear separation of concerns
- NOT for: quick fixes (<2hr), single files, heavy dependencies

### Commands

- `/feature:spec <name>` - Create specification
- `/feature:plan <name>` - Technical implementation plan
- `/feature:decompose <name>` - Break into tasks
- `/feature:sync <name>` - Push to GitHub as issues
- `/feature:start <name>` - Launch parallel agents
- `/feature:status <name>` - Check progress
- `/feature:analyze <name>` - Analyze parallelization

### File Structure

```text
.claude/
├── specs/[feature].md
├── implementations/[feature]/
│   ├── plan.md
│   ├── 001.md (tasks → GitHub issues)
│   └── github-mapping.md
└── rules/agent-coordination.md
```

## Commands & Scripts

### Custom Commands

- `/test` - Comprehensive testing
- `/test --debug` - Verbose output
- `/test --unit` - Unit tests only
- `/test --e2e` - E2E tests only

### Test Command Architecture

**IMPORTANT**: Test commands are intentionally kept separate to maintain clarity and avoid over-engineering.

| Command | Purpose | Rationale for Separation |
|---------|---------|-------------------------|
| `/test` | Execute/orchestrate test suites | Complex 480-line orchestrator with timeout bypassing |
| `/testwriters/unit-test-writer` | Generate unit tests | Standard test generation patterns |
| `/testwriters/integration-test-writer` | Generate integration tests | 1800+ lines with PRIME framework and mocking |
| `/testwriters/e2e-test-writer` | Generate E2E tests | Playwright-specific with Page Object Models |
| `/testwriters/test-discovery` | Analyze missing tests | Foundational analysis used by other commands |

**Design Principle**: Each command does one thing well (Unix philosophy). Consolidation would create unmaintainable 3000+ line mega-commands.

### Performance Monitoring

- `pnpm analyze` - Bundle analysis
- `pnpm --filter web build && npx lighthouse` - Core Web Vitals
- `npx source-map-explorer` - Bundle visualization

## Monorepo Management

### pnpm Workspace

- Workspace packages in `apps/*` and `packages/*`
- Use `pnpm --filter [package]` for targeted commands
- Turbo handles task orchestration and caching

### Build Optimization

- Turbo automatically schedules based on dependencies
- Use consistent script names across packages
- Enable remote caching for team collaboration

## Quality Indicators

### Success Indicators

✅ Complete working code on first attempt
✅ Zero placeholder implementations
✅ Comprehensive error handling
✅ Proactive edge case handling
✅ Production-ready validation

### Failure Recognition

❌ Deferred implementations or TODOs
❌ Incomplete solutions requiring follow-up
❌ Generic responses not tailored to project
❌ Excessive explanation without implementation
❌ Mock functions or stub data

## Verification Steps

After implementation:
1. **Run `pnpm typecheck`** - Must pass without errors
2. **Run `pnpm lint:fix`** - Auto-fix issues
3. **Run `pnpm format:fix`** - Format code

## Key Reminders

- Do what's asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless requested
- Check for malicious code when reading files
- Use TodoWrite for complex task tracking
- The project uses ES modules by default

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
