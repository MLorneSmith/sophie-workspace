---
description: Decompose a coding project specification (spec) into a set of initiatives. This is the second step in our 'Alpha' autonomous coding process
argument-hint: <S#|spec-#> (e.g., S1362 or 1362)
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

## Spec ID

$ARGUMENTS

**Accepted formats:**
- `S1362` - New semantic format (preferred)
- `1362` - Legacy numeric format (backward compatible)

---

## Phase 0: Pre-Flight Checks

**CRITICAL**: Before starting, verify prerequisites are met.

### 0.1 Validate Input and Parse Spec ID

```bash
# If no argument provided, ask user
```

If `$ARGUMENTS` is empty, use AskUserQuestion:
```
"What is the Spec ID you want to decompose? (e.g., S1362 or 1362)"
```

**Parse the input:**
- If input starts with `S`, extract the number (e.g., `S1362` → `1362`)
- Use the number for directory lookups (both old and new naming conventions)
- Store the semantic ID for artifact creation

```typescript
const input = '$ARGUMENTS';
const specNum = input.startsWith('S') ? input.slice(1) : input;
const specId = `S${specNum}`; // Semantic ID (e.g., S1362)
```

### 0.2 Verify Spec Exists

```bash
# Verify GitHub issue exists and has alpha:spec label
gh issue view <spec-num> --repo MLorneSmith/2025slideheroes --json labels,title
```

If the issue doesn't exist or lacks `alpha:spec` label, stop and inform the user.

### 0.3 Verify Local Spec Directory

```bash
# Find the spec directory (supports both old and new naming conventions)
SPEC_DIR=$(ls -d .ai/alpha/specs/S<spec-num>-Spec-* .ai/alpha/specs/<spec-num>-Spec-* 2>/dev/null | head -1)
test -d "${SPEC_DIR}" && echo "✓ Spec directory exists: ${SPEC_DIR}"
```

If directory doesn't exist, inform user to run `/alpha:spec` first.

### 0.4 Read ID System Documentation

Read the hierarchical ID documentation to understand naming conventions:
```
.ai/alpha/docs/hierarchical-ids.md
```

### 0.5 Read Templates

Use the Read tool (not bash cat) to read both templates:
- `.ai/alpha/templates/initiative.md`
- `.ai/alpha/templates/initiative-overview.md`

---

## Phase 1: Research & Analysis

### 1.1 Create Task Tracking

Use TodoWrite immediately to create a tracking list:
```
- [ ] Read spec and extract candidates
- [ ] Read previous research from research-library
- [ ] Explore codebase patterns
- [ ] Validate and size initiatives
- [ ] Create initiative documents with S#.I# IDs
- [ ] Update spec issue with initiatives comment
```

