# Sophie Loop Orchestrator (Phase 6)

## Overview

The orchestrator sits above the loop runner and manages **multi-task execution**:
- Plans which tasks to work on (priority-ordered by strategic objective)
- Batches tasks for parallel execution (2-3 slots)
- Checks cross-task consistency within an initiative
- Detects escalation triggers and recommends actions

## Files

| File | Purpose |
|------|---------|
| `orchestrator.py` | Core orchestration logic (plan, batch, consistency, escalate) |
| `orchestrate.sh` | Shell wrapper for full task lifecycle |
| `loop-runner.py` | Per-task build→review loop (Phase 5) |
| `runs/plan.json` | Current execution plan |
| `runs/<task-id>/` | Per-task run artifacts |

## Workflow (Sophie Main Session)

### 1. Create a Plan
```bash
python3 orchestrator.py plan --board-id 2 --max-tasks 6 --slots 3
```
Outputs JSON with tasks sorted by objective priority, agent assignments, and personas.

### 2. Get Next Batch
```bash
python3 orchestrator.py next-batch --slots 3
```
Returns up to N tasks to run in parallel.

### 3. Run Each Task (Loop)
```bash
# Step 1: Prepare builder prompt
./orchestrate.sh run-task <task-id> <agent> [persona]
# → Outputs JSON with model, promptFile
# → Sophie spawns builder sub-agent with that prompt
# → Save builder output to runs/<task-id>/output.md

# Step 2: Review
./orchestrate.sh review-task <task-id> <agent>
# → Runs checks, prepares reviewer prompt
# → Sophie spawns reviewer sub-agent
# → Save reviewer output to runs/<task-id>/review.md

# Step 3: Verdict
./orchestrate.sh verdict <task-id>
# → PASS: task moves to mike_review
# → FAIL:iterate: re-run from step 1 (learnings appended)
# → FAIL:blocked: escalation triggered
```

### 4. Consistency Check (After Batch)
```bash
python3 orchestrator.py consistency --initiative-id 15
```
Generates a prompt for checking tone/messaging consistency across outputs.

### 5. Escalation
```bash
python3 orchestrator.py escalate --task-id 86
```
Checks for: iteration cap, review disagreements, blocked status.

## Objective Priority (Q1 2026)

| Priority | Board ID | Objective |
|----------|----------|-----------|
| 1 | 2 | 🚀 Build a Product Customers Love |
| 2 | 4 | 🤖 Build the AI Systems |
| 3 | 1 | ⚙️ Build the Business Operating System |
| 4-7 | 6,7,8,9 | Deferred objectives |

## Agent Selection

Automatic based on task keywords. Override with `--agent`:
- **coder**: implement, build, fix, debug, deploy, api
- **writer**: write, blog, article, content
- **emailer**: email, sequence, campaign
- **researcher**: research, evaluate, analyze, compare
- **designer**: design, ui, ux, mockup
- **devops**: monitor, backup, infrastructure
- **planner**: plan, strategy, roadmap

## Escalation Rules

| Trigger | Action |
|---------|--------|
| Hit iteration cap (3x default) | Block task, attach reviewer notes |
| Multiple review rounds with recurring issues | Flag for manual review |
| Task already blocked | Escalate to Mike |
