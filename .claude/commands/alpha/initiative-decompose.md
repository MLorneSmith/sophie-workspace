---
description: Decompose a coding project specification (spec) into a set of initiatives. This is the second step in our 'Alpha' autonomous coding process
argument-hint: [spec-#]
model: opus
allowed-tools: [Read, Write, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Alpha: Initiative Decomposition

Decompose the provided project specification into a set of initiatives. These initiatives will be decomposed further into features and atomic tasks in subsequent Alpha workflow steps.

## Context

The Alpha autonomous coding process:
1. **Spec** - Capture project specification
2. **Initiatives** (this command) - Break spec into major initiatives (2-8 weeks each)
3. **Features** - Decompose each initiative into vertical slices (3-10 days each)
4. **Tasks** - Break features into atomic implementable tasks (2-8 hours each)
5. **Implement** - Execute each task in a sandboxed environment

## Decomposition Philosophy

### What is an Initiative?

An initiative is a **strategic deliverable theme** that:
- Maps to a Key Capability from the spec
- Delivers measurable business value when complete
- Can be demonstrated to stakeholders
- Fits within 2-8 weeks of development work
- Has clear boundaries and ownership

### Initiative Extraction Heuristics

1. **One initiative per Key Capability** - Section 5 of the spec provides these
2. **Shared infrastructure as separate initiative** - Data layers, auth, APIs
3. **External integrations as separate initiatives** - Third-party APIs deserve isolation
4. **High-risk areas as separate initiatives** - Unknown complexity gets its own track
5. **Target 3-9 initiatives per spec** - Fewer = spec too small; more = split the spec

### Initiative Validation Criteria

Each initiative MUST satisfy:

| Criterion | Question |
|-----------|----------|
| **Valuable** | Does it deliver business value when shipped alone? |
| **Bounded** | Is scope clearly defined (in AND out)? |
| **Sized** | Does it fit within 2-8 weeks? |
| **Demoable** | Can we show stakeholders upon completion? |
| **Independent** | Can it proceed without blocking on other initiatives? |

## Instructions

You are a **Strategic Decomposer** breaking a project specification into well-bounded initiatives.

### Step 1: Read the Templates

Read both templates to understand required structures:
```bash
cat .ai/alpha/templates/initiative.md
cat .ai/alpha/templates/initiative-overview.md
```

### Step 2: Read the Spec

If the GitHub issue number was provided as [spec-#], fetch the issue:

```bash
gh issue view <spec-#> --repo MLorneSmith/2025slideheroes
```

If no issue number provided, ask the user:
```
AskUserQuestion: "What is the GitHub issue number for the spec you want to decompose?"
```

Also read the local spec file if it exists:
```bash
# Find the spec directory
SPEC_DIR=$(ls -d .ai/alpha/specs/<spec-#>-* 2>/dev/null | head -1)

# Read the spec document
cat ${SPEC_DIR}/spec.md
```

### Step 3: Extract Key Capabilities

From the spec, identify:

1. **Key Capabilities** (Section 5) - These are primary initiative candidates
2. **Decomposition Hints** (Section 10) - Author-suggested initiative structure
3. **Technical Dependencies** (Section 7) - Infrastructure that may need its own initiative
4. **High-Risk Areas** (Section 8) - Complexity that deserves isolation

Create a working list of candidate initiatives.

### Step 4: Explore the Codebase

Use the Task tool with `subagent_type=code-explorer` to understand existing patterns:

1. **Architecture exploration**: Project structure, conventions, shared utilities
2. **Domain exploration**: Similar features already implemented
3. **Data model exploration**: Relevant database tables and schemas
4. **Integration points**: Existing APIs and external dependencies

Launch multiple explorers in parallel:
```
Task tool with subagent_type=code-explorer
prompt: "Explore how <capability-area> is currently implemented in this codebase.
        Find: existing components, data loaders, database tables, and patterns to reuse."
```

### Step 5: Apply Decomposition Decision Tree

For each candidate initiative, validate:

```
1. Does it map to a Key Capability or critical infrastructure?
   NO  → Merge with related initiative or demote to feature
   YES → Continue

2. Does it deliver standalone business value?
   NO  → It's a supporting feature, not an initiative → Merge or reframe
   YES → Continue

3. Is scope bounded (clear in/out)?
   NO  → Define explicit boundaries before proceeding
   YES → Continue

4. Does it fit 2-8 weeks?
   < 2 weeks → Demote to feature level
   > 8 weeks → Split using SPIDR patterns (below)
   2-8 weeks → Valid initiative size

5. Are dependencies on other initiatives explicit?
   NO  → Document blockers/dependencies
   YES → Ready for feature decomposition
```

### Step 6: Apply SPIDR Splitting (if needed)

When an initiative is too large (>8 weeks), split using:

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **S**pikes | Unknown complexity | "Spike: Evaluate Cal.com API" before "Coaching Integration" |
| **P**aths | Multiple workflows | "Basic Dashboard" vs "Advanced Analytics Dashboard" |
| **I**nterfaces | Platform differences | "Mobile Dashboard" vs "Desktop Dashboard" |
| **D**ata | Data variations | "User Dashboard" vs "Team Dashboard" |
| **R**ules | Business logic branches | "Free Tier Features" vs "Pro Tier Features" |

### Step 7: Determine Initiative Order

Apply priority rules:

1. **Infrastructure before features** - Data layers, auth, shared utilities first
2. **Dependencies unblock dependents** - If B needs A, A comes first
3. **High-value, low-risk early** - Quick wins build momentum
4. **Spikes before unknowns** - Research tasks precede implementation
5. **External integrations can parallel** - Often independent tracks

Create a dependency graph:
```
Initiative A (Data Layer)
    ↓ blocks
Initiative B (Course Progress Card) ──┬── parallel ──┬── Initiative C (Kanban Card)
                                      │              │
                                      └──────────────┘
    ↓ blocks
Initiative D (Dashboard Integration)
```

### Step 8: Create Initiative Documents

For each initiative, create a subdirectory inside the spec directory:

```bash
# Get the spec directory path
SPEC_DIR=$(ls -d .ai/alpha/specs/<spec-#>-* 2>/dev/null | head -1)

# Create initiative subdirectory (initially with pending- prefix)
mkdir -p ${SPEC_DIR}/pending-<initiative-slug>
```

Create an `initiative.md` file in each subdirectory using the template from `.ai/alpha/templates/initiative.md`. Fill in ALL sections - no placeholders.

**Key fields to populate:**
- **Metadata**: Parent spec, initiative ID, status, estimated weeks, priority
- **Description**: 2-3 sentences of what this delivers
- **Business Value**: Why this matters
- **Scope**: Explicit in/out boundaries
- **Dependencies**: Blocks, blocked by, parallel with
- **Complexity Assessment**: Rate all four factors
- **Feature Hints**: Candidate features and suggested order
- **Validation Commands**: How to verify completion

### Step 9: Create Initiative Overview

Create a master overview file (`README.md`) in the spec directory using the template from `.ai/alpha/templates/initiative-overview.md`.

```bash
# File: ${SPEC_DIR}/README.md
```

**Key sections to populate:**
- **Metadata**: Parent spec, creation date, total initiatives, estimated duration
- **Directory Structure**: Actual nested structure created
- **Initiative Summary**: Table with all initiatives, priorities, and dependencies
- **Dependency Graph**: Mermaid diagram showing relationships
- **Execution Strategy**: Phased approach with parallel tracks
- **Risk Summary**: Top risks across all initiatives
- **Next Steps**: Commands to run for feature decomposition

### Step 10: Create GitHub Issues

For each initiative, create a GitHub issue:

```bash
gh issue create \
  --repo MLorneSmith/2025slideheroes \
  --title "Initiative: [Initiative Name]" \
  --body "$(cat ${SPEC_DIR}/pending-<initiative-slug>/initiative.md)" \
  --label "type:initiative" \
  --label "status:draft" \
  --label "alpha:initiative" \
  --label "parent:<spec-#>"
```

Rename the initiative directory with the issue number:
```bash
mv ${SPEC_DIR}/pending-<initiative-slug> ${SPEC_DIR}/<init-#>-<initiative-slug>
```

### Step 11: Update Spec Issue

Link initiatives back to the parent spec:

```bash
gh issue comment <spec-#> --repo MLorneSmith/2025slideheroes --body "## Initiatives Created

This spec has been decomposed into the following initiatives:

| Initiative | Issue | Priority | Est. Weeks |
|------------|-------|----------|------------|
| [Name 1] | #XXX | 1 | X |
| [Name 2] | #YYY | 2 | Y |

**Next Step**: Run \`/alpha:feature-decompose <initiative-#>\` for each initiative."
```

## Pre-Completion Checklist

Before finalizing, verify:

- [ ] Each initiative maps to a Key Capability or critical infrastructure
- [ ] All initiatives pass the 5 validation criteria (Valuable, Bounded, Sized, Demoable, Independent)
- [ ] No initiative exceeds 8 weeks estimated effort
- [ ] Dependencies are explicitly documented
- [ ] Priority order accounts for dependencies
- [ ] High-risk areas have spike tasks or isolation
- [ ] GitHub issues created and linked to parent spec
- [ ] Initiative directories created inside spec directory
- [ ] README.md created in spec directory with initiatives overview

## Relevant Files

- `.ai/alpha/templates/initiative.md` - Initiative template (required)
- `.ai/alpha/templates/initiative-overview.md` - Overview template (required)
- `.ai/alpha/specs/` - Root directory for all specs and initiatives
- `CLAUDE.md` - Development patterns and conventions

## Validation Commands

```bash
# Get spec directory
SPEC_DIR=$(ls -d .ai/alpha/specs/<spec-#>-* 2>/dev/null | head -1)

# Verify initiative directories exist
ls -la ${SPEC_DIR}/

# Count initiatives (should be 3-9)
find ${SPEC_DIR} -maxdepth 1 -type d -name "[0-9]*" | wc -l

# Verify each initiative has initiative.md
find ${SPEC_DIR} -name "initiative.md" | wc -l

# Verify README.md exists
test -f ${SPEC_DIR}/README.md && echo "✓ README.md exists"

# Verify GitHub issues were created
gh issue list --repo MLorneSmith/2025slideheroes --label "parent:<spec-#>" --label "type:initiative"

# Verify spec was updated with comment
gh issue view <spec-#> --repo MLorneSmith/2025slideheroes --comments
```

## Spec Issue Number

$ARGUMENTS

## Report

When complete, provide:

- **Summary**: Overview of decomposition results (2-3 sentences)
- **Spec Directory**: Path to `.ai/alpha/specs/<spec-#>-<slug>/`
- **Initiatives Created**: Table with ID, directory name, issue #, priority, estimated weeks
- **Directory Structure**: Tree showing the nested structure created
- **Dependency Graph**: Visual or textual representation of initiative relationships
- **Execution Phases**: Grouped initiatives by parallel execution potential
- **Key Risks**: Top 2-3 risks identified across initiatives
- **Total Estimated Duration**: Sum of critical path, not parallel tracks
- **Next Step**: Command to run: `/alpha:feature-decompose <initiative-#>` (start with Priority 1)
