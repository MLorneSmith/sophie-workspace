---
description: Debug and fine-tune existing code after review or when issues are found. Interviews for context, explores codebase, diagnoses, fixes, and verifies
argument-hint: [--issue "description"] [--scope path/to/area] [--gh #123]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion, Skill, WebFetch]
---

# Refinement Command

Debug and fine-tune existing code when issues are found during review, testing, or usage. Unlike `/alpha:refine`, this command works on any branch without requiring an Alpha spec context.

**Arguments:**
- `--issue "description"` - Optional. Description of the issue to fix
- `--scope path/to/area` - Optional. Narrow exploration to a specific directory or feature area
- `--gh #123` - Optional. Pull context from a GitHub issue instead of interviewing

## Phase 0: Context Gathering

**Goal**: Understand exactly what needs to be refined before touching any code.

### Step 1: Parse arguments

```typescript
const args = '$ARGUMENTS';
let issueDescription = '';
let scopePath = '';
let ghIssueNumber = '';

// Parse --issue "description"
const issueMatch = args.match(/--issue\s+"([^"]+)"/);
if (issueMatch) issueDescription = issueMatch[1];

// Parse --scope path
const scopeMatch = args.match(/--scope\s+(\S+)/);
if (scopeMatch) scopePath = scopeMatch[1];

// Parse --gh #123 or --gh 123
const ghMatch = args.match(/--gh\s+#?(\d+)/);
if (ghMatch) ghIssueNumber = ghMatch[1];
```

### Step 2: Gather context (GitHub OR interview)

**If `--gh` was provided**, fetch the issue from GitHub:
```bash
gh issue view <issue-number> \
  --repo slideheroes/2025slideheroes \
  --json body,title,labels,number,comments \
  --jq '{body: .body, title: .title, labels: [.labels[].name], number: .number, comments: [.comments[] | {author: .author.login, body: .body, createdAt: .createdAt}]}'
```

Extract from the issue:
- **Issue description** from the body
- **Issue type** from labels (bug, feature, etc.)
- **Scope** from file paths or areas mentioned in the body
- **Reproduction steps** if documented
- Skip to Step 3 (no interview needed).

**If no `--gh`**, run a structured interview using AskUserQuestion:

**Question 1 - What's the problem?**
```
question: "What issue are you seeing that needs refinement?"
header: "Issue type"
options:
  - label: "Visual/UI bug"
    description: "Something doesn't look right - layout, styling, rendering"
  - label: "Functional issue"
    description: "Something doesn't work as expected - logic, data, behavior"
  - label: "Performance problem"
    description: "Page is slow, laggy, or unresponsive"
  - label: "Code quality"
    description: "Code works but needs improvement - patterns, structure, readability"
```

**Question 2 - Is this a regression?**
```
question: "Did this previously work correctly?"
header: "Regression?"
options:
  - label: "Yes, it's a regression"
    description: "This worked before and something broke it"
  - label: "No, it's a new issue"
    description: "This has always been broken or was never implemented correctly"
  - label: "Not sure"
    description: "I don't know if it worked before"
```

**Question 3 - Where is the issue?**
If `--scope` was not provided:
```
question: "Which area of the codebase is affected?"
header: "Scope"
options:
  - label: "Specific page/route"
    description: "I can tell you the URL or route path"
  - label: "Specific component"
    description: "I know which component or file is involved"
  - label: "Broad area"
    description: "It affects a feature area but I'm not sure exactly where"
  - label: "Not sure"
    description: "I need help figuring out where the issue lives"
```

**Question 4 - What have you tried?**
```
question: "Have you already tried anything to fix or investigate this?"
header: "Prior work"
options:
  - label: "Yes, I have details"
    description: "I've investigated or attempted fixes I can share"
  - label: "Just noticed it"
    description: "I haven't looked into it yet"
  - label: "Someone else reported it"
    description: "I'm relaying a report from a user or teammate"
```

Follow up based on answers to pin down:
- The **exact symptoms** (what happens vs what should happen)
- The **affected area** (route, component, or feature)
- Any **reproduction steps** (what triggers the issue)
- The **expected behavior** (what "fixed" looks like)
- Any **prior investigation** (what's already been tried or ruled out)

### Step 3: Load conditional documentation

Use the conditional documentation system to load relevant context for the affected area:

```
Invoke Skill: conditional_docs
  args: refine "[issue description and scope keywords]"
```

Read each of the suggested documentation files returned by the router. This provides awareness of relevant patterns (database, auth, server actions, etc.) without loading everything.

### Step 4: Record context summary

Compile all gathered context into a structured summary:

```
=== Refinement Context ===
Issue: [description]
Type: [visual|functional|performance|code-quality]
Regression: [yes|no|unknown]
Scope: [path or area]
Symptoms: [what's happening]
Expected: [what should happen]
Prior investigation: [what's been tried]
GitHub issue: [#number or N/A]
Conditional docs loaded: [list of loaded context files]
```

## Phase 1: Codebase Exploration

**Goal**: Build deep understanding of the relevant code before attempting any fix.

### Step 1: Git history analysis

Check what recently changed in the affected area. This is especially valuable for regressions:

```bash
# Recent commits touching the affected area
git log --oneline -20 -- [scope path or relevant directory]

# If regression: show what changed recently
git log --oneline --since="2 weeks ago" -- [scope path]

# Diff of recent changes in the area
git diff HEAD~10 -- [scope path] | head -200
```

Review the git history for:
- **Recent changes** that could have introduced the issue
- **Authors** who might have context
- **Related commits** that touched the same files
- If this is a confirmed regression, identify the **likely culprit commit**

### Step 2: Delegate to code-explorer agent

Use the Task tool to spawn the code-explorer agent with a focused exploration prompt:

```
Task tool:
  subagent_type: "code-explorer"
  description: "Explore code for refinement"
  prompt: |
    I need to understand the following area of the codebase to fix an issue:

    **Issue**: [issue description from interview]
    **Area**: [scope path or area identified in interview]
    **Symptoms**: [what's going wrong]
    **Expected behavior**: [what should happen]

    Please explore this area and provide:
    1. The key files involved (entry points, components, utilities)
    2. The data flow through this feature (props, state, server actions, loaders)
    3. Related patterns and conventions in use
    4. Any obvious issues or code smells you spot
    5. Dependencies (internal modules and external packages)
    6. Existing test files for this area

    Focus on: [scope path if provided, otherwise the feature area]
```

### Step 3: Review exploration results

Read the code-explorer output and identify:
- **Entry points** to trace from
- **Key files** that will likely need changes
- **Patterns** to follow when making fixes
- **Dependencies** to be aware of
- **Test files** that exist for this area

### Step 4: Targeted deep reading

Based on the exploration results, read the specific files most likely involved in the issue. Use the Read tool to examine:
- The primary component/route where the issue manifests
- Server actions or loaders feeding data to it
- Shared utilities or hooks it depends on
- Related test files (if they exist)

## Phase 2: Baseline & Diagnosis

**Goal**: Establish a test baseline, then identify the root cause with certainty.

### Step 1: Run baseline tests

Before making any changes, run existing tests in the affected area to establish what currently passes and fails:

```bash
# Run tests scoped to the affected area (if test files were found)
pnpm --filter [package] test:unit -- --grep "[relevant pattern]"

# Or run specific test file
pnpm --filter [package] test:unit -- [path/to/test-file]

# Also run typecheck as baseline
pnpm --filter web typecheck
```

Record the baseline:
- **Tests passing**: [count and names]
- **Tests failing**: [count and names - these may reveal existing issues]
- **Typecheck**: [pass/fail with error count]

### Step 2: Issue Type Detection & Skill Invocation

Based on the issue type identified in Phase 0, invoke the appropriate skill:

| Issue Keywords | Type | Skill to Invoke |
|---------------|------|-----------------|
| "rendering", "layout", "CSS", "doesn't show", "hidden" | Visual | frontend-debugging |
| "design", "colors", "spacing", "responsive", "mobile" | Design | frontend-design |
| "component", "React", "state", "props", "hook" | React | vercel-react-best-practices |
| "slow", "loading", "timeout", "performance" | Performance | frontend-debugging |
| "doesn't work", "broken", "error", "bug" | Functional | (no skill, trace code) |
| "pattern", "structure", "refactor", "quality" | Code quality | (no skill, trace code) |

### For Visual/UI issues

Invoke Skill: `frontend-debugging`

If the issue involves visual rendering, also use agent-browser:
```bash
# Start dev server if not running
pnpm dev &
sleep 10

# Open the affected page
agent-browser open http://localhost:3000/[route]
agent-browser wait 3000
agent-browser snapshot -i -c
agent-browser screenshot .ai/reports/refine-before.png
```

### For functional / code quality issues

Trace the code path manually:
1. **Identify entry point** from Phase 1 exploration
2. **Follow data flow** from server to client (or vice versa)
3. **Check error handling** at each boundary
4. **Verify types** match between layers
5. **Compare against project patterns** from CLAUDE.md
6. **Cross-reference git history** from Phase 1 Step 1 if this is a regression

### Diagnosis summary

Before proceeding to fix, summarize:
- **Root cause**: The exact reason for the issue
- **Affected files**: Which files need to change
- **Fix approach**: What changes will resolve it
- **Risk assessment**: Could this fix break anything else?
- **Regression source**: If applicable, the commit that introduced the issue

Present this summary to the user and get confirmation before proceeding.

## Phase 3: Fix Implementation

After diagnosis is confirmed:

1. **Create TodoWrite tasks** for the fix:
   - Break down the fix into atomic steps
   - Mark each step as you complete it

2. **Edit files** to implement the fix:
   - Follow existing code patterns identified in Phase 1
   - Keep changes minimal and focused
   - Only change what's necessary to fix the issue

3. **Test the fix locally** (if visual):
   ```bash
   agent-browser open http://localhost:3000/[route]
   agent-browser wait 3000
   agent-browser screenshot .ai/reports/refine-after.png
   agent-browser is visible "Expected Element"
   ```

## Phase 4: Verification

### Step 1: Standard checks

```bash
# Always run typecheck
pnpm --filter web typecheck

# Always run lint
pnpm lint

# Format
pnpm format:fix
```

### Step 2: Test verification

Re-run the baseline tests to confirm:
- All previously passing tests still pass (no regressions introduced)
- Any previously failing tests related to the issue now pass

```bash
# Re-run the same tests from baseline
pnpm --filter [package] test:unit -- --grep "[relevant pattern]"

# Compare results against baseline
```

If the affected area has no tests, note this in the report as a recommendation.

### Step 3: Handle failures

If verification fails:
1. Review error messages
2. Fix type or lint errors
3. Ensure the fix is complete
4. Retry verification
5. If new test failures appear, investigate whether the fix needs adjustment

## Phase 5: Commit & Report

### Step 1: Commit changes

After verification passes, use the `/commit` skill:

```
Invoke Skill: commit
  args: "sdlc_implementor fix [scope]"
```

The commit message should reflect the actual change made.

### Step 2: Update GitHub issue (if applicable)

If a `--gh` issue was provided, add a completion comment:
```bash
gh issue comment <issue-number> \
  --repo slideheroes/2025slideheroes \
  --body "## Refinement Complete

**Root cause**: [brief root cause]
**Fix**: [brief description of changes]
**Files modified**: [list of files]
**Verification**: typecheck ✓, lint ✓, tests ✓

Commit: [commit hash]"
```

### Step 3: Save refinement report

Save a structured report to `.ai/reports/`:

Determine report directory based on issue type:
- Bug fix → `.ai/reports/bug-reports/YYYY-MM-DD/`
- Feature refinement → `.ai/reports/feature-reports/YYYY-MM-DD/`
- Code quality → `.ai/reports/chore-reports/YYYY-MM-DD/`

**Filename**: `<issue#|pending>-refine-<slug>.md` (use `pending-` prefix if no GitHub issue)

**Report template**:
```markdown
# Refinement Report: [brief title]

**Date**: YYYY-MM-DD
**GitHub Issue**: #[number] or N/A
**Branch**: [current branch]
**Issue Type**: [visual|functional|performance|code-quality]
**Regression**: [yes|no|unknown]

## Issue Description
[What was reported / gathered from interview]

## Root Cause
[Detailed explanation of why the issue occurred]

## Regression Source
[If applicable: commit hash, author, and what change introduced the issue]

## Changes Made
| File | Change |
|------|--------|
| `path/to/file.ts` | [Brief description] |

## Verification Results
- Typecheck: [pass/fail]
- Lint: [pass/fail]
- Tests baseline: [X passing, Y failing before fix]
- Tests after fix: [X passing, Y failing after fix]
- Visual verification: [pass/fail/N/A]

## Conditional Docs Used
[List of context docs that were loaded]

## Follow-up Recommendations
- [Any additional improvements noticed but not addressed]
- [Missing test coverage to add]
- [Related areas that might have similar issues]
```

### Step 4: Output summary to user

Output a concise summary:
- Issue that was fixed
- Root cause identified
- Changes made (files modified)
- Verification results
- Report file location
- Any follow-up recommendations

## Error Handling

### Exploration finds nothing relevant
If the code-explorer can't locate the relevant area:
1. Ask the user for more specific pointers (file names, URLs, error messages)
2. Try broader search terms
3. Check for recently modified files that might be related

### Diagnosis is inconclusive
If you cannot identify the root cause:
1. Gather more context with console logs or debug output
2. Check browser dev tools via agent-browser
3. Ask user for reproduction steps
4. Look at recent git changes in the area: `git log --oneline -20 -- [path]`
5. If the issue is complex, suggest running `/diagnose` for a formal root cause analysis

### Fix doesn't resolve the issue
If your fix doesn't work:
1. Revert the change
2. Re-diagnose with more context
3. Try alternative approach
4. If blocked, report what you've found and what's still unclear

## Example Session

```
=== Refinement ===

[Phase 0: Context Gathering]
User reports: "The project cards on the dashboard don't show the updated
timestamp after editing"

Interview results:
- Issue type: Functional
- Regression: Yes, it worked last week
- Area: Dashboard project cards
- Symptoms: Timestamp stays stale after editing a project
- Expected: Timestamp updates to reflect last edit
- Prior investigation: None

Loaded conditional docs:
- react-query-patterns.md
- server-actions.md

[Phase 1: Codebase Exploration]
Git history (last 2 weeks):
  abc1234 refactor(web): extract project card to shared component
  def5678 feat(web): add batch editing to projects
  * ghi9012 fix(web): optimize project query with select()  ← suspect

Spawning code-explorer agent...

Key findings:
- Entry: apps/web/app/home/[account]/projects/page.tsx
- Loader: _lib/server/projects-page.loader.ts
- Component: _components/project-card.tsx
- Server action: _lib/server/projects-server-actions.ts
- Pattern: Uses React Query for caching
- Tests: _lib/__tests__/projects.test.ts (3 tests, all passing)

[Phase 2: Baseline & Diagnosis]
Baseline tests: 3 passing, 0 failing
Typecheck: passing

Root cause: Commit ghi9012 added .select('id, name, status') to the
project query, omitting the updated_at column. The project card
component tries to render updated_at but receives undefined.

[Phase 3: Fix Implementation]
- Added 'updated_at' to the .select() call in projects-page.loader.ts

[Phase 4: Verification]
✓ pnpm --filter web typecheck passed
✓ pnpm lint passed
✓ Tests: 3 passing (no regressions)

[Phase 5: Commit & Report]
✓ Committed: fix(web): include updated_at in project query select
✓ Report saved: .ai/reports/bug-reports/2026-02-19/pending-refine-project-timestamp.md
=== Refinement Complete ===
```

## Arguments

$ARGUMENTS
