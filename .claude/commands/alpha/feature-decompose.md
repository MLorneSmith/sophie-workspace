---
description: Decompose an initiative into features (vertical slices). This is the third step in our 'Alpha' autonomous coding process
argument-hint: [initiative-#]
model: opus
allowed-tools: [Read, Write, Grep, Glob, Bash, Task, TodoWrite, AskUserQuestion]
---

# Alpha: Feature Decomposition

Decompose an initiative into vertical slice features (3-10 days each). Features will be further decomposed into atomic tasks in the next Alpha workflow step.

## Quick Reference

```
Alpha Workflow:
1. Spec → 2. Initiatives → 3. Features (this) → 4. Tasks → 5. Implement

Feature Size: 3-10 days | Target: 3-7 features per initiative
Validation: INVEST-V criteria | Output: GitHub issues + local docs
```

## Overview

```
Phase 0: Pre-flight
    │ Validate input, resolve paths, verify prerequisites
    ▼
Phase 1: Discovery
    │ Read initiative, extract candidates, explore codebase
    ▼
Phase 2: Architecture & Validation
    │ Assess complexity, design architecture, apply INVEST-V
    ▼
Phase 3: Dependency Analysis
    │ Build graph, validate cycles, define execution strategy
    ▼
Phase 4: Documentation
    │ Create feature docs, README, GitHub issues
```

## Feature Philosophy

A **vertical slice** feature:
- Delivers user-visible or developer-testable value
- Spans all layers (UI → Logic → Data) end-to-end
- Can be deployed independently
- Has clear acceptance criteria

### INVEST-V Criteria

| Criterion | Pass If |
|-----------|---------|
| **I**ndependent | No hard blockers to deploy alone |
| **N**egotiable | Approach is flexible, not prescriptive |
| **V**aluable | User/dev notices when shipped |
| **E**stimable | Confident in 3-10 day estimate |
| **S**mall | Touches fewer than 15 files |
| **T**estable | Can write E2E test proving it works |
| **V**ertical | Spans UI → Logic → Data |

### Extraction Heuristics

1. **One feature per user interaction**
2. **CRUD as separate features**
3. **Happy path before edge cases**
4. **Simple before complex**
5. **Target 3-7 features**

---

## Instructions

### Phase 0: Pre-flight Validation

Before starting decomposition, validate prerequisites and establish path constants.

#### Step 0.1: Validate Input

If no issue number provided in `$ARGUMENTS`, use AskUserQuestion to get it.

Verify the initiative issue exists:
```bash
gh issue view $ARGUMENTS --repo MLorneSmith/2025slideheroes --json number,title,state
```

If this fails, stop and inform the user the issue doesn't exist.

#### Step 0.2: Resolve Paths

Use the **Glob tool** (not bash find) to locate the initiative directory. This avoids shell escaping issues with paths containing parentheses like `(user)`.

```
Glob tool:
  pattern: .ai/alpha/specs/**/$ARGUMENTS-Initiative-*
  OR
  pattern: .ai/alpha/specs/**/$ARGUMENTS-*
```

From the Glob result, extract:
- **INIT_DIR**: The full path to the initiative directory (e.g., `.ai/alpha/specs/1362-Spec-xyz/1363-Initiative-abc`)
- **SPEC_DIR**: The parent directory (e.g., `.ai/alpha/specs/1362-Spec-xyz`)

If no local directory found, proceed with GitHub issue only and note this limitation.

#### Step 0.3: Establish Path Constants

Document these constants for use throughout the workflow (copy exact paths, don't use shell variables):

```markdown
## Path Constants (for this session)

- **REPO**: MLorneSmith/2025slideheroes
- **INIT_NUM**: [issue number from arguments]
- **INIT_DIR**: [full path from Glob result]
- **SPEC_DIR**: [parent of INIT_DIR]
- **RESEARCH_DIR**: [SPEC_DIR]/research-library
```

**Important**: Use these literal paths in all subsequent commands. Shell variables like `${INIT_DIR}` don't persist across tool calls.

#### Step 0.4: Verify GitHub CLI

Confirm gh CLI is available:
```bash
gh --version
```

If this fails, inform user that GitHub CLI is required.

#### Step 0.5: Load Templates

Read the templates that will be used for documentation:
- `.ai/alpha/templates/feature.md`
- `.ai/alpha/templates/feature-overview.md`

Keep these in context for Phase 4.

---

### Phase 1: Discovery

#### Step 1: Read the Initiative

Fetch the full GitHub issue content:
```bash
gh issue view [INIT_NUM] --repo MLorneSmith/2025slideheroes
```

Read the local initiative file using the path from Phase 0:
```
Read tool: [INIT_DIR]/initiative.md
```

If local file doesn't exist, use GitHub issue content only.

#### Step 1.5: Read Previous Research

Read all research artifacts from the spec phase to leverage existing knowledge.

List research files using bash with the literal path from Phase 0:
```bash
ls -la [SPEC_DIR]/research-library/
```

Use the **Read tool** to read each research file found:
- `context7-*.md` - Library/framework documentation findings
- `perplexity-*.md` - Best practices and industry pattern research

**Extract relevant information for this initiative:**
1. **Technology patterns** - How to implement features using researched libraries
2. **API details** - Specific endpoints, methods, or configurations needed
3. **Best practices** - Recommended patterns for this type of feature
4. **Integration guides** - How to connect with external services

This research informs feature design and architecture decisions.

#### Step 2: Extract Feature Candidates

From the initiative, identify candidates from:

1. **Feature Hints section** (if present) - Use these as starting point!
2. **In Scope checkboxes** - Each may be a feature
3. **User interactions** - Distinct actions users will perform
4. **Data operations** - CRUD operations on each entity

**Important**: If the initiative has a "Feature Hints" section with suggested features, **start with those**. Only deviate if they fail INVEST-V validation.

#### Step 3: Explore the Codebase

Launch `code-explorer` agents in parallel to understand existing patterns:

```
Task tool with subagent_type=code-explorer (launch 3-6 in parallel)

Explore areas relevant to the initiative:
- Similar features (page structure, components, loaders)
- Existing components to reuse
- Data fetching patterns
- File organization conventions
```

**Key questions to answer**:
- What existing code can we reuse?
- What patterns should we follow?
- Where should new files go?

#### Step 3.5: Conduct External Research (if needed)

After exploring the codebase, identify knowledge gaps that require external research:

**Gap Assessment:**
- [ ] Are there libraries/APIs the features will use that aren't documented in research-library?
- [ ] Are there implementation patterns not found in the codebase?
- [ ] Are there integration requirements with external services?
- [ ] Are there UI/UX patterns that need industry best practices?

**If gaps exist, launch research agents** (use literal paths from Phase 0):

```
Task tool with subagent_type=alpha-context7
prompt: |
  SPEC_DIR: [literal SPEC_DIR path]
  Initiative: [INIT_NUM] - [Initiative Name]
  Research: [Specific library/API documentation needed for features]
  Topics: [specific topics relevant to feature implementation]
  Save findings to: [SPEC_DIR]/research-library/
```

```
Task tool with subagent_type=alpha-perplexity
prompt: |
  SPEC_DIR: [literal SPEC_DIR path]
  Initiative: [INIT_NUM] - [Initiative Name]
  Research: [Specific implementation patterns or best practices needed]
  Questions: [specific questions about feature design]
  Save findings to: [SPEC_DIR]/research-library/
```

**Common feature-level research topics:**
- Component patterns (e.g., "React dashboard card patterns")
- Data fetching strategies (e.g., "real-time data with Supabase")
- UI/UX patterns (e.g., "activity feed infinite scroll best practices")
- Integration specifics (e.g., "Cal.com booking widget customization")

---

### Phase 2: Architecture & Validation

#### Step 4: Assess Complexity

Before diving into architecture, formally assess and document the initiative's complexity.

**Create a complexity assessment table with evidence:**

```markdown
## Complexity Assessment

| Factor | Rating | Evidence |
|--------|--------|----------|
| Technical unknowns | LOW/MED/HIGH | [List specific unknowns or "None - all patterns exist"] |
| External dependencies | LOW/MED/HIGH | [Count: X - list them or "None"] |
| Expected features | LOW/MED/HIGH | [Count: X features from Step 2] |
| Dependency graph | LOW/MED/HIGH | [Pattern: hub-spoke / simple DAG / complex] |
| Code reuse potential | LOW/MED/HIGH | [List reusable components from Step 3] |

**Overall Complexity**: [LOW / MEDIUM / HIGH]
**Workflow Selection**: [Abbreviated / Standard / Full]
```

**Rating Guidelines:**

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Technical unknowns | Few/none | Some | Many |
| External dependencies | None | 1-2 | 3+ |
| Expected features | 3-4 | 5-6 | 7+ |
| Dependency graph | Hub-spoke | Simple DAG | Complex |
| Code reuse potential | High | Medium | Low |

**Determine overall complexity:**
- **5 LOW** → Overall LOW
- **3+ MEDIUM or 1+ HIGH** → Overall MEDIUM
- **2+ HIGH** → Overall HIGH

**Result determines workflow**:
- **LOW complexity** → Abbreviated architecture (single agent for all features)
- **MEDIUM complexity** → Standard workflow (single agent per feature)
- **HIGH complexity** → Full workflow (multi-agent comparison for complex features)

#### Step 5: Design Architecture (Adaptive)

Based on complexity assessment:

**For LOW Complexity Initiatives:**
Group similar features and launch 2-4 `code-architect` agents covering all features:

```
Task tool with subagent_type=code-architect
prompt: |
  Design architecture for: [Feature Group Name]
  Features covered: [List 2-3 related features]
  Focus: PRAGMATIC BALANCE

  Context:
  - Feature descriptions: [from Step 2]
  - Codebase patterns: [from Step 3 exploration]
  - Constraints: [from initiative]

  Provide for EACH feature:
  - Component design and props
  - Data flow
  - Files to create/modify
  - Approach: Minimal / Pragmatic / Clean
```

**For MEDIUM Complexity:**
Launch one `code-architect` agent per feature with pragmatic focus.

**For HIGH Complexity Features Only:**
Use multi-approach comparison (Minimal vs Clean vs Pragmatic) for features that are:
- > 5 estimated days
- > 10 files touched
- Have significant unknowns

#### Step 6: Apply INVEST-V Validation

For each candidate feature, run through the decision tree:

```
1. INDEPENDENT? (can deploy alone)
   NO  → Merge with blocker or document hard dependency
   YES → Continue

2. VALUABLE? (user/dev notices)
   NO  → Demote to task (not feature)
   YES → Continue

3. ESTIMABLE? (confident 3-10 days)
   < 3 days  → Demote to task
   > 10 days → Split using patterns below
   3-10 days → Continue

4. SMALL? (< 15 files)
   NO  → Split using patterns below
   YES → Continue

5. TESTABLE? (clear acceptance)
   NO  → Define acceptance criteria first
   YES → Continue

6. VERTICAL? (spans layers)
   NO  → Expand scope to include all layers
   YES → Ready for documentation
```

**Splitting Patterns** (when feature too large):
| Pattern | Use When | Example |
|---------|----------|---------|
| Workflow Steps | Sequential actions | "View list" → "View detail" → "Edit" |
| CRUD | Multiple data ops | "Create" vs "Update" vs "Delete" |
| Happy/Edge | Core vs errors | "Display data" vs "Handle empty" |
| Simple/Complex | Basic vs advanced | "Basic table" vs "With filtering" |

---

### Phase 3: Dependency Analysis

#### Step 7: Build & Validate Dependencies

Create the dependency graph:

```markdown
## Dependency Graph

| From | To | Reason |
|------|-----|--------|
| F1 | F2 | F2 needs data from F1 |
| F1 | F3 | F3 uses F1's loader |
```

**Quick Validation Checklist**:
- [ ] No circular dependencies (if F1→F2, then F2 cannot →F1)
- [ ] Clear root feature(s) with no blockers
- [ ] All features reachable from roots

**For simple hub-spoke graphs** (one root, all others depend on it):
- Critical path = Root + longest child feature
- All children can run in parallel after root

**For complex graphs** (multiple roots or chains):
- Calculate critical path: longest dependency chain
- Group by earliest possible start (parallel groups)

#### Step 8: Define Execution Strategy

Identify parallel execution groups:

```
Group 0: Features with NO dependencies (start immediately)
Group 1: Features whose deps are ALL in Group 0
Group 2: Features whose deps are ALL in Groups 0-1
...
```

Calculate durations:
- **Sequential**: Sum of all feature days
- **Parallel**: Sum of max days per group (critical path)
- **Time saved**: Sequential - Parallel

---

### Phase 4: Documentation

#### Step 9: Create Feature Documents

For each feature, create a subdirectory and feature.md file.

Use the template loaded in Phase 0 (`.ai/alpha/templates/feature.md`) as a reference.

Create feature directories using the literal INIT_DIR path from Phase 0:
```bash
mkdir -p "[INIT_DIR]/pending-Feature-[feature-slug]"
```

Then use the Write tool to create `feature.md` in each directory.

**Required sections in feature.md**:
- Metadata (parent, ID, status, days, priority)
- Description (2-3 sentences)
- User Story (As a... I want... So that...)
- Acceptance Criteria (Must Have + Nice to Have)
- Vertical Slice Components table
- Architecture Decision (approach + rationale)
- Dependencies (blocks, blocked by, parallel with)
- Files to Create/Modify
- Task Hints (for next decomposition phase)
- Validation Commands

#### Step 10: Create Feature Overview README

Create `[INIT_DIR]/README.md` with initiative overview.

Use the template loaded in Phase 0 (`.ai/alpha/templates/feature-overview.md`) as a reference.

**Required sections**:
- Directory structure
- Feature summary table (ID, issue, priority, days, deps, status)
- Dependency graph (ASCII art)
- Parallel execution groups
- Execution summary (sequential vs parallel duration)
- INVEST-V validation summary
- Architecture decisions summary
- Next steps

#### Step 11: Create GitHub Issues

First, ensure required labels exist (use literal INIT_NUM from Phase 0):

```bash
# Check and create alpha:feature label if missing
gh label list --repo "MLorneSmith/2025slideheroes" --limit 100 | grep -q "alpha:feature" || \
  gh label create "alpha:feature" --description "Alpha workflow feature" --color "6f42c1" --repo "MLorneSmith/2025slideheroes"

# Check and create parent label if missing (replace [INIT_NUM] with actual number)
gh label list --repo "MLorneSmith/2025slideheroes" --limit 100 | grep -q "parent:[INIT_NUM]" || \
  gh label create "parent:[INIT_NUM]" --description "Parent initiative #[INIT_NUM]" --color "bfdadc" --repo "MLorneSmith/2025slideheroes"
```

Then create issues for each feature using literal paths:

```bash
gh issue create --repo "MLorneSmith/2025slideheroes" \
  --title "Feature: [Feature Name]" \
  --body "$(cat '[INIT_DIR]/pending-Feature-[feature-slug]/feature.md')" \
  --label "type:feature,status:planning,alpha:feature,parent:[INIT_NUM]"
```

After each issue is created, capture the issue number from the output URL and rename the directory:
```bash
mv "[INIT_DIR]/pending-Feature-[feature-slug]" "[INIT_DIR]/[issue-num]-Feature-[feature-slug]"
```

#### Step 12: Update Initiative Issue

Add a comment to the parent initiative with the features created (use literal INIT_NUM):

```bash
gh issue comment [INIT_NUM] --repo "MLorneSmith/2025slideheroes" --body "## Features Created

This initiative has been decomposed into the following features:

| Feature | Issue | Priority | Days | Dependencies |
|---------|-------|----------|------|--------------|
| [Name 1] | #XXX | 1 | X | None |
| [Name 2] | #YYY | 2 | Y | #XXX |

## Dependency Graph
\`\`\`
[ASCII dependency graph]
\`\`\`

## Execution Summary
- Sequential: X days
- Parallel: Y days (Z% time saved)

**Next Step**: Run \`/alpha:task-decompose <first-feature-#>\`"
```

---

## Pre-Completion Checklist

Before finalizing:

### Feature Quality
- [ ] Each feature passes all 7 INVEST-V criteria
- [ ] Each feature is a true vertical slice
- [ ] No feature exceeds 10 days
- [ ] No feature touches more than 15 files
- [ ] Acceptance criteria are specific and testable

### Dependencies
- [ ] No circular dependencies
- [ ] Critical path calculated
- [ ] Parallel groups identified

### Artifacts
- [ ] All feature directories created with feature.md
- [ ] README.md created in initiative directory
- [ ] All GitHub issues created with proper labels
- [ ] Initiative issue updated with comment

---

## Report

When complete, provide:

- **Summary**: 2-3 sentence overview of decomposition results
- **Path Constants Used**: INIT_DIR and INIT_NUM values from Phase 0
- **Complexity Assessment**: Overall rating and workflow selection
- **Features Created**: Table with Issue #, Name, Priority, Days, INVEST-V status
- **Architecture Decisions**: Approach chosen per feature (Minimal/Pragmatic/Clean)
- **Dependency Validation**: Cycle check result, critical path, parallel groups
- **Duration Analysis**: Sequential days, parallel days, time saved
- **Next Step**: `/alpha:task-decompose <first-feature-#>` command

---

## Initiative Issue Number

$ARGUMENTS
