# CLAUDE.md

This file provides core guidance to Claude when working with code in this repository.

## Identity and Interaction

- You are an experienced, pragmatic software engineer who avoids over-engineering
- We are coworkers on the same team - your success is my success
- Use a friendly, professional tone with occasional humor when appropriate
- Push back with evidence when you believe a different approach would be better
- Admit when you don't know something rather than guessing

## Project Critical Constraints

1. **Never expose API keys** - Use server actions for AI/external APIs
2. **Always validate input** - Use Zod schemas everywhere
3. **Prefer Server Components** - Client components only when needed
4. **Use proper typing** - No `any` types, define all interfaces
5. **Follow RLS patterns** - Never bypass security policies
6. **Use enhanceAction** - For all server actions
7. **Implement proper error handling** - User-friendly messages

## Secrets and Authentication

- Use `GITHUB_TOKEN` for authenticated GitHub API requests, always stored securely in environment variables
- NEVER hardcode tokens or expose them in code
- Use server-side actions to handle token-based requests
- Rotate tokens periodically for security

## Testing and Development Commands

### Pre-approved Commands

The following commands can be executed without user approval during testing and development:

#### Git Commands

- `git rev-parse --show-toplevel` - Get repository root
- `git status --porcelain` - Check working directory status  
- `git log --oneline -10` - View recent commits
- `git diff --name-only` - Show changed files
- `git branch --show-current` - Show current branch

#### Environment Setup

- `export PROJECT_ROOT=$(git rev-parse --show-toplevel)` - Set project root variable
- `export GIT_ROOT=$(git rev-parse --show-toplevel)` - Set git root variable
- `cp ${PROJECT_ROOT}/apps/web/.env.example ${PROJECT_ROOT}/apps/web/.env.test` - Copy environment file
- `cp apps/web/.env.example apps/web/.env.test` - Copy environment file (relative path)

#### Test Commands

- `pnpm --filter web-e2e test:shard*` - Run E2E test shards
- `pnpm --filter web test:*` - Run web package tests
- `pnpm test:unit` - Run unit tests
- `pnpm test:e2e` - Run E2E tests
- `pnpm test:shard*` - Run test shards

#### Development Server Commands

- `pnpm --filter web dev:test` - Start development server for testing
- `pnpm dev` - Start development server
- `npx supabase status` - Check Supabase status
- `npx supabase start` - Start Supabase
- `npx supabase stop` - Stop Supabase

#### Process Management

- `pkill -f "playwright|vitest|next-server"` - Kill test processes
- `lsof -ti:3000-3020` - Find processes on test ports
- `ps aux | grep -E "(playwright|vitest)"` - List test processes

#### File Operations for Testing

- `mkdir -p /tmp` - Create temp directory
- `echo "*" > /tmp/*` - Write to temp files for test status
- `cat /tmp/.claude_test_*` - Read test status files
- `touch /tmp/.claude_test_*` - Create test status files

## Commands and Scripts

### Test Execution

- Use `/test` command for comprehensive testing
- Use `/test --debug` for verbose output  
- Use `/test --unit` for unit tests only
- Use `/test --e2e` for E2E tests only

### Development Workflow

- Always run `pnpm lint` and `pnpm typecheck` before committing
- Use server actions for external API calls
- Follow existing code patterns and conventions

## Testing Philosophy

**When tests fail, fix the code, not the test.**

Key principles:
- **Tests should be meaningful** - Avoid tests that always pass regardless of behavior
- **Test actual functionality** - Call the functions being tested, don't just check side effects
- **Failing tests are valuable** - They reveal bugs or missing features
- **Fix the root cause** - When a test fails, fix the underlying issue, don't hide the test
- **Test edge cases** - Tests that reveal limitations help improve the code
- **Document test purpose** - Each test should include a comment explaining why it exists

## Directory Structure & File Organization

### Reports Directory
ALL project reports and documentation should be saved to the `/reports/` directory:

**Naming Convention**: `[TYPE]_[SCOPE]_[DATE].md`

**Report Types**:
- Implementation reports: `FEATURE_[NAME]_REPORT.md`
- Test results: `TEST_RESULTS_[DATE].md`  
- Performance analysis: `PERFORMANCE_ANALYSIS_[SCENARIO].md`
- Security scans: `SECURITY_SCAN_[DATE].md`
- Code quality: `CODE_QUALITY_REPORT.md`
- API documentation: `API_COMPATIBILITY_REPORT.md`

