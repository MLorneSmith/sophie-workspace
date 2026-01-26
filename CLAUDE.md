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

- **Next.js 16** with App Router
- **Supabase** for database, auth, and storage
- **React 19.2**
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
```

### Database Operations

```bash
pnpm supabase:web:start     # Start Supabase locally
pnpm --filter web supabase migrations up     # Apply new migrations
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

⚠️ **NEVER skip step 2** - schema files alone don't create tables! The migration
step is required to apply changes to the database.

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

## Git Commit Convention

This project uses **Conventional Commits with Agent Traceability** for all commits.

### Format

```
type(scope): description [agent: name]
```

**Example:**
```bash
feat(auth): add OAuth2 social login support [agent: sdlc_implementor]
fix(cms): resolve quiz relationship bug [agent: debug_engineer]
chore(deps): update Next.js to v16.2 [agent: sdlc_planner]
```

### Valid Types

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Build system changes
- `ci` - CI configuration changes
- `chore` - Maintenance tasks
- `revert` - Revert previous commits

### Valid Scopes

- **Apps**: `web`, `payload`, `e2e`, `dev-tool`
- **Features**: `auth`, `billing`, `canvas`, `course`, `quiz`, `admin`, `api`
- **Technical**: `cms`, `ui`, `migration`, `config`, `deps`, `tooling`
- **Infrastructure**: `ci`, `deploy`, `docker`, `security`

### Message Guidelines

- Use present tense: "add" not "added"
- Start with lowercase after colon
- 50-72 characters for description
- No period at the end
- Be descriptive of actual changes

### Pre-commit Hooks

The following hooks run automatically on every commit:
- **TruffleHog**: Secret scanning (blocks if secrets detected)
- **Biome**: Lints and formats code
- **Markdown linter**: Validates markdown files
- **Commitlint**: Validates commit message format

### Claude Code Commit Validation Hook

A pre-tool-use hook validates commit messages **before** they execute:
- **Location**: `.claude/hooks/validate-commit-message.sh`
- **Validates**: Format, type, scope, message quality
- **Provides**: Immediate feedback with helpful error messages
- **Blocks**: Invalid formats (wrong type, invalid scope, etc.)
- **Warns**: Quality issues (past tense, capitalization, etc.)

This ensures all commits from Claude Code follow the project convention.

### Using the `/commit` Command

```bash
/commit sdlc_implementor feat auth
/commit debug_engineer fix cms
/commit test_writer test e2e
```

This automatically generates properly formatted commits with agent traceability that pass all validation hooks.

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
- Add `import 'server-only';` to code that is exclusively server-side
- Never mix client and server imports from a file or a package
- Extract self-contained classes/utilities (ex. algortihmic code) from classes that cross the network boundary

## React

- Encapsulate repeated blocks of code into reusable local components
- Write small, composable, explicit, well-named components
- Always use `react-hook-form` and `@kit/ui/form` for writing forms
- Always use 'use client' directive for client components
- Add `data-testid` for E2E tests where appropriate
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
- Since `redirect` throws an error, handle `catch` block using `isRedirectError`
  from `next/dist/client/components/redirect-error` in client-side forms when
  calling the server action

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

```text
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

## UI Components

UI Components are placed at `packages/ui`. The library contains 45+ shadcn/ui components plus custom MakerKit and Aceternity components.

### Adding New Components

Use the shadcn CLI to add components:

```bash
# Add component from UI package
pnpm --filter @kit/ui ui:add button

# Search for components
pnpm --filter @kit/ui ui:search -q "form"

