---
description: Sandbox-optimized implementation that executes plans with research manifest context and outputs structured data for /initiative orchestrator
argument-hint: [issue-number] --manifest [path]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite]
---

# Initiative Implementation

Sandbox-optimized version of `/implement` that integrates with the `/initiative` orchestrator workflow. Executes plans with research manifest context and outputs structured data for orchestration.

## Key Differences from /implement

| Aspect | /implement | /initiative-implement |
|--------|------------|----------------------|
| Context | Loads conditional docs | Uses research manifest |
| Input | Issue number | Issue number + manifest path |
| Output | Human-readable report | Structured JSON + report |
| Environment | Local or standalone | Part of /initiative workflow |
| Research | None | References manifest patterns |

## Instructions

IMPORTANT: This command is called by `/initiative` orchestrator within E2B sandbox.
IMPORTANT: Reference the research manifest for implementation guidance.
IMPORTANT: Output must be structured for orchestrator consumption.

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Issue number**: The GitHub issue number for this feature
- **Manifest path**: Path to research manifest (look for `--manifest` flag)

```typescript
// Expected format:
// $ARGUMENTS = "124 --manifest .ai/research/local-first-rxdb/manifest.md"

const args = "$ARGUMENTS";
const manifestMatch = args.match(/--manifest\s+(\S+)/);
const manifestPath = manifestMatch ? manifestMatch[1] : null;
const issueNumber = args.replace(/--manifest\s+\S+/, '').trim();
```

### Step 2: Fetch Implementation Plan

Load the detailed plan from GitHub:

```bash
gh issue view <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --json body,title,labels,url,comments \
  --jq '{body: .body, title: .title, labels: [.labels[].name], url: .url}'
```

Extract:
- Plan title and full plan content
- Step by Step Tasks
- Validation Commands
- Research references in plan

### Step 3: Load Research Manifest (Reference)

**P1 Fix**: Manifest can be a local file path OR a GitHub issue reference.

```typescript
// Check if manifest is a GitHub issue reference
if (manifestPath && manifestPath.startsWith('github:issue:')) {
  // Extract issue number and fetch from GitHub
  const issueNumber = manifestPath.replace('github:issue:', '');
  // Fetch manifest from GitHub issue
}
```

**If manifest is GitHub issue reference (`github:issue:<number>`):**

```bash
# Fetch manifest content from GitHub issue (works in E2B sandbox)
gh issue view <manifest-issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --json body \
  -q .body
```

**If manifest is local file path:**

```bash
cat <manifest-path>
```

Use manifest for:
- Code patterns to follow
- Gotchas to avoid
- Implementation approach validation

### Step 4: Mark Implementation Started

```bash
# Update issue status
gh issue edit <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --add-label "status:in-progress" \
  --remove-label "status:planned"

# Add start comment
gh issue comment <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --body "🔄 Implementation started in E2B sandbox..."
```

### Step 5: Create Implementation Todos

Extract tasks from plan and create todo list:

```typescript
// For each task in "Step by Step Tasks":
TodoWrite([
  { content: "Task 1: <name>", status: "pending", activeForm: "Implementing <name>" },
  { content: "Task 2: <name>", status: "pending", activeForm: "Implementing <name>" },
  // ... all tasks
  { content: "Run validation commands", status: "pending", activeForm: "Running validations" }
]);
```

### Step 5.5: Load Relevant Skills (If Recommended)

Check the manifest's "Recommended Skills" section. If skills are suggested for this feature type:

```typescript
// Load skills before implementation
if (manifest.skills.includes('frontend-design')) {
  Skill({ skill: 'frontend-design' });
}

if (manifest.skills.includes('webapp-testing')) {
  Skill({ skill: 'webapp-testing' });
}
```

**Skill-Feature Mapping:**
| Feature Involves | Load Skill |
|------------------|------------|
| UI components, dashboard | `frontend-design` |
| Frontend debugging | `webapp-testing` |
| PDF generation | `pdf` |
| Spreadsheet export | `xlsx` |
| Offline-first data | `local-first-db` |

### Step 5.6: Additional Research During Implementation

When encountering unknowns NOT covered by the manifest:

**Context7 CLI** - For library documentation:
```bash
# Search for libraries
.ai/bin/context7-search "library-name"

# Get documentation for specific topic
.ai/bin/context7-get-context <owner> <repo> --topic <topic> --tokens 3000

# Examples:
.ai/bin/context7-get-context vercel next.js --topic "server actions" --tokens 2500
.ai/bin/context7-get-context facebook react --topic hooks --tokens 2000
.ai/bin/context7-get-context supabase supabase --topic rls --tokens 2500
```

**Perplexity CLI** - For best practices and current information:
```bash
# Search for information
.ai/bin/perplexity-search "topic" --num-results 10

# Get AI-generated answer with citations
.ai/bin/perplexity-chat "What are the best practices for X?"

# With specific domains
.ai/bin/perplexity-search "React dashboard patterns" --domains github.com,stackoverflow.com
```

**When to Research:**
- API usage unclear from manifest code examples
- Error encountered not covered in gotchas
- Alternative pattern needed for edge case
- Library version compatibility questions

**Research Output Format:**
```
[PROGRESS] Research: Looking up <topic> via Context7/Perplexity
[PROGRESS] Research: Found pattern for <topic>
```

### Step 6: Execute Implementation

Follow the plan's Step by Step Tasks exactly:

1. **Read each task** carefully before starting
2. **Reference manifest patterns** when implementing
3. **Load relevant skills** if applicable to task
4. **Mark task in_progress** before starting work
5. **Output progress marker** before starting each task
6. **Implement task** following plan details
7. **Output progress marker** after completing task
8. **Mark task completed** immediately after finishing
9. **Move to next task**