**Guidelines**:
- Always save reports to `/reports/`, never leave them in root
- Include dates in `YYYY-MM-DD` format for time-sensitive reports
- Use clear prefixes: `TEST_`, `PERFORMANCE_`, `SECURITY_`, `FEATURE_`

### Temporary Files & Debugging
All temporary files, debugging scripts, and test artifacts should be organized in a `/temp` folder:

**Temporary File Organization**:
- Debug scripts: `temp/debug-*.js`, `temp/analyze-*.py`
- Test artifacts: `temp/test-results/`, `temp/coverage/`
- Generated files: `temp/generated/`, `temp/build-artifacts/`
- Logs: `temp/logs/debug.log`, `temp/logs/error.log`

**Guidelines**:
- Never commit files from `/temp` directory
- Use `/temp` for all debugging and analysis scripts created during development
- Clean up `/temp` directory regularly or use automated cleanup
- `/temp/` should already be in `.gitignore`

## Agent Delegation & Parallel Execution

### Always Delegate to Specialists
**When specialized agents are available, you MUST use them instead of attempting tasks yourself.**

Available specialized agents in `.claude/agents/`:
- **typescript/** - TypeScript specialists (3 agents)
- **testing/** - Testing experts for Jest, Vitest, general (3 agents)
- **database/** - PostgreSQL, MongoDB, general database experts (3 agents)
- **react/** - React performance and general specialists (2 agents)
- **frontend/** - Accessibility and CSS experts (2 agents)
- **infrastructure/** - Docker and GitHub Actions specialists (2 agents)
- **build-tools/** - Webpack and Vite experts (2 agents)
- Plus: code-quality, devops, documentation, e2e, framework, git, nodejs, refactoring agents

### Why Agent Delegation Matters:
- Specialists have deeper, more focused knowledge
- They're aware of edge cases and subtle bugs
- They follow established patterns and best practices
- They provide more comprehensive solutions

### Parallel Tool Execution
**CRITICAL: Send all tool calls in a single message to execute them in parallel for optimal performance.**

**Always use parallel execution for**:
- Multiple file searches or reads
- Different grep patterns
- Multiple agent delegations
- Any independent operations

**Only use sequential when**: You genuinely REQUIRE the output of one tool to determine the usage of the next.

**Performance Impact**: Parallel execution is 3-5x faster than sequential calls.

## Key Development Patterns (from AGENTS.md)

### Performance Optimization - Parallel Data Fetching
When fetching multiple data sources, always use parallel patterns:

```typescript
// ✅ GOOD - Parallel fetching (60-80% faster)
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
]);

// ❌ BAD - Sequential fetching
const users = await fetchUsers();
const posts = await fetchPosts();  
const comments = await fetchComments();
```

### Server Actions Implementation
Always use `enhanceAction` from @packages/next/src/actions/index.ts for all server actions.

### Error Handling & Logging
Use structured logging with proper context:

```typescript
import { getLogger } from '@kit/shared/logger';

async function myServerAction() {
  const logger = await getLogger();
  const ctx = { name: 'myOperation', userId: user.id };
  
  try {
    // operation
    logger.info(ctx, 'Operation successful');
  } catch (error) {
    logger.error(ctx, 'Operation failed', { error });
    throw error;
  }
}
```

## Database Security Reminders

### Critical Security Guidelines
- **Always enable RLS** on new tables unless explicitly instructed otherwise
- **NEVER use SECURITY DEFINER functions** without explicit access controls
- **Always use security_invoker=true for views** to maintain proper access control
- **Use existing helper functions** - Don't recreate: `has_role_on_account()`, `is_account_owner()`, etc.

## Code Quality Standards

### TypeScript
- **No `any` types** - Always define proper interfaces
- Use strict TypeScript configuration
- Prefer type inference where appropriate

### Component Organization
- Route-specific components: Use `_components/` directories
- Route utilities: Use `_lib/` for client, `_lib/server/` for server-side
- Global components: Root-level directories

### Validation
- **Always validate input** - Use Zod schemas everywhere
- Validate at boundaries (API routes, server actions)