# Access community registries (@magicui, @aceternity, @shadcnblocks)
cd packages/ui && npx shadcn@latest add @magicui/animated-button
```

**Important**: After adding a component via CLI, update the exports in `packages/ui/package.json`.

For complete CLI documentation, see: `.ai/ai_docs/tool-docs/shadcn-cli.md`

## Conditional Documentation System

The project uses an intelligent conditional documentation routing system that automatically loads only the most relevant context documentation for each task, reducing token usage by 60-75% while maintaining high success rates.

### How It Works

**Three-Tier Architecture:**

1. **Command Profiles** (`.claude/config/command-profiles.yaml`) - Define documentation needs for each slash command
2. **Context Metadata** (YAML frontmatter in `.ai/ai_docs/context-docs/`) - Tags, dependencies, cross-references
3. **Dynamic Router** (`.claude/commands/conditional_docs.md`) - Smart routing engine that matches tasks to documentation

### Usage

The system is automatically invoked by slash commands (`/implement`, `/diagnose`, `/feature`, `/chore`, `/bug-plan`). You can also call it manually:

```bash
/conditional_docs [command] "[task description]"
```

**Examples:**
```bash
/conditional_docs implement "Add OAuth2 social login"
/conditional_docs diagnose "Database query timeout on projects page"
/conditional_docs feature "Real-time collaboration with presence indicators"
```

The router analyzes the task description, extracts keywords, matches them to relevant documentation, and returns 3-7 files that are most relevant.

### How Documentation Is Selected

1. **Keyword Matching** - Extract keywords from task (auth, database, ui, docker, etc.)
2. **Rule Matching** - Match keywords to conditional rules in command profiles
3. **Priority Scoring** - Score matches by priority (high=3, medium=2, low=1)
4. **Dependency Resolution** - Auto-load dependencies from YAML frontmatter
5. **Cross-Reference Following** - Load prerequisite and parent documents
6. **Result Limiting** - Return top 3-7 files by score

### Adding New Command Profiles

To add a new command profile, edit `.claude/config/command-profiles.yaml`:

```yaml
profiles:
  my_command:
    description: "Description of the command"
    defaults:
      - "development/architecture-overview.md"
    rules:
      - keywords: ["keyword1", "keyword2"]
        files:
          - "path/to/doc.md"
        priority: high|medium|low
    categories:
      category_name:
        - "path/to/category-doc.md"