**CRITICAL: Progress Markers**

Output progress markers throughout implementation for orchestrator visibility:

```
[PROGRESS] Starting task: <task name>
[PROGRESS] Files: Creating <file path>
[PROGRESS] Files: Modifying <file path>
[PROGRESS] Completed: <task name>
[PROGRESS] Validation: Running <command>
[PROGRESS] Validation: <command> - PASSED/FAILED
[PROGRESS] Implementation: <X>/<N> tasks complete
```

These markers are parsed by the sandbox logger for real-time status updates.

**Research-Guided Implementation:**
- Apply code patterns from manifest
- Reference manifest code examples
- Avoid gotchas documented in manifest
- Follow recommended patterns

### Step 7: Run Validation Commands

Execute ALL validation commands from the plan:

```bash
# Standard validations
pnpm typecheck
pnpm test:unit
pnpm build

# Plus any feature-specific validations from plan
```

**CRITICAL**: Every validation must pass. If any fails:
1. Fix the issue
2. Re-run validation
3. Do NOT proceed until all pass

### Step 8: Gather Implementation Stats

```bash
# Get git statistics
git diff --stat origin/main
git diff --name-only origin/main
git log --oneline origin/main..HEAD
```

### Step 9: Update GitHub Issue

```bash
# Post completion comment
gh issue comment <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --body "$(cat <<'EOF'
## ✅ Implementation Complete

### Summary
- [Implementation summary bullets]

### Files Changed
```
[git diff --stat output]
```

### Validation Results
✅ All validations passed

### Research Patterns Applied
- [Patterns from manifest that were used]

---
*Implemented in E2B sandbox*
EOF
)"

# Update labels
gh issue edit <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --add-label "status:implemented" \
  --remove-label "status:in-progress"
```

### Step 10: Generate Structured Output

**CRITICAL**: Output structured JSON for orchestrator:

```json
{
  "success": true,
  "feature": {
    "issue_number": 124,
    "title": "Database Schema Layer",
    "url": "https://github.com/MLorneSmith/2025slideheroes/issues/124"
  },
  "implementation": {
    "tasks_completed": 8,
    "tasks_total": 8,
    "files_changed": 5,
    "lines_added": 234,
    "lines_removed": 12
  },
  "validation": {
    "all_passed": true,
    "commands_run": [
      {"command": "pnpm typecheck", "passed": true},
      {"command": "pnpm test:unit", "passed": true},
      {"command": "pnpm build", "passed": true}
    ]
  },
  "git": {
    "commits": [
      {"hash": "abc123", "message": "feat(rxdb): add presentation schema"}
    ],
    "files_changed": [
      "apps/web/lib/rxdb/schemas/presentation.ts",
      "apps/web/lib/rxdb/collections/index.ts"
    ]
  },
  "research_patterns_applied": [
    "Schema Definition Pattern",
    "Collection Initialization"
  ],
  "github_updated": true,
  "ready_for_review": true
}
```

## Implementation Guidelines

### Following the Plan

1. **Execute tasks in order** - Don't skip or reorder tasks
2. **Complete each task fully** - Don't partially implement
3. **Run incremental validations** - Catch issues early
4. **Reference research when stuck** - Manifest has guidance

### Applying Research Patterns

When implementing:
1. **Check manifest code examples** before writing new code
2. **Apply recommended patterns** consistently
3. **Avoid documented gotchas** proactively
4. **Note which patterns you used** for output

### Error Handling

If implementation encounters issues:

```json
{
  "success": false,
  "feature": {...},
  "implementation": {
    "tasks_completed": 5,
    "tasks_total": 8,
    "blocked_at_task": "Task 6: Integration tests"
  },
  "error": {
    "type": "validation_failure",
    "message": "typecheck failed with 3 errors",
    "details": "[error output]"
  },
  "github_updated": true,
  "ready_for_review": false
}
```

## Plan Format Expected

The implementation plan from GitHub should have:

```md
# Feature: <name>

## Step by Step Tasks

### Task 1: <Name>
- [ ] Subtask details...

### Task 2: <Name>
- [ ] Subtask details...

## Validation Commands
```bash
pnpm typecheck
pnpm test:unit
pnpm build
```
```

## Initiative Input

$ARGUMENTS

## Report

After completion, output:

1. **Structured JSON** (for orchestrator - output FIRST)
2. **Human-readable summary** (for user visibility)

### JSON Output

```json
{
  "success": true,
  "feature": {...},
  "implementation": {...},
  "validation": {...},
  "git": {...},
  "research_patterns_applied": [...],
  "github_updated": true,
  "ready_for_review": true
}
```

### Summary

- **Feature**: #<number> - <title>
- **Implementation**: <tasks completed>/<total tasks> tasks complete
- **Files changed**: <count> files, +<added>/-<removed> lines
- **Validations**: All passed ✓
- **Research patterns applied**: <list>
- **Next**: Review via `review-expert` agent (orchestrator handles this)

## Related Commands

- **`/initiative`**: Main orchestrator (calls this command)
- **`/initiative-feature`**: Creates the plan this executes (runs locally for context preservation)
- **`/feature-set`**: Creates feature stub issues
- **`/implement`**: Standalone version (without orchestrator)

**Note**: This command is in `.claude/commands/sandbox/` and is designed for E2B sandbox execution only.

## Research Tools Reference

| Tool | Use For | Example |
|------|---------|---------|
| Context7 | Library docs, API reference | `.ai/bin/context7-get-context vercel next.js --topic hooks` |
| Perplexity | Best practices, current info | `.ai/bin/perplexity-chat "React 19 patterns"` |
| Manifest | Pre-gathered research | Reference `manifest.md` passed via `--manifest` |