**Note**: No GitHub issues are created for initiatives. Only the Spec gets a GitHub issue. Initiatives use semantic IDs (S#.I#) tracked in the local filesystem.

### 1.2 Read the Spec

Use the Read tool to read the local spec file (authoritative source):
```
${SPEC_DIR}/spec.md
```

Extract from the spec:
1. **Key Capabilities** (Section 5) - Primary initiative candidates
2. **Decomposition Hints** (Section 10) - Author-suggested structure
3. **Technical Dependencies** (Section 7) - Infrastructure needs
4. **High-Risk Areas** (Section 8) - Complexity requiring isolation

### 1.3 Read Previous Research

Read all research artifacts from the spec phase to leverage existing knowledge:

```bash
# List available research files
ls -la ${SPEC_DIR}/research-library/

# Read each research file
for file in ${SPEC_DIR}/research-library/*.md; do
  echo "=== Reading: $file ==="
done
```

Use the Read tool to read each file in `${SPEC_DIR}/research-library/`:
- `context7-*.md` - Library/framework documentation findings
- `perplexity-*.md` - Best practices and industry pattern research

**Extract from research:**
1. **Technology decisions** - Libraries, frameworks, APIs already researched
2. **Best practices** - Patterns recommended for this domain
3. **Integration details** - External service requirements
4. **Risk mitigations** - Solutions to technical unknowns

This research informs initiative sizing and dependency identification.

### 1.4 Explore Codebase (Parallel)

Launch 2-3 Task agents with `subagent_type=code-explorer` in parallel:

```
Task 1: "Explore existing patterns for [primary capability]. Find: components, data loaders, database tables, reusable code."

Task 2: "Explore [secondary capability] implementation. Find: similar features, integration points, external dependencies."

Task 3: "Explore [infrastructure area]. Find: shared utilities, data models, API patterns."
```

---

## Phase 2: Decomposition

### 2.1 What Is an Initiative?

An initiative is a **shippable milestone** that:
- Delivers a major capability from the spec
- Can be demonstrated to stakeholders when complete
- Takes **2-8 weeks** to implement
- Groups related features into one cohesive work stream
- Has clear boundaries (explicit in-scope and out-of-scope)

### 2.2 Initiative Extraction Heuristics

1. **One initiative per Key Capability** - Section 5 of the spec provides these
2. **Shared infrastructure as separate initiative** - Data layers, auth, APIs
3. **External integrations as separate initiatives** - Third-party APIs deserve isolation
4. **High-risk areas as separate initiatives** - Unknown complexity gets its own track
5. **Target 3-9 initiatives per spec** - Fewer = spec too small; more = split the spec

### 2.3 Validation Decision Tree

For EACH candidate initiative, explicitly validate and document:

```
┌─────────────────────────────────────────────────────────────────┐
│ INITIATIVE: [Name]                                               │
├─────────────────────────────────────────────────────────────────┤
│ 1. Maps to Key Capability?     [ YES / NO → merge or demote ]   │
│ 2. Standalone business value?  [ YES / NO → merge or reframe ]  │
│ 3. Scope bounded (in/out)?     [ YES / NO → define boundaries ] │
│ 4. Fits 2-8 weeks?             [ X weeks → OK / split / demote ]│
│ 5. Dependencies explicit?      [ YES / NO → document them ]     │
├─────────────────────────────────────────────────────────────────┤
│ VERDICT: [ VALID INITIATIVE / DEMOTE TO FEATURE / SPLIT ]       │
└─────────────────────────────────────────────────────────────────┘
```

**Size Enforcement:**
- < 2 weeks → Demote to feature level (merge with related initiative)
- 2-8 weeks → Valid initiative size
- > 8 weeks → Apply SPIDR splitting (see 2.4)

### 2.4 SPIDR Splitting (If Needed)

When an initiative exceeds 8 weeks, split using:

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **S**pikes | Unknown complexity | "Spike: Evaluate Cal.com API" before "Coaching Integration" |
| **P**aths | Multiple workflows | "Basic Dashboard" vs "Advanced Analytics Dashboard" |
| **I**nterfaces | Platform differences | "Mobile Dashboard" vs "Desktop Dashboard" |
| **D**ata | Data variations | "User Dashboard" vs "Team Dashboard" |
| **R**ules | Business logic branches | "Free Tier Features" vs "Pro Tier Features" |

### 2.5 Determine Priority Order

Apply priority rules:
1. **Infrastructure before features** - Data layers, auth, shared utilities first
2. **Dependencies unblock dependents** - If B needs A, A comes first
3. **High-value, low-risk early** - Quick wins build momentum
4. **Spikes before unknowns** - Research tasks precede implementation
5. **External integrations can parallel** - Often independent tracks

### 2.6 Dependency Validation Phase (CRITICAL)

Before proceeding to artifact creation, validate the dependency graph.

#### 2.6.1 Build Explicit Dependency Graph

```markdown
## Initiative Dependency Graph

### Nodes (Initiatives)
| ID | Initiative | Est. Weeks | Type |
|----|------------|------------|------|
| I1 | Core Dashboard Foundation | 3 | Infrastructure |
| I2 | Activity Feed System | 2 | Feature |
| I3 | Cal.com Integration | 4 | Integration |

### Edges (Dependencies)
| From | To | Reason |
|------|-----|--------|
| I1 | I2 | Activity feed renders on dashboard |
| I1 | I3 | Coaching card displays on dashboard |
```

#### 2.6.2 Cycle Detection

**CRITICAL**: Check for circular dependencies.

```
CYCLE DETECTION:
1. For each initiative I:
   a. Traverse all paths from I
   b. If I is reached again → CYCLE DETECTED

Example Cycle (INVALID):
I1 → I2 → I3 → I1  ❌

Resolution:
- Identify false dependency
- Break by merging, extracting shared component, or redefining scope
```

If cycles detected, **STOP** and resolve before continuing.

#### 2.6.3 Critical Path Calculation

```
CRITICAL PATH ALGORITHM:
1. Find all initiatives with no dependencies (roots)
2. Calculate total path length to all reachable initiatives
3. Critical path = longest root-to-leaf path

Example:
I1 (3 weeks) → I2 (2 weeks) = 5 weeks
I1 (3 weeks) → I3 (4 weeks) = 7 weeks

Critical Path: I1 → I3 = 7 weeks
```

Document:

```markdown
## Critical Path Analysis

### Critical Path
I1 → I3

### Path Duration
| Initiative | Weeks | Cumulative |
|------------|-------|------------|
| I1: Core Dashboard | 3 | 3 |
| I3: Cal.com Integration | 4 | 7 |

### Total Duration (Critical Path)
**7 weeks** (not 9 weeks sum)

### Slack Analysis
| Initiative | Earliest Start | Latest Start | Slack |
|------------|---------------|--------------|-------|
| I1 | Week 0 | Week 0 | 0 (critical) |
| I2 | Week 3 | Week 5 | 2 weeks |
| I3 | Week 3 | Week 3 | 0 (critical) |
```

#### 2.6.4 Parallel Group Computation

```
PARALLEL GROUP ALGORITHM:
1. Group 0: Initiatives with no dependencies
2. Group N: Initiatives whose dependencies are ALL in groups < N

Example:
Group 0: [I1] - Starts immediately
Group 1: [I2, I3] - Both depend on I1, can run in parallel
```

Document:

```markdown
## Parallel Execution Groups

### Group 0: Foundation (Weeks 1-3)
| Initiative | Weeks | Dependencies |
|------------|-------|--------------|
| I1: Core Dashboard | 3 | None |

### Group 1: Features (Weeks 4-7)
| Initiative | Weeks | Dependencies |
|------------|-------|--------------|
| I2: Activity Feed | 2 | I1 |
| I3: Cal.com Integration | 4 | I1 |

### Execution Summary
| Metric | Value |
|--------|-------|
| Sequential Duration | 9 weeks |
| Parallel Duration | 7 weeks |
| Time Saved | 2 weeks (22%) |
```

#### 2.6.5 Validation Checklist

```
DEPENDENCY VALIDATION CHECKLIST:
┌─────────────────────────────────────────────────────────────────┐
│ Check                                    │ Status               │
├─────────────────────────────────────────────────────────────────┤
│ All dependencies explicitly documented   │ [ ] Pass / Fail     │
│ No circular dependencies (cycles)        │ [ ] Pass / Fail     │
│ Critical path calculated                 │ [ ] Pass / Fail     │
│ Parallel groups identified               │ [ ] Pass / Fail     │
│ Cross-spec dependencies checked          │ [ ] Pass / N/A      │
│ Execution order is logical               │ [ ] Pass / Fail     │
└─────────────────────────────────────────────────────────────────┘

IF ANY FAIL → Resolve before proceeding to Phase 3
```

---

## Phase 3: Create Artifacts

### 3.1 Create Initiative Directories with Semantic IDs

Directories use the semantic ID format `S#.I#` where the number after `I` is the **priority**:

```bash
SPEC_DIR=$(ls -d .ai/alpha/specs/S<spec-num>-Spec-* .ai/alpha/specs/<spec-num>-Spec-* 2>/dev/null | head -1)

# Create directories with semantic IDs
# S1362.I1 = Priority 1 initiative
# S1362.I2 = Priority 2 initiative, etc.
mkdir -p ${SPEC_DIR}/S<spec-num>.I1-Initiative-<initiative-slug>
mkdir -p ${SPEC_DIR}/S<spec-num>.I2-Initiative-<initiative-slug>
```

**Example directory names:**
```
S1362.I1-Initiative-dashboard-foundation/
S1362.I2-Initiative-progress-visualization/
S1362.I3-Initiative-coaching-integration/
```

### 3.2 Create Initiative Documents

Use the Write tool to create `initiative.md` in each directory.

**Required Sections** (from template):
- Metadata (Parent Spec, Initiative ID, Status, Estimated Weeks, Priority)
- Description (2-3 sentences)
- Business Value
- Scope (In Scope / Out of Scope with checkboxes)
- Dependencies (Blocks / Blocked By / Parallel With) - **Use S#.I# references**
- Complexity Assessment (4 factors rated)
- Feature Hints (Candidates + Suggested Order)
- Validation Commands

**Initiative ID Format**: `S<spec-num>.I<priority>` (e.g., `S1362.I1`)

**Dependency References**: Use full semantic IDs (e.g., `S1362.I1`) or shorthand (`I1`) within the same spec.

### 3.3 Create README Overview

Use the Write tool to create `${SPEC_DIR}/README.md` with:
- Metadata summary (using S# format for spec ID)
- Directory structure (showing S#.I# naming)
- Initiative summary table with semantic IDs
- Mermaid dependency graph (using S#.I# labels)
- Execution strategy (phases)
- Risk summary
- Next steps

---

## Phase 4: Update Spec Issue (No Individual Initiative Issues)

**IMPORTANT**: Only the Spec has a GitHub issue. Initiatives, features, and tasks use semantic IDs tracked locally.

### 4.1 Comment on Spec Issue

Post a decomposition summary to the Spec's GitHub issue:

```bash
gh issue comment <spec-num> --repo MLorneSmith/2025slideheroes --body "$(cat <<'EOF'
## [Decomposition Update] Initiatives Created

This spec has been decomposed into the following initiatives:

| ID | Name | Priority | Est. Weeks | Dependencies |
|----|------|----------|------------|--------------|
| S<spec-num>.I1 | [Name 1] | 1 | X | None |
| S<spec-num>.I2 | [Name 2] | 2 | Y | S<spec-num>.I1 |
| S<spec-num>.I3 | [Name 3] | 3 | Z | S<spec-num>.I1 |

### Directory Structure
```
.ai/alpha/specs/S<spec-num>-Spec-<slug>/
├── S<spec-num>.I1-Initiative-<slug>/
├── S<spec-num>.I2-Initiative-<slug>/
└── S<spec-num>.I3-Initiative-<slug>/
```

**Next Step**: Run `/alpha:feature-decompose S<spec-num>.I1` for Priority 1 initiative.

_Decomposed on $(date +%Y-%m-%d) by /alpha:initiative-decompose_
EOF
)"
```

---

## Phase 5: Verification

### 5.1 Pre-Completion Checklist

Verify all items before reporting completion:

#### Initiative Quality Validation
- [ ] Each initiative maps to a Key Capability or critical infrastructure
- [ ] All initiatives validated against 5 criteria (Valuable, Bounded, Sized, Demoable, Independent)
- [ ] No initiative < 2 weeks (demoted) or > 8 weeks (split)

#### Dependency Validation (CRITICAL)
- [ ] All dependencies explicitly documented using S#.I# format
- [ ] **No circular dependencies** (cycle detection passed)
- [ ] Critical path calculated and documented
- [ ] Parallel groups identified
- [ ] Cross-spec dependencies checked (if applicable)
- [ ] Execution order is logical and achievable

#### Artifact Validation
- [ ] Priority order accounts for dependencies
- [ ] Initiative directories use S#.I# naming format
- [ ] README.md created with dependency graph (using S#.I# references)
- [ ] Spec issue updated with initiatives comment

### 5.2 Verification Commands

```bash
# Count initiatives (should be 3-9) - supports both old and new naming
find ${SPEC_DIR} -maxdepth 1 -type d -name "S*.I*-Initiative-*" -o -name "[0-9]*-Initiative-*" | wc -l

# Verify each initiative has initiative.md
find ${SPEC_DIR} -name "initiative.md" | wc -l

# Verify README.md exists
test -f ${SPEC_DIR}/README.md && echo "✓ README.md exists"

# Verify semantic ID format in initiative directories
ls -d ${SPEC_DIR}/S*.I*-Initiative-* 2>/dev/null && echo "✓ Directories use S#.I# format"
```

---

## Report Format

When complete, provide this structured report:

```
## Decomposition Complete

### Summary
[2-3 sentences describing what was decomposed]

### Spec Info
- **Spec ID**: S<spec-num>
- **Spec Directory**: `.ai/alpha/specs/S<spec-num>-Spec-<slug>/`
- **GitHub Issue**: #<spec-num>

### Initiatives Created

| ID | Directory | Priority | Est. Weeks | Dependencies |
|----|-----------|----------|------------|--------------|
| S<spec-num>.I1 | `S<spec-num>.I1-Initiative-<slug>/` | 1 | X | None |
| S<spec-num>.I2 | `S<spec-num>.I2-Initiative-<slug>/` | 2 | Y | S<spec-num>.I1 |
| S<spec-num>.I3 | `S<spec-num>.I3-Initiative-<slug>/` | 3 | Z | S<spec-num>.I1 |

### Dependency Graph
[Mermaid or ASCII diagram using S#.I# labels]

### Dependency Validation
- **Cycle Detection**: Pass / Fail
- **Critical Path**: [Initiative sequence using S#.I# IDs]
- **Parallel Groups**: [Grouped by execution phase]

### Execution Phases (Parallel Groups)
- **Group 0**: [Initiatives that can start immediately]
- **Group 1**: [Initiatives that follow Group 0]
- **Group 2**: [Integration/assembly initiatives]

### Duration Analysis
| Metric | Value |
|--------|-------|
| Sequential Duration | X weeks (sum) |
| Parallel Duration | Y weeks (critical path) |
| Time Saved | Z weeks (N%) |

### Key Risks
1. [Risk 1 with mitigation]
2. [Risk 2 with mitigation]

### Next Step
Run `/alpha:feature-decompose S<spec-num>.I1` for Priority 1 / Group 0 initiative.
```

---

## Relevant Files

- `.ai/alpha/templates/initiative.md` - Initiative template
- `.ai/alpha/templates/initiative-overview.md` - Overview template
- `.ai/alpha/docs/hierarchical-ids.md` - ID system documentation
- `.ai/alpha/specs/` - Root directory for all specs and initiatives
- `CLAUDE.md` - Development patterns and conventions
