# Alpha Implementation System

The Alpha Implementation System orchestrates autonomous code implementation across E2B sandboxes using Claude Code sessions.

## Overview

This system is the final piece of the Alpha Autonomous Coding workflow:

1. **Spec** (`/alpha:spec`) - Define what to build
2. **Initiative Decompose** (`/alpha:initiative-decompose`) - Break into initiatives
3. **Feature Decompose** (`/alpha:feature-decompose`) - Break into features
4. **Task Decompose** (`/alpha:task-decompose`) - Break into atomic tasks
5. **Implement** (`spec-orchestrator.ts` + `/alpha:implement`) - **Build it all**

## Architecture

### Spec-Level Orchestration

The orchestrator runs at the **Spec level**, not Initiative level:

```
tsx spec-orchestrator.ts 1362   ← Run with Spec ID

Spec #1362 (user-dashboard-home)
├── Initiative #1363 (dashboard-foundation)
│   ├── Feature #1367 ← Sandbox A takes this
│   ├── Feature #1368 ← Sandbox B takes this
│   ├── Feature #1369 ← Next available sandbox takes this
│   └── Feature #1370
├── Initiative #1364 (activity-feed)
│   ├── Feature #1371 [blocked by #1363]
│   └── ...
└── Initiative #1365 (coaching-integration)
    └── ...
```

**Key benefits:**
- **Single command** implements all features across all initiatives
- **Automatic progress tracking** - stop and restart anytime
- **Dependency-aware** - features only run when their dependencies complete
- **Work queue pattern** - sandboxes dynamically pull next available feature

### Work Queue with Dependency Checking

Sandboxes don't get upfront feature assignments. Instead, they pull from a shared queue:

```
Feature Queue (priority order):
┌────────────────────────────────────────────────────────────────┐
│ [F1367] [F1368] [F1369] [F1370] [F1371*] [F1372*] [F1373] ... │
│    ↑       ↑                      * blocked by #1363          │
│    │       └── Sandbox B grabs this                           │
│    └────────── Sandbox A grabs this                           │
└────────────────────────────────────────────────────────────────┘
```

When a sandbox finishes a feature:
1. It asks for the next feature
2. Queue checks: Is the feature pending? Are all dependencies complete?
3. If yes → assign it. If no → check next feature in queue.

This means:
- **No idle sandboxes** - if there's unblocked work, a sandbox will pick it up
- **Dependencies respected** - blocked features wait until dependencies complete
- **Load balanced** - faster sandbox takes more work automatically

## Components

### 1. Spec Manifest Generator

**Location**: `.ai/alpha/scripts/generate-spec-manifest.ts`

Aggregates all initiatives and features under a spec into a single manifest.

**Usage**:
```bash
tsx .ai/alpha/scripts/generate-spec-manifest.ts <spec-id>
```

**Output**: `spec-manifest.json` in the spec directory with:
- All initiatives and their status
- Ordered feature queue (by initiative priority, then feature priority)
- Feature dependencies
- Progress tracking state

### 2. Spec Orchestrator

**Location**: `.ai/alpha/scripts/spec-orchestrator.ts`

TypeScript script that:
- Takes **Spec ID** (not Initiative ID)
- Creates E2B sandboxes with work queue pattern
- Sandboxes dynamically pull features when ready
- Respects feature and initiative dependencies
- Auto-resumes from where it left off

**Usage**:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts <spec-id> [options]

Options:
  --sandboxes <n>, -s   Number of sandboxes (default: 2, max: 2)
  --timeout <s>         Sandbox timeout in seconds (default: 3600)
  --dry-run             Show execution plan without running
```

**Example**:
```bash
# Preview execution plan
tsx spec-orchestrator.ts 1362 --dry-run

# Run with 2 sandboxes (default)
tsx spec-orchestrator.ts 1362

# Single sandbox mode
tsx spec-orchestrator.ts 1362 -s 1

