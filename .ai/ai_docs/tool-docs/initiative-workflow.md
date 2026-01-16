# Initiative Workflow Documentation

Complete reference for the `/initiative` orchestrator and its component commands, agents, and E2B sandbox integration.

## Overview

The initiative workflow is a comprehensive system for managing complex, multi-feature implementations. It orchestrates research, planning, and implementation phases with E2B sandbox isolation for safe code execution.

## Workflow Diagram

```
User: /initiative "Build a user dashboard"
            │
            ▼
    ┌───────────────────┐
    │ Phase 1: Research │ (initiative-research agent)
    │  • Interview user │
    │  • Context7 docs  │
    │  • Perplexity     │
    │  • Explore codebase│
    │  • Create manifest│
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │Phase 2: Decompose │ (initiative-decomposition agent)
    │  • Parse manifest │
    │  • Create features│
    │  • Dependency graph│
    │  • GitHub issues  │
    └────────┬──────────┘
             │ USER APPROVAL
             ▼
    ┌───────────────────┐
    │ Phase 3: Planning │ (LOCAL - context preservation)
    │  For each feature:│
    │  • /initiative-   │
    │    feature        │
    │  • Skills invoke  │
    │  • Detailed plans │
    └────────┬──────────┘
             │ USER APPROVAL
             ▼
    ┌───────────────────┐
    │Phase 4: Implement │ (E2B SANDBOX - isolation)
    │  • Create sandbox │
    │  • Feature branch │
    │  For each feature:│
    │  • run-claude     │
    │  • User review    │
    │  • Commit         │
    └────────┬──────────┘
             │
             ▼
    ┌───────────────────┐
    │ Phase 5: Complete │
    │  • Push to GitHub │
    │  • Create PR      │
    │  • Close issues   │
    │  • Kill sandbox   │
    └───────────────────┘
```

## Phase Details

### Phase 1: Research

**Agent**: `initiative-research` (Task subagent)

**Purpose**: Gather comprehensive knowledge about technologies, patterns, and codebase conventions needed for the initiative.

**Steps**:
1. Parse input (initiative description, mode, interview responses)
2. Create directory structure: `.ai/reports/feature-reports/<date>/<slug>/`
3. Execute research (mode-dependent):
   - **Quick Mode**: Codebase exploration only (Explore agent)
   - **Full Mode**: Context7 + Perplexity + Explore agent
4. Synthesize into manifest: `manifest.md`

**Outputs**:
- Research reports in `research/` subdirectory
- Manifest file with synthesized findings
- Recommended skills list

**State Variables Set**:
- `manifestPath`: Path to research manifest

### Phase 2: Decomposition

**Agent**: `initiative-decomposition` (Task subagent)

**Purpose**: Break initiative into discrete features with dependency graph.

**Steps**:
1. Load research manifest
2. Identify logical feature boundaries
3. Create dependency graph (DAG)
4. Determine implementation phases
5. Create feature stub issues in GitHub

**Outputs**:
- Feature list with phases and dependencies
- GitHub issues (master + feature stubs)
- Plan file with dependency graph

**State Variables Set**:
- `masterIssueNumber`: GitHub issue for feature-set
- `featureIssues[]`: Array of feature issue numbers

**User Approval Gate**: User approves decomposition before GitHub issues are created.

### Phase 3: Feature Planning (LOCAL)

**Execution**: Local (not in sandbox)

**Why Local**:
- No code is written - just markdown plans
- Context preservation - agents retain research manifest
- User interaction works reliably (fails in sandbox)
- Faster - no sandbox startup overhead
- GitHub CLI is already authenticated locally

**Command**: `/initiative-feature <issue> --manifest <path> --master-issue <number>`

**Steps for Each Feature**:
1. Fetch feature stub from GitHub
2. Load research manifest
3. Invoke skills (frontend-design for UI features)
4. Conduct additional research if needed
5. Create detailed implementation plan
6. Update GitHub issue with FULL plan content (embedded, not file reference)
7. Mark issue as `status:planned`

**Critical Requirement**: Plans MUST be embedded in GitHub issue body, not referenced as local file paths. The sandbox clones from GitHub and won't have access to local files.

**User Approval Gate**: User approves all plans before implementation begins.

### Phase 4: Implementation (E2B SANDBOX)

**Execution**: E2B cloud sandbox (isolated environment)

**Why Sandbox**:
- Isolation from local environment
- Fresh git clone from GitHub
- Safe code execution
- Consistent environment
- Accessible development server URL

**Steps**:
1. Verify prerequisites (E2B_API_KEY, GITHUB_TOKEN, ANTHROPIC_API_KEY)
2. Create sandbox: `sandbox create --template slideheroes-claude-agent`
3. Create feature branch in sandbox
4. For each feature (in dependency order):
   a. Run implementation: `sandbox run-claude "/sandbox/initiative-implement <issue> --manifest github:issue:<manifest-issue>"`
   b. User review via public dev URL
   c. Commit changes
   d. Unblock dependent features
5. Push all changes to GitHub

**Timeout Configuration**:
| Effort | Timeout | Use Case |
|--------|---------|----------|
| S | 15 min | Simple card components, minor updates |
| M | 30 min | Data loaders, complex components |
| L | 45 min | Multi-file features, integrations |
| XL | 60 min | Large features, full-page implementations |

**User Review Gate**: User approves each feature implementation before commit.

### Phase 5: Completion

**Execution**: Local (orchestrator)

**Steps**:
1. Create pull request via `gh pr create`
2. Update master issue with completion report
3. Kill sandbox: `sandbox kill <id>`

**Outputs**:
- Pull request with all features
- Closed feature issues
- Final summary

## State Variables