```

**Priority Guidelines:**
- `high` - Critical documentation needed for this task type
- `medium` - Helpful but not essential
- `low` - Nice-to-have context

### Updating Routing Rules

To improve routing for a command:

1. Identify missing or incorrect documentation loads
2. Edit `.claude/config/command-profiles.yaml`
3. Add/remove keywords or adjust priorities
4. Test with sample tasks
5. Monitor token usage and success rates

### Performance Metrics

- **Token Reduction:** 60-75% compared to loading all documentation
- **Files Returned:** 3-7 files per task (sweet spot: 5)
- **Routing Time:** <500ms including file reads
- **Success Rate:** 100% task completion maintained

### Available Documentation

Documentation is organized in `.ai/ai_docs/context-docs/` with 29 files across 3 categories:

**Development (9 files):**
- `architecture-overview.md` - Essential architectural reference
- `database-patterns.md` - RLS, migrations, type-safety
- `server-actions.md` - API patterns, validation, mutations
- `react-query-patterns.md` - Data fetching, caching, SSR
- `react-query-advanced.md` - Infinite queries, real-time
- `shadcn-ui-components.md` - Component library guide
- `makerkit-integration.md` - Template integration patterns
- `prime-framework.md` - Command design framework

**Infrastructure (12 files):**
- `auth-overview.md` - Authentication system overview
- `auth-implementation.md` - Auth code patterns
- `auth-security.md` - Security model and best practices
- `auth-configuration.md` - Environment setup
- `auth-troubleshooting.md` - Common auth issues
- `docker-setup.md` - Container architecture
- `docker-troubleshooting.md` - Container diagnostics
- `vercel-deployment.md` - Deployment guide
- `database-seeding.md` - Seeding strategies
- `enhanced-logger.md` - Logging system
- `ci-cd-complete.md` - CI/CD pipeline
- `production-security.md` - Security best practices

**Testing & Quality (7 files):**
- `fundamentals.md` - Core testing principles
- `e2e-testing.md` - Playwright E2E patterns
- `integration-testing.md` - Integration test strategies
- `accessibility-testing.md` - A11y testing guide
- `performance-testing.md` - Performance metrics
- `vitest-configuration.md` - Vitest setup

Each file includes YAML frontmatter with tags, dependencies, and cross-references that the router uses for intelligent selection.

### Troubleshooting

**Too few files loaded:**
- Keywords may be too specific
- Add keyword variations to command profiles
- Check spelling and case sensitivity

**Too many files loaded:**
- Keywords too broad
- Increase priority thresholds
- Reduce `max_files` in routing config

**Wrong files loaded:**
- Review keyword list for overly broad terms
- Adjust priorities to favor correct rules
- Check YAML frontmatter dependencies

**Router errors:**
- Validate YAML syntax: `cat .claude/config/command-profiles.yaml`
- Check file paths exist in `.ai/ai_docs/context-docs/`
- Review conditional_docs.md for error messages

### Related Documentation

- **Command Profiles Schema:** `.claude/config/README.md`
- **Router Implementation:** `.claude/commands/conditional_docs.md`
- **Usage Examples:** `.ai/specs/examples/conditional-docs-usage-examples.md`
- **Context Documentation Index:** `.ai/ai_docs/context-docs/README.md`

## Delegate to Agents

Please use the Task tool to delegate suitable tasks to specialized sub-agents for best handling the task at hand.

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

### Payload CMS Operations

- `pnpm --filter payload cache:clear` - Clear Next.js/Turbopack build cache
- `pnpm --filter payload clean` - Full clean (cache + node_modules)
- `pnpm --filter payload devsafe` - Clear cache and start dev server

**When to clear Payload cache:**

- After modifying `payload.config.ts` (editor features, collections, globals)
- When seeing "parseEditorState: type 'block' not found" errors
- When Lexical editor fails to recognize configured block types
- After upgrading Payload CMS or its dependencies
- When config changes aren't reflected in the running server

**Cache clearing fixes common issues like:**

- Lexical editor block type errors
- Missing editor features despite correct configuration
- Stale configuration being served by Turbopack

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

### agent-browser (Visual Validation)

agent-browser is used in the Alpha workflow for visual validation of UI implementations.

- `agent-browser --version` - Check agent-browser version
- `agent-browser open <url>` - Navigate to URL
- `agent-browser wait <ms>` - Wait for specified milliseconds
- `agent-browser snapshot -i -c` - Capture accessibility tree snapshot
- `agent-browser screenshot <path>` - Capture screenshot to file
- `agent-browser is visible "<text>"` - Check if text is visible on page
- `agent-browser find role <role>` - Find element by ARIA role
- `agent-browser find label "<label>"` - Find element by label

**When to use:**

- Validating UI component renders correctly during Alpha workflow
- Quick visual verification without full E2E test suite
- Capturing screenshots for documentation
- Debugging accessibility issues

**Note:** agent-browser complements, not replaces, Playwright E2E tests.

## Code Quality & Testing

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

Reports are saved to `.ai/reports/` with four category-specific subdirectories:

```text
.ai/reports/
├── bug-reports/          # Diagnoses, bug plans, bug implementations
│   └── YYYY-MM-DD/       # Date-organized
├── feature-reports/      # Feature plans and implementations
│   └── YYYY-MM-DD/
├── chore-reports/        # Chore plans and implementations
│   └── YYYY-MM-DD/
├── research-reports/     # Research agent findings
│   └── YYYY-MM-DD/
└── _migrated/            # Legacy reports from old structure
```

**Filename Conventions**:

| Report Type | Command | Filename Pattern |
|-------------|---------|------------------|
| Bug diagnosis | `/diagnose` | `<issue#>-diagnosis-<slug>.md` |
| Bug fix plan | `/bug-plan` | `<issue#>-bug-plan-<slug>.md` |
| Bug implementation | `/implement` | `<issue#>-implementation-<slug>.md` |
| Feature plan | `/feature` | `<issue#>-feature-plan-<slug>.md` |
| Feature implementation | `/implement` | `<issue#>-implementation-<slug>.md` |
| Chore plan (basic) | `/chore` | `<issue#>-chore-plan-<slug>.md` |
| Chore plan (detailed) | `/chore-plan` | `<issue#>-chore-plan-<slug>.md` |
| Chore implementation | `/implement` | `<issue#>-implementation-<slug>.md` |
| Research (context7) | Agent | `context7-<description>.md` |
| Research (perplexity) | Agent | `perplexity-<description>.md` |
| Research (exa) | Agent | `exa-<description>.md` |
| Research (docs-mcp) | Agent | `docs-mcp-<description>.md` |

**Notes**:
- Reports use `pending-` prefix until GitHub issue is created, then renamed with issue number
- `<slug>` is a short kebab-case description (first few words of title)
- Date directories use `YYYY-MM-DD` format (e.g., `2025-11-27`)
- **Chore workflows**: Use `/chore` → `/implement` for simple tasks, or `/chore` → `/chore-plan` → `/implement` for complex tasks requiring detailed research

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

**Design Principle**: Each command does one thing well (Unix philosophy).
Consolidation would create unmaintainable 3000+ line mega-commands.

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

## Important Instruction Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create
documentation files if explicitly requested by the User.
