---
description: Create a git commit following Conventional Commits with agent traceability. Format is type(scope): message [agent: name]. Automatically stages changes and validates against commitlint
argument-hint: [agent-name] [type] [scope]
model: haiku
allowed-tools: [Bash(git add:*), Bash(git commit:*), Bash(git diff:*), Bash(git status:*), Bash(git log:*), Read, Grep]
---

# Generate Git Commit

Create a properly formatted git commit following Conventional Commits with agent traceability.

## Variables

agent_name: $1 (optional - defaults to 'agent')
issue_class: $2 (optional - defaults to inferred from changes)
scope: $3 (optional - defaults to inferred from files)

## Format

**Hybrid Format:** `type(scope): message [agent: name]`

This format:
- ✅ Maintains Conventional Commits compatibility
- ✅ Works with changelog generators and semantic-release tools
- ✅ Adds agent traceability for AI-driven workflows
- ✅ Passes commitlint validation automatically

## Instructions

### 1. Understand Commit Convention

**Valid Types:**
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

**Valid Scopes:**
- Apps: `web`, `payload`, `e2e`, `dev-tool`
- Features: `auth`, `billing`, `canvas`, `course`, `quiz`, `admin`, `api`
- Technical: `cms`, `ui`, `migration`, `config`, `deps`, `tooling`
- Infrastructure: `ci`, `deploy`, `docker`, `security`

### 2. Map Issue Class to Type

- `bug` or `fix` → `fix`
- `feature` or `feat` → `feat`
- `chore` → `chore`
- `docs` → `docs`
- `refactor` → `refactor`
- `test` → `test`
- `perf` → `perf`
- `build` → `build`
- `ci` → `ci`

### 3. Message Guidelines

**Good messages:**
- Present tense: "add", "fix", "update" (not "added", "fixed", "updated")
- 50-72 characters for description
- Start with lowercase after colon
- Descriptive of actual changes
- No period at the end

**Examples:**
```
feat(auth): add OAuth2 social login support [agent: sdlc_implementor]
fix(cms): resolve quiz relationship serialization bug [agent: debug_engineer]
chore(deps): update Next.js to v16.2 [agent: sdlc_planner]
test(e2e): add payment flow integration tests [agent: test_writer]
refactor(ui): extract modal components for reusability [agent: ui_engineer]
```

**Avoid:**
- Generic messages: "fix stuff", "updates", "wip"
- Past tense: "added", "fixed", "updated"
- Too verbose or too short

### 4. Pre-commit Hooks Awareness

The following hooks will run automatically and may block your commit:
- **TruffleHog**: Scans for secrets/credentials (blocks if found)
- **Biome**: Lints and formats TypeScript/JavaScript files
- **Markdown linter**: Checks .md files
- **Commitlint**: Validates commit message format

If commit fails, read the error output and fix the reported issues.

## Run

1. **Review changes and recent commit style:**
   ```bash
   git status --short
   git diff --stat HEAD
   git log --oneline -5
   ```

2. **Infer scope from changed files** (if not provided):
   - Changes in `apps/web/app/*/auth/*` → scope: `auth`
   - Changes in `apps/payload/*` → scope: `payload` or `cms`
   - Changes in `packages/ui/*` → scope: `ui`
   - Changes in `*.test.ts` or `*.spec.ts` → type: `test`
   - Changes in `.github/workflows/*` → scope: `ci`
   - Changes in `*.md` → type: `docs`
   - Multiple areas → use most significant or omit scope

3. **Generate commit message:**
   Format: `<type>(<scope>): <description> [agent: <agent_name>]`

   - Type: Must be from valid list above
   - Scope: From valid list or inferred from files (can be omitted if unclear)
   - Description: Clear, concise, present tense, lowercase start
   - Agent: Use provided agent_name or 'agent' as default

4. **Stage and commit:**
   ```bash
   git add -A
   git commit -m "<generated_commit_message>"
   ```

   **Note:** Pre-commit hooks will run automatically. If they fail:
   - TruffleHog: Remove secrets/credentials from code
   - Biome: Formatting auto-fixed, but lint errors need manual fixes
   - Markdown: Fix markdown syntax issues
   - Commitlint: Ensure format matches specification

5. **Verify success:**
   ```bash
   git log --oneline -1
   ```

## Report

Return a brief summary:
```
✅ Committed as: <commit-hash> <commit-message>
```

If commit failed, explain the error and suggest fixes:
- **TruffleHog blocked**: Remove hardcoded secrets, use environment variables
- **Commitlint failed**: Check type/scope are valid, verify format
- **Biome failed**: Review specific lint rule violations
- **Other error**: Include error message and suggest next steps

## Quick Reference

**Format Pattern:**
```
type(scope): description [agent: name]
│    │       │            │      │
│    │       │            │      └─ Agent name (snake_case)
│    │       │            └──────── Agent metadata section
│    │       └───────────────────── Present tense, lowercase, no period
│    └───────────────────────────── Optional, from valid list
└────────────────────────────────── Required, from valid list
```

**Example Variables:**
- `$1 = "sdlc_implementor"` → agent: sdlc_implementor
- `$2 = "feat"` → type: feat
- `$3 = "auth"` → scope: auth
