---
title: "Initiative Workflow Patterns"
description: "Patterns and best practices for using the /initiative orchestrator workflow"
keywords:
  - initiative
  - orchestrator
  - feature-set
  - workflow
  - planning
  - implementation
  - sandbox
  - e2b
tags:
  - workflow
  - orchestration
  - planning
  - implementation
  - e2b
  - sandbox
dependencies:
  - "infrastructure/e2b-sandbox.md"
cross_references:
  - name: "E2B Sandbox Setup"
    path: "infrastructure/e2b-sandbox.md"
  - name: "Architecture Overview"
    path: "development/architecture-overview.md"
priority: medium
last_updated: "2025-12-17"
---

# Initiative Workflow Patterns

This document covers common patterns and best practices for using the `/initiative` orchestrator to implement complex, multi-feature work.

## When to Use /initiative

### Good Use Cases

1. **Multi-Component Features**: Dashboard with multiple widgets, data loaders, and UI components
2. **Feature Sets**: Related features that share research context (e.g., user management suite)
3. **Large Implementations**: Features requiring 4+ hours of work
4. **Technology Exploration**: Features requiring library research (new charts, integrations)

### When to Avoid

1. **Quick Fixes**: Use `/feature` + `/implement` for <2 hour work
2. **Single-File Changes**: Direct editing is faster
3. **Heavy Dependencies**: Features that can't be parallelized
4. **Urgent Hotfixes**: Skip orchestration for critical fixes

## Research Phase Patterns

### Full vs Quick Mode

```bash
# Full mode: External research + codebase exploration
/initiative "Build a user metrics dashboard"

# Quick mode: Codebase patterns only (faster)
/initiative "Add search to existing dashboard" --quick
```

**Use Full Mode When**:
- Using new libraries (charts, integrations)
- Implementing unfamiliar patterns
- Security-sensitive features

**Use Quick Mode When**:
- Extending existing patterns
- Well-understood domain
- Time-constrained implementations

### Interview Responses

The orchestrator interviews you about technologies and expectations. Good responses:

```typescript
// Technologies question
"shadcn/ui charts, Recharts for radar graphs, existing data loader pattern"

// Clarifying question - be specific
"Real-time updates not needed, cached data is fine. Focus on mobile responsiveness."

// Expected size
"Medium (4-7)" // Be realistic to avoid over/under-decomposition
```

## Decomposition Patterns

### Feature Boundaries

Good feature boundaries have:
- **Single Responsibility**: One clear purpose
- **Testable**: Can be validated independently
- **Reasonable Size**: S/M effort (15-30 min implementation)

### Dependency Management

Features should be ordered by dependencies:

```
Phase 1 (No Dependencies):
  - Feature A: Data Loader
  - Feature B: Base Components

Phase 2 (Depends on Phase 1):
  - Feature C: Dashboard Grid (needs A, B)
  - Feature D: Settings Panel (needs A)

Phase 3 (Depends on Phase 2):
  - Feature E: Complete Dashboard (needs C, D)
```

## Planning Phase Patterns

### Plan Quality Checklist

- [ ] Plan is EMBEDDED in GitHub issue (not file reference)
- [ ] All validation commands listed
- [ ] Expected files to create/modify listed
- [ ] Database changes documented
- [ ] Acceptance criteria defined
- [ ] Testing strategy included

### Skill Invocation

Plans should invoke appropriate skills:

```typescript
// UI features → frontend-design
Skill({ skill: "frontend-design" })

// Charts/visualizations → canvas-design
Skill({ skill: "canvas-design" })

// PDF/document generation → pdf
Skill({ skill: "pdf" })
```

### Conditional Documentation

Plans should load relevant context docs:

```typescript
SlashCommand({ command: '/conditional_docs initiative-feature "dashboard layout grid"' })
```

## Implementation Phase Patterns

### Sandbox Usage

```bash
# Create sandbox with appropriate timeout
SANDBOX_CLI=".claude/skills/e2b-sandbox/scripts/sandbox"
${SANDBOX_CLI} create --template slideheroes-claude-agent --timeout 3600

# Execute with effort-based timeout
${SANDBOX_CLI} run-claude "/sandbox/initiative-implement ${featureIssue} --manifest github:issue:${MANIFEST_ISSUE}" \
  --sandbox ${sandboxId} \
  --timeout ${effortTimeout}  # S=15min, M=30min, L=45min, XL=60min
```

### Manifest Access Pattern

```bash
# Local path (won't work in sandbox)
cat .ai/reports/feature-reports/2025-12-17/1234-dashboard/manifest.md

# GitHub issue (works everywhere)
gh issue view 1256 --json body -q .body
```

### Progress Markers

Implementation commands should output progress markers:

```
[PROGRESS] Phase: Implementation
[PROGRESS] Starting task: Create data loader
[PROGRESS] Files: Creating apps/web/app/home/(user)/_lib/server/dashboard.loader.ts
[PROGRESS] Completed: Create data loader
[PROGRESS] Validation: pnpm typecheck - PASSED
[PROGRESS] Implementation: 3/8 tasks complete
```

