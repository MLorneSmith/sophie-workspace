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
