# Alpha Implementation System

The Alpha Implementation System orchestrates autonomous code implementation across E2B sandboxes using Claude Code sessions.

## Overview

This system is the final piece of the Alpha Autonomous Coding workflow:

1. **Spec** (`/alpha:spec`) - Define what to build
2. **Initiative Decompose** (`/alpha:initiative-decompose`) - Break into initiatives
3. **Feature Decompose** (`/alpha:feature-decompose`) - Break into features
4. **Task Decompose** (`/alpha:task-decompose`) - Break into atomic tasks
5. **Implement** (`alpha-orchestrator.ts` + `/alpha:implement`) - **Build it all**

## Components

### 1. Initiative Manifest Generator

**Location**: `.ai/alpha/scripts/generate-initiative-manifest.ts`

Aggregates all tasks.json files from feature directories into a single manifest for orchestration.

**Usage**:
```bash
tsx .ai/alpha/scripts/generate-initiative-manifest.ts <initiative-id>
```

**Output**: `initiative-manifest.json` in the initiative directory with:
- All features and their tasks
- Parallel execution groups
- Progress tracking state
- Sandbox information placeholder

### 2. Alpha Orchestrator

**Location**: `.ai/alpha/scripts/alpha-orchestrator.ts`

TypeScript script that:
- Creates/resumes E2B sandboxes
- Manages Claude Code sessions via sandbox CLI
- Tracks progress across features
- Provides review URLs (VS Code Web + Dev Server)
- Handles session restarts when context limit hit

**Usage**:
```bash
tsx .ai/alpha/scripts/alpha-orchestrator.ts <initiative-id> [options]

Options:
  --parallel <n>    Max parallel features (default: 2)
  --resume          Resume from previous state
  --timeout <s>     Sandbox timeout in seconds (default: 7200)
  --dry-run         Show plan without executing
```

**Example**:
```bash
# Start fresh implementation
tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363

# Resume after interruption
tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363 --resume

# Preview execution plan
tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363 --dry-run
```

### 3. Alpha Implement Command

**Location**: `.claude/commands/alpha/implement.md`

Slash command run inside E2B sandbox to implement a single feature's tasks.

**Usage** (inside sandbox):
```
/alpha:implement <feature-id>
```

**Responsibilities**:
- Load feature tasks from tasks.json
- Execute tasks in group order
- Run verification commands
- Update progress file
- Make commits after each group
- Exit cleanly at 60% context usage

## Workflow

### Complete Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                     ALPHA IMPLEMENTATION                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Generate Manifest                                            │
│     └─→ tsx generate-initiative-manifest.ts 1363                 │
│                                                                  │
│  2. Start Orchestrator                                           │
│     └─→ tsx alpha-orchestrator.ts 1363                           │
│                                                                  │
│  3. Orchestrator Actions:                                        │
│     ├─→ Create E2B sandbox                                       │
│     ├─→ Start VS Code Web (port 8080)                           │
│     ├─→ Start Dev Server (port 3000)                            │
│     ├─→ Display review URLs to user                             │
│     └─→ Execute features via Claude Code sessions               │
│                                                                  │
│  4. For Each Feature:                                            │
│     ├─→ Run: claude code "/alpha:implement <feature-id>"        │
│     ├─→ Monitor progress via .initiative-progress.json          │
│     ├─→ Handle context limit restarts                           │
│     └─→ Track completion status                                 │
│                                                                  │
│  5. Final Validation:                                            │
│     ├─→ Run pnpm codecheck                                      │
│     └─→ Push changes to GitHub                                  │
│                                                                  │
│  6. User Review:                                                 │
│     ├─→ Visit VS Code Web URL to review code                    │
│     └─→ Visit Dev Server URL to test application                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Review URLs

The orchestrator provides two URLs for reviewing work without pulling from GitHub:

1. **VS Code Web** (`https://{sandbox-host}:8080`)
   - Full VS Code IDE in browser
   - View and edit files
   - Git integration
   - Terminal access

2. **Dev Server** (`https://{sandbox-host}:3000`)
   - Running Next.js application
   - Test implemented features
   - Visual verification

These URLs are displayed immediately after sandbox creation and stored in the manifest.

## File Structure