# Re-run to continue (automatic resume)
tsx spec-orchestrator.ts 1362
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
│  1. Generate Spec Manifest                                       │
│     └─→ tsx generate-spec-manifest.ts 1362                       │
│                                                                  │
│  2. Start Orchestrator                                           │
│     └─→ tsx spec-orchestrator.ts 1362                            │
│                                                                  │
│  3. Orchestrator Actions:                                        │
│     ├─→ Create E2B sandboxes (2 by default)                      │
│     ├─→ Both sandboxes share branch: alpha/spec-1362             │
│     └─→ Sandboxes pull features from queue                       │
│                                                                  │
│  4. Work Queue Loop:                                             │
│     ├─→ Sandbox asks: "What's next?"                            │
│     ├─→ Queue finds first pending feature with deps met          │
│     ├─→ Sandbox runs: /alpha:implement <feature-id>              │
│     ├─→ On completion: update manifest, ask for next            │
│     └─→ Repeat until queue empty                                │
│                                                                  │
│  5. On Completion or Interrupt:                                  │
│     ├─→ Progress saved to spec-manifest.json                    │
│     └─→ Changes pushed to GitHub                                │
│                                                                  │
│  6. Resume (if needed):                                          │
│     └─→ Re-run same command - auto-continues from checkpoint    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Automatic Resume

The orchestrator automatically resumes from where it left off:

```bash
# First run - completes features 1-5, then interrupted
tsx spec-orchestrator.ts 1362
# Progress: 5/13 features completed

# Second run - continues from feature 6
tsx spec-orchestrator.ts 1362
# Reads spec-manifest.json, sees 5 completed, starts from 6
```

No `--resume` flag needed - the system always reads current progress.

## File Structure

```
.ai/alpha/
├── scripts/
│   ├── generate-spec-manifest.ts    # Aggregates spec into manifest
│   ├── spec-orchestrator.ts         # Main orchestration script
│   ├── generate-initiative-manifest.ts  # (Legacy - per-initiative)
│   └── alpha-orchestrator.ts        # (Legacy - per-initiative)
├── templates/
│   └── *.schema.json
└── specs/
    └── <spec-id>-Spec-<name>/
        ├── spec-manifest.json       # Spec-level manifest
        ├── research-library/
        └── <init-id>-Initiative-<name>/
            ├── initiative.md
            └── <feature-id>-Feature-<name>/
                ├── feature.md
                └── tasks.json

.claude/commands/alpha/
├── spec.md
├── initiative-decompose.md
├── feature-decompose.md
├── task-decompose.md
└── implement.md
```

## Dependency Handling

### Feature Dependencies

Features can depend on other features (tracked in `feature.md`):

```markdown
### Blocked By
- #1367 (Dashboard Page must exist first)
```

The orchestrator:
1. Extracts dependencies from `feature.md` files
2. Won't assign a feature until all dependencies are `completed`
3. Skips blocked features, assigns next available one

### Initiative Dependencies

Features can also depend on entire initiatives:

```markdown
### Blocked By
- #1363 (Requires dashboard foundation initiative complete)
```

When initiative #1363 has all features completed, features blocked by it become available.

## Branch Strategy

All sandboxes work on the same spec branch:

```
Branch: alpha/spec-1362

Sandbox A ────commit────commit────push────
                                    │
Sandbox B ────commit────commit─────push────
                                    │
                                    ▼
                            alpha/spec-1362
                            (all work combined)
```

Sandboxes coordinate via git:
1. Each sandbox pulls latest before starting a feature
2. Each sandbox pushes after completing a feature
3. Sequential pushes avoid merge conflicts

## Progress Tracking

### Spec Manifest Progress

The `spec-manifest.json` tracks:
- Overall spec status
- Each initiative's status
- Each feature's status (pending/in_progress/completed/failed)
- Which sandbox is working on what
- Next feature to implement
- Last completed feature

### Feature Progress File

Inside sandbox, `.initiative-progress.json` tracks:
- Current task being executed
- Completed tasks list
- Failed tasks list
- Context usage percentage

## Error Handling

### Context Limit
When Claude Code reaches 60% context usage:
1. Current state saved
2. Session exits cleanly
3. Orchestrator marks feature as partial
4. Re-runs feature from checkpoint

