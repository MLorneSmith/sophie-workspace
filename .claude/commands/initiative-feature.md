---
description: Create detailed feature plan using research manifest from /initiative workflow. Updates GitHub issue with plan and marks as planned
argument-hint: [issue-number] --manifest [path]
model: opus
allowed-tools: [Read, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Initiative Feature Planning

Create a detailed implementation plan for a feature that is part of an `/initiative` workflow. Uses pre-generated research manifest for context and updates the GitHub issue with the complete plan.

## Key Differences from /feature

| Aspect | /feature | /initiative-feature |
|--------|----------|---------------------|
| Research | Does own codebase exploration | Loads research manifest |
| Input | Feature description | GitHub issue number |
| Output | Human-readable plan | Structured JSON + plan file |
| Interview | Full user interview | Minimal (context from orchestrator) |
| Context | Standalone command | Part of /initiative workflow |

## Instructions

IMPORTANT: This command is called by `/initiative` orchestrator with research context already gathered.
IMPORTANT: Load and use the research manifest - do NOT duplicate research.
IMPORTANT: Output must be structured for orchestrator consumption.

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Issue number**: The GitHub issue number for this feature
- **Manifest path**: Path to research manifest (look for `--manifest` flag)

```typescript
// Expected format:
// $ARGUMENTS = "124 --manifest .ai/reports/feature-reports/2025-12-17/1208-user-dashboard/manifest.md"

const args = "$ARGUMENTS";
const manifestMatch = args.match(/--manifest\s+(\S+)/);
const manifestPath = manifestMatch ? manifestMatch[1] : null;
const issueNumber = args.replace(/--manifest\s+\S+/, '').trim().replace('#', '');
```

### Step 2: Fetch GitHub Issue

Load the feature stub issue created by `/initiative`:

```bash
gh issue view <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --json body,title,labels,number,url
```

Extract from issue:
- Feature title and description
- Parent feature-set issue reference
- Initial scope/requirements
- Feature type and priority

### Step 3: Load Research Manifest

If manifest path provided:

```bash
cat <manifest-path>
```

Extract from manifest:
- Technology overview
- Recommended patterns
- Gotchas and warnings
- Code examples
- Feature-specific research sections

This research informs your planning - use it extensively.

### Step 4: Quick Context Validation

Use AskUserQuestion ONLY if critical information is missing from the issue:

```typescript
// Only ask if NOT provided in issue or manifest:
// - Specific implementation approach preferences
// - Trade-offs that need user decision
// - Ambiguous requirements
```

In most cases, the orchestrator and feature-set have already gathered this context. Proceed with planning using manifest research and issue details.

### Step 5: Load Conditional Documentation

Use the conditional docs system for project-specific patterns:

```typescript
SlashCommand({ command: '/conditional_docs feature "<feature-summary-from-issue>"' })
```

Read suggested documentation files to understand:
- Existing patterns to follow
- Integration points
- Testing conventions

### Step 5.5: Feature-Specific Research (When Needed)

Based on the feature requirements and manifest, identify knowledge gaps:

**1. Check Manifest Coverage**
Does the research manifest address this feature's specific needs?
- All technologies covered? ✓/✗
- All patterns documented? ✓/✗
- Any unknowns remain? List them

**2. Identify Unknowns**
What technologies/patterns need additional clarification?
- Libraries not in manifest (e.g., new external API)
- Complex database schema changes
- Security-sensitive functionality
- Performance-critical operations

**3. Targeted Research (If Needed)**

Use these tools for additional research:

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

**Task(Explore)** - For codebase exploration:
```typescript
Task('Explore', {
  prompt: `Find existing patterns for ${feature.unknowns.join(', ')}.
           Focus on: code examples, common patterns, integration points.`
})
```

**Triggers for Additional Research:**
- Feature involves library not covered in manifest
- Database schema changes require understanding existing patterns
- Security functionality (auth, permissions, encryption)
- Integration with external services (Cal.com, Stripe, etc.)
- Performance-critical paths (caching, pagination)

**Research Output:**
If additional research was performed, include it in the plan:
```md
## Additional Research Findings
- **Topic**: <what was researched>
- **Source**: <Context7 / Perplexity / Explore agent>
- **Key Findings**: <summary of findings>
- **Applied To**: <how this informs the plan>
```

### Step 6: Research-Informed Planning

Using research manifest findings, create the implementation plan:

**CRITICAL: Progress Markers**

Output progress markers throughout planning for orchestrator visibility:

```
[PROGRESS] Planning: Loading manifest from <path>
[PROGRESS] Planning: Analyzing feature #<issue>
[PROGRESS] Planning: Exploring codebase for <pattern>
[PROGRESS] Planning: Designing solution approach
[PROGRESS] Planning: Creating plan file
[PROGRESS] Planning: Updating GitHub issue
```

**Research-Guided Approach:**
- Apply technology patterns from manifest
- Reference code examples for implementation
- Consider gotchas when designing solution
- Follow recommended patterns from research

**Codebase Integration:**
- Use Task with `subagent_type=Explore` for targeted exploration
- Focus on integration points identified in manifest
- Verify existing patterns match research recommendations

### Step 7: Create Plan File

Create plan in `.ai/specs/features/<initiative-slug>/`:

**Directory**: `.ai/specs/features/<initiative-slug>/`
**Filename**: `<issue#>-feature-plan.md`

Use the Plan Format below, enhanced with research context.

### Step 8: Update GitHub Issue

Update the stub issue with the detailed plan:

```bash
gh issue edit <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --body "<full-plan-content>"

# Add label indicating plan is ready
gh issue edit <issue-number> \
  --repo MLorneSmith/2025slideheroes \
  --add-label "status:planned" \
  --remove-label "status:ready"
```

### Step 9: Generate Structured Output

**CRITICAL**: Output structured JSON for orchestrator:

```
=== PLANNING OUTPUT ===
{
  "success": true,
  "feature": {
    "issue_number": 124,
    "title": "Database Schema Layer",
    "url": "https://github.com/MLorneSmith/2025slideheroes/issues/124"
  },
  "plan": {
    "file_path": ".ai/specs/features/local-first-rxdb/124-feature-plan.md",
    "phases": 3,
    "tasks": 12
  },
  "validation_commands": [
    "pnpm typecheck",
    "pnpm test:unit",
    "pnpm build"
  ],
  "dependencies": {
    "packages": ["rxdb", "@rxdb/encryption"],
    "features": []
  },
  "database_impact": {
    "requires_changes": true,
    "new_tables": ["activity_log"],
    "modified_tables": [],
    "schema_file": "apps/web/supabase/schemas/50-activity-log.sql",
    "rls_policies": ["activity_log_select_own", "activity_log_insert_own"],
    "migration_commands": [
      "pnpm --filter web supabase:db:diff -f add-activity-log",
      "pnpm --filter web supabase migration up",
      "pnpm supabase:web:typegen"
    ]
  },
  "estimated_files": [
    "apps/web/lib/rxdb/schemas/presentation.ts",
    "apps/web/lib/rxdb/collections/index.ts"
  ],
  "research_sections_used": [
    "Technology Overview",
    "Code Examples - Schema Definition",
    "Gotchas - Migration Strategy"
  ],
  "github_updated": true
}
=== END PLANNING OUTPUT ===
```

## Plan Format

```md
# Feature: <feature name>

## Context

**Parent Initiative**: <initiative name> (#<feature-set-issue>)
**Research Manifest**: <manifest-path>
**Issue**: #<issue-number>

## Feature Description
<describe the feature in detail, referencing research findings>

## Research Insights Applied

### From Technology Overview
<relevant findings from manifest>

### From Recommended Patterns
<patterns being applied>

### Gotchas Addressed
<how gotchas from manifest are being handled>

## User Story
As a <type of user>
I want to <action/goal>
So that <benefit/value>

## Solution Approach
<describe the solution, referencing research code examples where applicable>

## Relevant Files

### Existing Files to Modify
<files that need changes, with explanation>

### New Files to Create
<new files needed for this feature>

## Impact Analysis

### Dependencies Affected
<packages and features affected>

### Database Impact
<Analyze if this feature requires database changes>

**Tables Affected:**
- [ ] New tables needed: <table names or "None">
- [ ] Existing tables modified: <table names or "None">
- [ ] New columns needed: <column names or "None">

**Schema Changes Required:**
- [ ] Schema file: `apps/web/supabase/schemas/XX-<feature>.sql`
- [ ] Migration needed: Yes/No
- [ ] RLS policies needed: <policy names or "None">

**Migration Commands:**
```bash
# If schema changes are needed, include in validation:
pnpm --filter web supabase:db:diff -f <migration-name>
pnpm --filter web supabase migration up
pnpm supabase:web:typegen
```

**Note:** If database changes are required, add a `db-changes` label to the GitHub issue and include migration commands in validation steps.

### Risk Assessment
<risk level with justification>

### Security Considerations
<security aspects, especially if mentioned in manifest gotchas>

### Performance Impact
<performance considerations from research>

## Implementation Plan

### Phase 1: Foundation
<foundational work, referencing manifest patterns>

### Phase 2: Core Implementation
<main implementation, applying research code examples>

### Phase 3: Integration
<integration with existing features>

## Step by Step Tasks

### Task 1: <Task Name>
- [ ] Subtask 1
- [ ] Subtask 2
- **Research Reference**: <relevant manifest section>

### Task 2: <Task Name>
- [ ] Subtask 1
- [ ] Subtask 2

<continue with all tasks>

## Testing Strategy

### Unit Tests
<unit tests needed>

### Integration Tests
<integration tests, especially for patterns from manifest>

### E2E Tests
<end-to-end tests>

## Acceptance Criteria
<specific criteria for completion>

## Validation Commands
```bash
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm build
```

## Notes
<additional context, future considerations, manifest references>
```

## Research Manifest Integration

When loading the manifest, specifically look for:

### Technology Overview
Understand the overall technology landscape and apply to this specific feature.

### Recommended Patterns
Apply these patterns directly to your implementation plan.

### Code Examples
Reference and adapt examples for this feature's specific needs.

### Gotchas & Warnings
Proactively address these in your plan design.

### Feature Mapping
Check if the manifest has specific guidance for this feature.

## Plan Storage

```
.ai/specs/features/<initiative-slug>/
├── <issue#>-feature-plan.md    # This feature's plan
├── <other-issue#>-feature-plan.md
└── ...
```

## Initiative Input

$ARGUMENTS

## Report

After completion, output:

1. **Structured JSON** (for orchestrator - output FIRST within markers)
2. **Human-readable summary** (for user visibility)

### Summary

- **Feature**: #<number> - <title>
- **Plan file**: <path>
- **Tasks**: <count> tasks across <count> phases
- **Research sections used**: <list>
- **Next**: Implementation will run in E2B sandbox

## Error Handling

- **Issue not found**: Return error status with message
- **Manifest not found**: Return warning, proceed with standard /feature approach
- **GitHub update failure**: Include in output, don't fail entire planning

## Related Commands

- **`/initiative`**: Main orchestrator (calls this command)
- **`/feature`**: Standalone version (without orchestrator)
- **`/implement`**: Execute this plan in sandbox