## Verification Patterns

### Post-Planning Verification

After planning phase, verify:

```bash
# Verify plan file exists
test -f "${planFilePath}" && echo "exists"

# Verify GitHub issue has substantial content
gh issue view ${issueNumber} --json body -q '.body | length'
# Should be >1000 chars for full plan

# Verify labels were updated
gh issue view ${issueNumber} --json labels -q '.labels[].name'
# Should include "status:planned"
```

### Post-Implementation Verification

After each feature:

```bash
# Verify files changed
git diff --stat origin/main

# Verify all validations pass
pnpm typecheck && pnpm lint:fix && pnpm build

# Verify dev server runs
pnpm dev &
```

## Error Recovery Patterns

### Resume After Failure

If orchestrator fails mid-workflow:

1. **Check sandbox status**: `sandbox list`
2. **Check GitHub issues**: All feature issues should show current state
3. **Resume from last good state**:
   - If planning failed: Re-run `/initiative-feature` for that issue
   - If implementation failed: Re-run `sandbox run-claude "/sandbox/initiative-implement ..."`

### Skip Problematic Features

If a feature consistently fails:

```typescript
AskUserQuestion({
  question: "Feature #123 failed twice. How to proceed?",
  options: [
    { label: "Retry", description: "Try implementation again" },
    { label: "Skip", description: "Move to next feature" },
    { label: "Abort", description: "Stop initiative" }
  ]
})
```

## GitHub Issue Conventions

### Master Issue (Feature Set)

```md
# Feature Set: User Dashboard

## Status: 🔄 In Progress

## Features
- [ ] #1235 - Dashboard Layout Grid
- [ ] #1236 - Data Loader
- [ ] #1237 - Metrics Cards
- [ ] #1238 - Activity Chart

## Research Manifest
See #1256 for complete research manifest.

## Dependencies
Phase 1: #1236 (no deps)
Phase 2: #1235, #1237 (depend on #1236)
Phase 3: #1238 (depends on #1235, #1237)
```

### Feature Issue

```md
# Feature: Dashboard Layout Grid

**Parent Initiative**: #1234
**Feature Issue**: #1235
**Phase**: 2
**Effort**: M
**Dependencies**: #1236

---

## Description
[Full feature description]

## Solution Approach
[Detailed approach with code patterns]

## Implementation Tasks
### Task 1: Create grid component
- [ ] Create DashboardGrid.tsx
- [ ] Add responsive breakpoints
...

## Validation Commands
```bash
pnpm typecheck
pnpm lint:fix
pnpm build
```

## Acceptance Criteria
- [ ] Grid displays on dashboard page
- [ ] Responsive at all breakpoints
- [ ] Matches design specifications
```

### Manifest Issue

```md
# Research Manifest: User Dashboard

## Quick Reference
| Field | Value |
|-------|-------|
| **Initiative** | User Dashboard |
| **Mode** | full |
| **Technologies** | shadcn/ui, Recharts, React Query |

## Key Findings Summary

### Technology Overview
- Use shadcn/ui ChartContainer for consistent styling
- Recharts for radar and radial charts
- React Query for data fetching with 5-min stale time

### Recommended Patterns
[Detailed patterns from research]

### Gotchas & Warnings
[Critical issues to avoid]

### Code Examples
[Ready-to-use code snippets]
```

## Integration with Other Commands

### Standalone Feature Work

For single features not part of initiative:

```bash
# Plan feature
/feature "Add user profile page"

# Implement feature
/implement #123
```

### Manual Sandbox Work

For debugging or manual implementation:

```bash
# Create sandbox
/sandbox create

# Execute commands
/sandbox exec <id> "pnpm dev"

# Merge changes back
/gitmerge <branch-name>
```

## Common Issues

### Issue: Manifest Not Found in Sandbox

**Cause**: Manifest path is local file reference
**Solution**: Use `github:issue:<number>` format

### Issue: Planning Agent Doesn't Invoke Skills

**Cause**: Feature type not detected
**Solution**: Include UI keywords in feature description (dashboard, component, widget)

### Issue: Implementation Times Out

**Cause**: Default 10-minute timeout too short
**Solution**: Use effort-based timeout (S=15, M=30, L=45, XL=60 minutes)

### Issue: Verification Steps Not Run

**Cause**: Orchestrator doesn't verify agent output
**Solution**: Explicit verification after each phase (P4/P5 fixes)

## Related Commands

| Command | Purpose |
|---------|---------|
| `/initiative` | Main orchestrator |
| `/initiative-feature` | Feature planning |
| `/sandbox/initiative-implement` | Sandbox implementation |
| `/feature` | Standalone feature planning |
| `/implement` | Standalone implementation |
| `/feature-set` | Create feature stubs |