### Feature Failure
When a feature fails:
1. Marked as `failed` in manifest
2. Error message recorded
3. Sandbox moves to next feature
4. Failed features can be retried on re-run

### Sandbox Timeout
E2B sandbox has configurable timeout (default 1 hour):
1. Manifest saved continuously
2. Re-run orchestrator to continue
3. Picks up from next pending feature

## Environment Variables

Required:
- `E2B_API_KEY` - E2B platform access
- `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` - Claude access

Optional:
- `GITHUB_TOKEN` - For git push

## Prerequisites

Before running the orchestrator:

1. Complete task decomposition for all features in all initiatives:
   ```bash
   /alpha:task-decompose 1363
   /alpha:task-decompose 1364
   /alpha:task-decompose 1365
   ```

2. Generate the spec manifest:
   ```bash
   tsx .ai/alpha/scripts/generate-spec-manifest.ts 1362
   ```

3. Set environment variables:
   ```bash
   export E2B_API_KEY=<your-key>
   export GITHUB_TOKEN=<your-token>
   # Claude auth auto-detected from ~/.claude/.credentials.json
   ```

## Example Run

```bash
$ tsx spec-orchestrator.ts 1362

══════════════════════════════════════════════════════════════════════
   ALPHA SPEC ORCHESTRATOR
══════════════════════════════════════════════════════════════════════

📊 Spec #1362: user dashboard home
   Initiatives: 4
   Features: 13
   Tasks: 108
   Progress: 0/13 features
   Sandboxes: 2

🎯 Next feature: #1367 - Dashboard Page & Grid Layout

📦 Creating sandbox sbx-a...
   ID: sbx_abc123
   Checking out branch: alpha/spec-1362

   ⏳ Waiting 90s before next sandbox...

📦 Creating sandbox sbx-b...
   ID: sbx_def456
   Checking out branch: alpha/spec-1362

══════════════════════════════════════════════════════════════════════
   SANDBOXES READY
══════════════════════════════════════════════════════════════════════
   sbx-a: sbx_abc123
   sbx-b: sbx_def456
   Branch: alpha/spec-1362

══════════════════════════════════════════════════════════════════════
   IMPLEMENTATION
══════════════════════════════════════════════════════════════════════

   ┌── [sbx-a] Feature #1367: Dashboard Page & Grid Layout
   │   Tasks: 20
   │   Running: /alpha:implement 1367
   │   ... [implementation output] ...
   └── ✅ completed (20/20 tasks)

   ┌── [sbx-b] Feature #1368: Presentation Outline Table
   │   Tasks: 12
   │   Running: /alpha:implement 1368
   │   ... [implementation output] ...
   └── ✅ completed (12/12 tasks)

   ┌── [sbx-a] Feature #1369: Quick Actions Panel
   │   Tasks: 6
   │   ...
   └── ✅ completed (6/6 tasks)

... [continues until all features done] ...

══════════════════════════════════════════════════════════════════════
   SUMMARY
══════════════════════════════════════════════════════════════════════

📊 Results:
   Initiatives: 4/4
   Features: 13/13
   Failed: 0
   Tasks: 108/108

🌿 Branch: alpha/spec-1362
⏱️ Duration: 45 minutes

══════════════════════════════════════════════════════════════════════

✅ Spec implementation complete!
```

## Migration from Initiative-Level Orchestrator

The old `alpha-orchestrator.ts` still exists for backwards compatibility but is deprecated.

| Old (Initiative-level) | New (Spec-level) |
|------------------------|------------------|
| `tsx alpha-orchestrator.ts 1363` | `tsx spec-orchestrator.ts 1362` |
| Run per initiative | Run once per spec |
| `initiative-manifest.json` | `spec-manifest.json` |
| `--resume` flag needed | Auto-resume |
| Upfront feature assignment | Dynamic work queue |

Migrate by:
1. Generate spec manifest: `tsx generate-spec-manifest.ts <spec-id>`
2. Use new orchestrator: `tsx spec-orchestrator.ts <spec-id>`
