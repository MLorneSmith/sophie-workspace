# Command Reorganization Proposal

*Date: 2025-09-17*

## Current Problem

You're right - the `/feature/*` commands are confusing because they mix different workflow phases under one namespace. The original CCPM had a clearer separation.

---

## Original CCPM Structure

```bash
/pm/prd-*    # Product Requirements (Specification)
/pm/epic-*   # Epic Management (Feature-level)
/pm/issue-*  # Issue/Task Management (Task-level)
```

Three clear entity types, each with their own commands.

---

## Our Current Structure (Confusing)

```bash
/feature/spec       # PRD creation
/feature/discover   # PRD research
/feature/plan       # Epic planning
/feature/analyze    # Epic analysis
/feature/decompose  # Epic → Issues breakdown
/feature/sync       # Issue creation
/feature/start      # Issue execution
/feature/status     # Issue monitoring
/feature/update     # Issue updates
```

Everything mixed under `/feature/*` - no clear separation between specification, planning, and execution.

---

## Recommendation: Sequential Numbered Workflow

### Option 1: **NUMBERED SEQUENCE** (Recommended) ⭐

Make the workflow order crystal clear with numbered prefixes:

```bash
# Phase 1: Specification
/feature/1-spec        # Define what to build
/feature/1-discover    # Research and explore (optional)

# Phase 2: Planning
/feature/2-plan        # Technical approach
/feature/2-analyze     # Parallelization analysis (optional)

# Phase 3: Breakdown
/feature/3-decompose   # Break into tasks
/feature/3-sync        # Push to GitHub

# Phase 4: Execution
/feature/4-start       # Launch parallel execution
/feature/4-status      # Check progress
/feature/4-update      # Update GitHub (optional)
```

**Benefits:**

- ✅ Order is immediately obvious
- ✅ No need to remember sequence
- ✅ Keeps existing `/feature` namespace
- ✅ Minimal code changes required
- ✅ Users can see workflow at a glance

**Usage becomes intuitive:**

```bash
/feature/1-spec my-feature
/feature/2-plan my-feature
/feature/3-decompose my-feature
/feature/3-sync my-feature
/feature/4-start my-feature
```

---

### Option 2: **ENTITY-BASED** (Like Original CCPM)

Separate by entity type like the original:

```bash
# Specification Commands
/spec/new           # Create specification (was /feature/spec)
/spec/discover      # Research phase (was /feature/discover)

# Feature/Epic Commands
/feature/plan       # Plan implementation
/feature/analyze    # Analyze parallelization

# Task Commands
/task/decompose     # Break down into tasks (was /feature/decompose)
/task/sync          # Push to GitHub (was /feature/sync)
/task/start         # Start execution (was /feature/start)
/task/status        # Check status (was /feature/status)
/task/update        # Update GitHub (was /feature/update)
```

**Benefits:**

- ✅ Clear entity separation
- ✅ Similar to original CCPM
- ✅ Each namespace has focused purpose

**Drawbacks:**

- ❌ More namespaces to remember
- ❌ Workflow order not obvious
- ❌ More code changes required

---

### Option 3: **VERB-FIRST WORKFLOW**

Use action verbs that imply order:

```bash
/define <feature>     # Specification (was /feature/spec)
/research <feature>   # Discovery (was /feature/discover)
/design <feature>     # Planning (was /feature/plan)
/analyze <feature>    # Analysis (was /feature/analyze)
/breakdown <feature>  # Decompose (was /feature/decompose)
/publish <feature>    # Sync to GitHub (was /feature/sync)
/execute <feature>    # Start (was /feature/start)
/monitor <feature>    # Status (was /feature/status)
```

**Benefits:**

- ✅ Natural language feel
- ✅ Each command is self-explanatory

**Drawbacks:**

- ❌ Order still not obvious
- ❌ Breaks existing muscle memory
- ❌ Major refactoring needed

---

## Recommended Implementation Plan

### Go with Option 1: Numbered Sequence

**Phase 1: Add Numbers (Immediate)**

```bash
# Simple rename in .claude/commands/feature/
mv spec.md 1-spec.md
mv discover.md 1-discover.md
mv plan.md 2-plan.md
mv analyze.md 2-analyze.md
mv decompose.md 3-decompose.md
mv sync.md 3-sync.md
mv start.md 4-start.md
mv status.md 4-status.md
mv update.md 4-update.md
```

**Phase 2: Update Commands (30 minutes)**

- Update frontmatter in each file
- Keep backward compatibility aliases
- Update command inventory

**Phase 3: Documentation (15 minutes)**

- Update CLAUDE.md
- Update workflow documentation
- Add quick reference card

---

## Quick Reference Card (After Reorganization)

```
┌─────────────────────────────────────────┐
│       FEATURE WORKFLOW COMMANDS         │
├─────────────────────────────────────────┤
│ PHASE 1: SPECIFICATION                  │
│   /feature/1-spec <name>    [REQUIRED]  │
│   /feature/1-discover <name> [OPTIONAL] │
│                                         │
│ PHASE 2: PLANNING                       │
│   /feature/2-plan <name>    [REQUIRED]  │
│   /feature/2-analyze <name>  [OPTIONAL] │
│                                         │
│ PHASE 3: BREAKDOWN                      │
│   /feature/3-decompose <name> [REQUIRED]│
│   /feature/3-sync <name>     [REQUIRED] │
│                                         │
│ PHASE 4: EXECUTION                      │
│   /feature/4-start <name>   [REQUIRED]  │
│   /feature/4-status <name>  [ANYTIME]   │
│   /feature/4-update <name>  [OPTIONAL]  │
└─────────────────────────────────────────┘
```

---

## Alternative: Minimal Change

If you prefer minimal disruption, just add a "workflow helper":

```bash
/feature/workflow    # Interactive guide that shows the order
```

This command would output:

```
Feature Workflow Steps:
1. /feature/spec <name>      - Define what to build
2. /feature/plan <name>      - Design how to build
3. /feature/decompose <name> - Break into tasks
4. /feature/sync <name>      - Push to GitHub
5. /feature/start <name>     - Execute in parallel

Optional commands:
- /feature/discover <name>   - Research (use after spec)
- /feature/analyze <name>    - Check parallelization (use after plan)
- /feature/status <name>     - Check progress (use after start)
- /feature/update <name>     - Update GitHub (use anytime)
```

---

## My Recommendation

**Go with Option 1: Numbered Sequence** because:

1. **Zero ambiguity** - Numbers make order crystal clear
2. **Minimal disruption** - Keeps `/feature` namespace
3. **Self-documenting** - No need to remember order
4. **Quick to implement** - Just rename files
5. **Backward compatible** - Can keep old names as aliases

The numbered approach solves your main pain point (remembering order) while keeping the implementation simple.

Would you like me to implement this reorganization?