```
.ai/alpha/
├── scripts/
│   ├── generate-initiative-manifest.ts  # Aggregates tasks into manifest
│   ├── alpha-orchestrator.ts            # Main orchestration script
│   └── [other existing scripts]
├── templates/
│   ├── tasks.schema.json               # Task definition schema
│   └── initiative-manifest.schema.json  # Manifest schema
└── specs/
    └── <spec-id>-Spec-<name>/
        └── <init-id>-Initiative-<name>/
            ├── initiative-manifest.json  # Generated manifest
            └── <feature-id>-Feature-<name>/
                └── tasks.json           # Feature tasks

.claude/commands/alpha/
├── spec.md
├── initiative-decompose.md
├── feature-decompose.md
├── task-decompose.md
└── implement.md                        # Sandbox implementation command
```

## Spec-Based Branching

The orchestrator uses **spec-based branching** to enable seamless multi-initiative workflows.

### Why Spec-Based?

A Spec typically contains multiple Initiatives that together deliver a complete feature set:

```
Spec #1362 (user-dashboard-home)
├── Initiative #1363 (dashboard-foundation)    ← Run 1
├── Initiative #1364 (activity-feed)           ← Run 2
└── Initiative #1365 (coaching-integration)    ← Run 3
```

With **initiative-based** branching (old approach), each orchestrator run would create a separate branch:
- `alpha/initiative-1363`
- `alpha/initiative-1364`
- `alpha/initiative-1365`

This required manual merging of 3 branches to complete one Spec.

With **spec-based** branching (current approach), all initiatives share one branch:
- `alpha/spec-1362`

### Branch Naming Convention

| Mode | Branch Pattern | Purpose |
|------|----------------|---------|
| Single sandbox | `alpha/spec-{spec_id}` | Main implementation branch |
| Dual sandbox | `alpha/spec-{spec_id}-sbx-a`, `alpha/spec-{spec_id}-sbx-b` | Parallel work branches |
| Merge target | `alpha/spec-{spec_id}` | Final merged branch |

### Multi-Initiative Continuity

When running the orchestrator for subsequent initiatives in the same spec:

**First Initiative (#1363):**
```
📦 Creating E2B sandbox...
   Fetching from origin...
   No existing spec branch found
   Starting from dev branch...
   Creating branch: alpha/spec-1362

[Implementation runs...]

   Pushing to origin: alpha/spec-1362
```

**Second Initiative (#1364):**
```
📦 Creating E2B sandbox...
   Fetching from origin...
   Found existing branch: alpha/spec-1362
   Checking out and pulling latest changes...
   Using existing branch: alpha/spec-1362

[Implementation continues from where #1363 left off...]
```

### Benefits

1. **Single PR per Spec**: All work for a spec results in one pull request
2. **Automatic Continuity**: No manual branch management between initiatives
3. **Cumulative Progress**: Each initiative builds on previous work
4. **Simpler Review**: Reviewers see the complete spec implementation together
5. **Clean History**: Logical commit progression across all initiatives

### Workflow Example

```bash
# Implement first initiative
tsx alpha-orchestrator.ts 1363
# Creates alpha/spec-1362, implements dashboard-foundation

# Implement second initiative (days/weeks later)
tsx alpha-orchestrator.ts 1364
# Continues on alpha/spec-1362, implements activity-feed

# Implement third initiative
tsx alpha-orchestrator.ts 1365
# Continues on alpha/spec-1362, implements coaching-integration

# Create single PR for entire spec
gh pr create --base dev --head alpha/spec-1362 \
  --title "Spec #1362: User Dashboard Home" \
  --body "Implements all 3 initiatives for the user dashboard"
```

### Dual Sandbox Branch Merging

When using dual sandbox mode (`--parallel 2`), each sandbox works on a sub-branch:

```
alpha/spec-1362-sbx-a  ──┐
                        ├──→ alpha/spec-1362 (merged locally)
alpha/spec-1362-sbx-b  ──┘
```

The orchestrator automatically merges these sub-branches into the main spec branch after completion.

## Progress Tracking

### Initiative Manifest Progress

The `initiative-manifest.json` tracks:
- Overall status (pending/in_progress/completed/failed/partial)
- Features completed count
- Tasks completed count
- Current feature being implemented
- Sandbox information (ID, URLs, branch)
- Checkpoints for resume

### Feature Progress File

Inside sandbox, `.initiative-progress.json` tracks:
- Current task being executed
- Completed tasks list
- Failed tasks list
- Context usage percentage
- Progress entries with timestamps

## Error Handling

### Context Limit
When a Claude Code session reaches 60% context usage:
1. Current state saved to progress file
2. Session exits cleanly with status "context_limit"
3. Orchestrator starts new session to continue
4. Tasks resume from checkpoint

### Task Failure
When a task fails verification 3 times:
1. Task marked as "blocked"
2. Error documented in progress file
3. Implementation continues with next task
4. Blocked tasks require manual intervention

### Session Timeout
E2B sandbox has configurable timeout (default 2 hours):
1. Manifest saved before timeout
2. Re-run orchestrator with `--resume` flag
3. New sandbox created, continues from checkpoint

## Environment Variables

Required:
- `E2B_API_KEY` - E2B platform access
- `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` - Claude access

Optional:
- `GITHUB_TOKEN` - For git push and PR creation

## Prerequisites

Before running the orchestrator:

1. Complete task decomposition for all features:
   ```bash
   /alpha:task-decompose <initiative-id>
   ```

2. Generate the initiative manifest:
   ```bash
   tsx .ai/alpha/scripts/generate-initiative-manifest.ts <initiative-id>
   ```

3. Set environment variables:
   ```bash
   export E2B_API_KEY=<your-key>
   export ANTHROPIC_API_KEY=<your-key>
   export GITHUB_TOKEN=<your-token>
   ```

## Example Run

```bash
# For Initiative #1363 (Dashboard Foundation)
$ tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363

══════════════════════════════════════════════════════════════════════
   ALPHA INITIATIVE ORCHESTRATOR
══════════════════════════════════════════════════════════════════════

📊 Initiative #1363: dashboard foundation
   Spec: #1362
   Features: 4
   Tasks: 43
   Estimated Hours: 17 (parallel)

📦 Creating E2B sandbox (timeout: 7200s)...
   Sandbox ID: sbx_abc123
   Configuring git credentials...
   Creating branch: alpha/spec-1362

🚀 Starting services...
   Starting VS Code Web...
   Starting dev server...

══════════════════════════════════════════════════════════════════════
   REVIEW URLS
══════════════════════════════════════════════════════════════════════

   📝 VS Code Web (view/edit code):
      https://sbx-abc123-8080.e2b.dev

   🌐 Dev Server (test application):
      https://sbx-abc123-3000.e2b.dev

   📦 Sandbox ID: sbx_abc123
   🌿 Branch: alpha/spec-1362

══════════════════════════════════════════════════════════════════════
   IMPLEMENTATION
══════════════════════════════════════════════════════════════════════

📦 Executing Group 0: Foundation features - no dependencies

   🔄 Batch: #1367, #1368

📋 Implementing Feature #1367: Dashboard Page & Grid Layout
   Tasks: 20
   Estimated hours: 17
   Running: /alpha:implement 1367
   ────────────────────────────────────────────────────────────────
   │ [Loading Context]
   │ ✓ Loaded tasks.json (20 tasks, 7 groups)
   │ ✓ Loaded conditional docs (5 files)
   │
   │ [Group 1: Foundation]
   │ → T1: Create dashboard TypeScript types
   │   ✓ Verification passed
   │ → T2: Create dashboard data loader skeleton
   │   ✓ Verification passed
   │ ✓ Committed: abc1234
   │ ...
   ────────────────────────────────────────────────────────────────
   Exit code: 0
   ✅ Feature #1367: completed (20/20 tasks)

... [continues for all features] ...

══════════════════════════════════════════════════════════════════════
   SUMMARY
══════════════════════════════════════════════════════════════════════

   📊 Results:
      Features: 4/4 completed
      Failed: 0
      Tasks: 43/43

   🔗 Review URLs:
      VS Code: https://sbx-abc123-8080.e2b.dev
      Dev Server: https://sbx-abc123-3000.e2b.dev

   ✅ Initiative implementation complete!
```
