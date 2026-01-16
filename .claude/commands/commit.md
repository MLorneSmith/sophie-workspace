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
- 50-72 characters for subject line (first line)
- **Body lines must not exceed 100 characters** (commitlint enforces this)
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
- Body lines longer than 100 characters (wrap long lines)

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

2. **Analyze changes for logical groupings:**

   Before creating a single commit, analyze if changes should be split:

   ```bash
   # Get list of changed files
   git diff --name-only --cached
   git diff --name-only  # unstaged changes
   ```

   **Multi-commit detection logic:**
   - Categorize changes by area (auth, cms, ui, tests, docs, config, etc.)
   - If changes span **2+ distinct areas**, recommend splitting into separate commits
   - Group related changes together logically

   **Example groupings:**
   ```
   Group 1 (feat): New feature implementation
   - apps/web/app/home/[account]/projects/page.tsx
   - apps/web/app/home/[account]/projects/_lib/server/projects-page.loader.ts

   Group 2 (test): Tests for new feature
   - apps/web/app/home/[account]/projects/__tests__/projects.test.ts

   Group 3 (docs): Documentation updates
   - README.md
   - CLAUDE.md
   ```

   **When to split:**
   - ✅ Feature code + tests + docs → 3 separate commits
   - ✅ Multiple unrelated bug fixes → separate commits
   - ✅ Refactoring + new feature → separate commits
   - ✅ Config changes + code changes → separate commits (unless config needed for feature)

   **When to keep together:**
   - ❌ Single feature across multiple files
   - ❌ Bug fix with its test
   - ❌ Tightly coupled changes (config required for feature to work)

   If multiple logical groups detected, **inform the user** with recommendations:
   ```
   📋 Multiple logical changes detected:
     1. Feature implementation (3 files in apps/web/app/.../projects/)
     2. Test coverage (1 file in __tests__)
     3. Documentation (2 .md files)

   Recommendation: Split into 3 commits:
     1. feat(projects): add project listing page
     2. test(projects): add project listing tests
     3. docs(projects): update README with project features

   Proceed with split commits? (y/n)
   ```

3. **Infer scope from changed files** (if not provided):
   - Changes in `apps/web/app/*/auth/*` → scope: `auth`
   - Changes in `apps/payload/*` → scope: `payload` or `cms`
   - Changes in `packages/ui/*` → scope: `ui`
   - Changes in `*.test.ts` or `*.spec.ts` → type: `test`
   - Changes in `.github/workflows/*` → scope: `ci`
   - Changes in `*.md` → type: `docs`
   - Multiple areas → use most significant or omit scope

4. **Generate commit message(s):**
   Format: `<type>(<scope>): <description> [agent: <agent_name>]`

   - Type: Must be from valid list above
   - Scope: From valid list or inferred from files (can be omitted if unclear)
   - Description: Clear, concise, present tense, lowercase start
   - Agent: Use provided agent_name or 'agent' as default

5. **Stage and commit:**

   **For single commit:**
   ```bash
   git add -A
   git commit -m "<generated_commit_message>"
   ```

   **For multiple commits (if user confirms split):**
   ```bash
   # Commit Group 1: Feature implementation
   git add apps/web/app/home/[account]/projects/page.tsx \
           apps/web/app/home/[account]/projects/_lib/server/projects-page.loader.ts
   git commit -m "feat(projects): add project listing page [agent: <agent_name>]"

   # Commit Group 2: Tests
   git add apps/web/app/home/[account]/projects/__tests__/projects.test.ts
   git commit -m "test(projects): add project listing tests [agent: <agent_name>]"

   # Commit Group 3: Documentation
   git add README.md CLAUDE.md
   git commit -m "docs(projects): update README with project features [agent: <agent_name>]"
   ```

   **Note:** Pre-commit hooks will run automatically for each commit. If they fail:
   - TruffleHog: Remove secrets/credentials from code
   - Biome: Formatting auto-fixed, but lint errors need manual fixes
   - Markdown: Fix markdown syntax issues
   - Commitlint: Ensure format matches specification

6. **Verify success:**
   ```bash
   git log --oneline -5  # Show recent commits (may be multiple if split)
   ```

## Report

Return a brief summary:

**For single commit:**
```
✅ Committed as: <commit-hash> <commit-message>
```

**For multiple commits:**
```
✅ Created 3 commits:
  1. abc1234 feat(projects): add project listing page [agent: sdlc_implementor]
  2. def5678 test(projects): add project listing tests [agent: sdlc_implementor]
  3. ghi9012 docs(projects): update README with project features [agent: sdlc_implementor]
```

If commit failed, explain the error and suggest fixes:
- **TruffleHog blocked**: Remove hardcoded secrets, use environment variables
- **Commitlint failed**: Check type/scope are valid, verify format
- **body-max-line-length**: Wrap body lines to stay under 100 characters
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