| Variable | Set In | Description |
|----------|--------|-------------|
| `slug` | Step 1.1 | Initiative slug (kebab-case, max 30 chars) |
| `todayDate` | Step 1.1 | Today's date (YYYY-MM-DD) |
| `quickMode` | Step 1.1 | true if --quick flag passed |
| `manifestPath` | Phase 1 | Path to research manifest (or GitHub issue reference) |
| `manifestIssueNumber` | Phase 2 | GitHub issue containing manifest (P1 fix) |
| `masterIssueNumber` | Phase 2 | GitHub issue number for feature-set |
| `featureIssues[]` | Phase 2 | Array of feature issue numbers |
| `sandboxId` | Phase 4 | E2B sandbox ID |
| `branchName` | Phase 4 | Feature branch name |
| `prNumber` | Phase 5 | Pull request number |

## Command Reference

### `/initiative [description] [--quick]`

Main orchestrator command. Runs all phases.

**Flags**:
- `--quick`: Skip external research (Context7, Perplexity). Uses codebase patterns only.

### `/initiative-feature <issue> --manifest <path> --master-issue <number>`

Create detailed plan for a single feature. Called by orchestrator in Phase 3.

**Arguments**:
- `issue`: GitHub issue number for the feature
- `--manifest`: Path to research manifest (or `github:issue:<number>`)
- `--master-issue`: Parent feature-set issue number

### `/sandbox/initiative-implement <issue> --manifest <path>`

Sandbox-optimized implementation. Called by orchestrator in Phase 4.

**Arguments**:
- `issue`: GitHub issue number for the feature
- `--manifest`: Path to research manifest (or `github:issue:<number>`)

### Sandbox CLI Commands

```bash
# Create sandbox
.claude/skills/e2b-sandbox/scripts/sandbox create --template slideheroes-claude-agent --timeout 3600

# Run Claude in sandbox
.claude/skills/e2b-sandbox/scripts/sandbox run-claude "/implement #123" --sandbox <id>

# Execute command in sandbox
.claude/skills/e2b-sandbox/scripts/sandbox exec <id> "command"

# Get public URL for port
.claude/skills/e2b-sandbox/scripts/sandbox url <id> 3000

# Kill sandbox
.claude/skills/e2b-sandbox/scripts/sandbox kill <id>
```

## Manifest Storage (P1 Fix)

### Problem
Research manifest saved locally is inaccessible in E2B sandbox because sandbox clones from GitHub.

### Solution
Store manifest in a dedicated GitHub issue:
- **Title**: `Research Manifest: <Initiative Name>`
- **Labels**: `type:research`, `status:active`
- **Body**: Full markdown manifest content
- **Reference**: `github:issue:<number>` format

### Manifest Path Format
- **Local reference**: `.ai/reports/feature-reports/2025-12-17/1234-user-dashboard/manifest.md`
- **GitHub reference**: `github:issue:1256`

### Loading Manifest in Sandbox
```bash
# If manifest path starts with "github:issue:"
gh issue view <manifest-issue-number> --json body -q .body
```

## Progress Markers

Standardized markers for sandbox visibility:

```
[PROGRESS] Phase: <phase-name>
[PROGRESS] Starting task: <task-name>
[PROGRESS] Files: Creating <file-path>
[PROGRESS] Files: Modifying <file-path>
[PROGRESS] Completed: <task-name>
[PROGRESS] Validation: <command> - PASSED|FAILED
[PROGRESS] Implementation: <X>/<N> tasks complete
```

## Error Recovery

### Sandbox Creation Fails

```
ERROR: E2B sandbox creation failed

Possible causes:
1. E2B_API_KEY not set or invalid
2. Template 'slideheroes-claude-agent' not found
3. E2B service unavailable

Fix: Rebuild template with `pnpm e2b:build:prod` (requires GITHUB_TOKEN)

For individual features, use:
  /feature #<issue>   → Create plan
  /implement #<issue> → Execute plan
```

### GitHub Auth Missing in Sandbox

```
ERROR: GitHub operations failing in sandbox

The sandbox needs GH_TOKEN to push changes.
Ensure GITHUB_TOKEN or GH_TOKEN is set in your environment before running /initiative.
```

### Planning Agent Fails

If planning fails for a feature:
1. Check manifest is accessible
2. Verify GitHub issue exists and is readable
3. Retry with explicit error message
4. Allow user to skip feature and continue

### Implementation Fails in Sandbox

If implementation fails:
1. Check sandbox is still alive: `sandbox list`
2. Verify feature branch exists
3. Check validation command output
4. Allow user to request changes or skip feature

## Best Practices

### When to Use /initiative

- Features requiring 4+ hours of work
- Multi-component implementations
- Clear separation of concerns
- Multiple related features

### When NOT to Use /initiative

- Quick fixes (<2 hours)
- Single-file changes
- Features with heavy inter-dependencies
- Urgent hotfixes

### Planning Quality

- Ensure plans are EMBEDDED in GitHub issues (not file references)
- Include all validation commands
- List expected files to create/modify
- Document database changes explicitly

### Implementation Review

- Use sandbox dev URL for visual verification
- Run all validation commands
- Check for regressions
- Verify feature works end-to-end

## Related Documentation

- `.claude/commands/initiative.md` - Main orchestrator
- `.claude/commands/initiative-feature.md` - Feature planning
- `.claude/commands/sandbox/initiative-implement.md` - Sandbox implementation
- `.claude/agents/initiative/initiative-research.md` - Research agent
- `.claude/agents/initiative/initiative-decomposition.md` - Decomposition agent
- `.ai/ai_docs/context-docs/development/initiative-patterns.md` - Conditional docs patterns
