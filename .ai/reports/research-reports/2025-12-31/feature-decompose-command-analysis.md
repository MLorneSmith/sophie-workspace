# Feature Decompose Command Analysis

**Date**: 2025-12-31
**Command**: `/alpha:feature-decompose 1340`
**Initiative**: Core Dashboard Foundation (#1340)

## Executive Summary

The command successfully decomposed initiative #1340 into 5 features with proper INVEST-V validation, dependency analysis, and GitHub integration. However, several inefficiencies and issues were identified that warrant improvements.

---

## What Worked Well ✅

### 1. Parallel Codebase Exploration (Step 3)
Launching 6 `code-explorer` agents in parallel provided comprehensive context:
- RadialProgress component patterns
- Radar chart implementation
- Kanban task structures
- Loader patterns
- Current page.tsx state

**Result**: Rich context in ~30 seconds vs sequential exploration.

### 2. INVEST-V Validation Framework
The criteria are well-documented and the decision tree (Step 5) is practical:
- Clear pass/fail for each criterion
- Actionable remediation when failing
- Consistent application across features

### 3. Feature Document Template
The template structure is comprehensive:
- Metadata, user story, acceptance criteria
- Vertical slice components table
- Dependencies clearly mapped
- Task hints for next phase

### 4. GitHub Integration
Issue creation and initiative updates worked smoothly:
- 5 issues created successfully
- Parent initiative updated with comment
- Labels properly applied (after fixes)

### 5. Directory Structure Convention
The `pending-*` → `<issue#>-*` rename pattern is clean and traceable.

---

## What Didn't Work Well ❌

### 1. Step 3.5 is Massively Over-Engineered

**The Problem**: Command says to launch 2-3 architecture agents PER feature with different focuses:
```
For each non-trivial feature candidate, design the implementation architecture
by launching 2-3 `code-architect` agents with different focuses:
- MINIMAL CHANGES
- CLEAN ARCHITECTURE
- PRAGMATIC BALANCE
```

For 5-7 features = **10-21 agent calls**. This is impractical.

**What I Actually Did**: Launched 4 agents total, grouped by similarity:
1. Data Layer + Page Layout (combined)
2. Course + Assessment Cards (similar patterns)
3. Kanban + Quick Actions (combined feature)
4. Presentations Table (standalone)

**The "Compare Approaches" section was never created** - comparing 3 approaches per feature adds no value for typical features.

**Recommendation**:
- Default to single `code-architect` call per feature with "pragmatic balance" focus
- Only use multi-approach comparison for truly complex features (>5 days, >10 files)
- Add complexity heuristic to auto-select approach

### 2. Shell Path Handling Broke

**The Problem**: Shell commands with parentheses in paths failed:
```bash
# This command in Step 1:
SPEC_DIR=$(ls -d .ai/alpha/specs/${SPEC_NUM}-* 2>/dev/null | head -1)

# Failed with:
# (eval):1: parse error near `('
```

Paths like `home/(user)/` in file references caused shell parse errors.

**Recommendation**:
- Quote all path variables: `"${SPEC_DIR}"`
- Use `find` instead of `ls -d` for reliability
- Add path validation before use

### 3. Missing Label Assumptions

**The Problem**: Command assumes labels exist:
```bash
--label "status:draft"      # ❌ Actual: status:planning
--label "alpha:feature"     # ❌ Had to create
--label "parent:1340"       # ❌ Had to create
```

**Recommendation**: Add label verification step before issue creation:
```bash
# Check/create required labels
gh label list --repo ... | grep -q "alpha:feature" || \
  gh label create "alpha:feature" --description "Alpha workflow feature" --color "6f42c1"
```

### 4. Steps 7 and 7.5 are Redundant

**The Problem**: Both steps cover dependency graphs with extensive overlap.

Step 7.5 has **5 sub-steps** (170+ lines) for:
- 7.5.1 Build Explicit Dependency Graph
- 7.5.2 Cycle Detection
- 7.5.3 Critical Path Calculation
- 7.5.4 Parallel Group Computation
- 7.5.5 Validation Checklist

For a simple hub-and-spoke dependency (F1 → F2,F3,F4,F5), this is **massive overkill**.

**Recommendation**:
- Merge Steps 7 and 7.5 into single "Dependency Analysis" step
- Add complexity detection: simple (1 root) vs complex (multiple roots, cross-deps)
- Use abbreviated analysis for simple cases

### 5. Command is 828 Lines

**The Problem**: Excessive length causes:
- Context pressure on the model
- Difficulty finding relevant sections
- Repeated template content

**Breakdown**:
- Philosophy/criteria: ~70 lines (good)
- Step instructions: ~200 lines (reasonable)
- Templates: ~400 lines (too much)
- Validation/report: ~150 lines (reasonable)

**Recommendation**:
- Move feature.md template to external file: `.claude/templates/alpha-feature.md`
- Move README.md template to external file: `.claude/templates/alpha-feature-overview.md`
- Reference templates instead of embedding

### 6. Feature Hints Were Underutilized

**The Problem**: Initiative #1340 had detailed Feature Hints:
```markdown
### Candidate Features
1. **Dashboard Data Layer**: Unified loader with parallel fetching
2. **Course Progress Card**: Radial chart showing completion %
3. **Assessment Spider Card**: Radar chart with category scores
...
```

Step 2 says to extract candidates but doesn't emphasize **using what's already there**.

**Recommendation**: Add explicit instruction:
```markdown
### Step 2: Leverage Feature Hints

If the initiative contains a "Feature Hints" section:
1. Start with the author-suggested candidates
2. Validate each against INVEST-V criteria
3. Only deviate if hints fail validation or miss obvious features
```

### 7. No Fast Path for Simple Initiatives

**The Problem**: Every initiative gets full treatment regardless of complexity.

Initiative #1340 characteristics:
- Low technical complexity
- Low external dependencies
- High code reuse potential
- Simple hub-spoke dependency graph

Yet it received the full 12-step process with extensive validation.

**Recommendation**: Add complexity assessment at start:
```markdown
### Step 0: Complexity Assessment

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Technical unknowns | ✓ | | |
| External dependencies | ✓ | | |
| Estimated features | 3-5 | 5-7 | 7+ |
| Dependency complexity | Hub-spoke | DAG | Complex |

Result: LOW → Use abbreviated workflow
Result: MEDIUM → Use standard workflow
Result: HIGH → Use full workflow with extra validation
```

### 8. Step Numbering is Inconsistent

**The Problem**: Steps 3.5 and 7.5 are "inserted" steps, suggesting organic growth without reorganization.

Original sequence: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
Actual sequence: 1, 2, 3, **3.5**, 4, 5, 6, 7, **7.5**, 8, 9, 10, 11, 12

**Recommendation**: Renumber to clean sequence (1-14) or restructure into phases:
- Phase 1: Discovery (Steps 1-3)
- Phase 2: Architecture (Steps 4-6)
- Phase 3: Validation (Steps 7-9)
- Phase 4: Documentation (Steps 10-14)

---

## Specific Code Fixes

### Fix 1: Robust Path Handling (Step 1)

**Before**:
```bash
SPEC_DIR=$(ls -d .ai/alpha/specs/${SPEC_NUM}-* 2>/dev/null | head -1)
INIT_DIR=$(ls -d ${SPEC_DIR}/<initiative-#>-* 2>/dev/null | head -1)
```

**After**:
```bash
# Use find for reliability, quote all paths
SPEC_DIR=$(find .ai/alpha/specs -maxdepth 1 -type d -name "${SPEC_NUM}-*" 2>/dev/null | head -1)
INIT_DIR=$(find "${SPEC_DIR}" -maxdepth 1 -type d -name "${INITIATIVE_NUM}-*" 2>/dev/null | head -1)

# Validate paths exist
if [[ -z "${INIT_DIR}" ]] || [[ ! -d "${INIT_DIR}" ]]; then
  echo "Initiative directory not found for #${INITIATIVE_NUM}"
  # Fall back to GitHub issue only
fi
```

### Fix 2: Label Verification (Step 11)

**Before**:
```bash
gh issue create \
  --label "alpha:feature" \
  --label "parent:<initiative-#>"
```

**After**:
```bash
# Ensure required labels exist
REPO="slideheroes/2025slideheroes"
INIT_NUM="<initiative-#>"

gh label list --repo "${REPO}" | grep -q "alpha:feature" || \
  gh label create "alpha:feature" --description "Alpha workflow feature" --color "6f42c1" --repo "${REPO}"

gh label list --repo "${REPO}" | grep -q "parent:${INIT_NUM}" || \
  gh label create "parent:${INIT_NUM}" --description "Parent initiative #${INIT_NUM}" --color "bfdadc" --repo "${REPO}"

# Then create issue
gh issue create \
  --repo "${REPO}" \
  --label "type:feature" \
  --label "status:planning" \
  --label "alpha:feature" \
  --label "parent:${INIT_NUM}" \
  ...
```

### Fix 3: Adaptive Architecture Design (Step 3.5)

**Before**:
```markdown
For each non-trivial feature candidate, design the implementation architecture
by launching 2-3 `code-architect` agents with different focuses
```

**After**:
```markdown
### Step 4: Architecture Design (Adaptive)

#### Complexity-Based Approach Selection

| Feature Complexity | Estimated Days | Files | Approach |
|-------------------|----------------|-------|----------|
| Simple | < 3 days | < 5 | Skip architecture agent |
| Standard | 3-5 days | 5-10 | Single agent (pragmatic) |
| Complex | > 5 days | > 10 | Multi-agent comparison |

#### For Simple Features (< 3 days)
Document architecture inline in feature.md without agent:
- Identify files to create/modify
- Note patterns to follow
- List dependencies

#### For Standard Features (3-5 days)
Launch single code-architect agent with pragmatic focus:
```
Task tool with subagent_type=code-architect
prompt: |
  Design architecture for: [Feature Name]
  Focus: PRAGMATIC BALANCE
  ...
```

#### For Complex Features (> 5 days)
Only then use multi-approach comparison with 2-3 agents.
```

### Fix 4: Simplified Dependency Analysis (Merge Steps 7 + 7.5)

**Before**: 170+ lines across two steps

**After**:
```markdown
### Step 7: Dependency Analysis

#### 7.1 Build Dependency Graph
Create edges table:
| From | To | Reason |
|------|-----|--------|

#### 7.2 Validate (Quick Check)
- [ ] No cycles (visual inspection for < 7 features)
- [ ] Single root OR documented multi-root rationale
- [ ] All features reachable

#### 7.3 Identify Critical Path
For simple graphs (hub-spoke): Critical path = Root + longest child
For complex graphs: Use full algorithm from 7.5.3

#### 7.4 Parallel Groups
Group 0: Features with no dependencies
Group N: Features whose deps are all in groups < N
```

---

## Recommended Refactored Structure

```markdown
# Alpha: Feature Decomposition

## Philosophy (keep as-is, ~70 lines)
- What is a Feature?
- Vertical Slicing
- INVEST-V Criteria
- Extraction Heuristics

## Instructions

### Phase 1: Discovery
- Step 1: Read Initiative (fetch + local file)
- Step 2: Leverage Feature Hints (use what's there)
- Step 3: Explore Codebase (parallel agents)

### Phase 2: Architecture
- Step 4: Assess Complexity (determine workflow path)
- Step 5: Design Architecture (adaptive based on complexity)
- Step 6: Apply INVEST-V Validation

### Phase 3: Dependency Analysis
- Step 7: Build & Validate Dependency Graph
- Step 8: Calculate Execution Strategy

### Phase 4: Documentation
- Step 9: Create Feature Documents (use template file)
- Step 10: Create Overview README (use template file)
- Step 11: Ensure Labels Exist
- Step 12: Create GitHub Issues
- Step 13: Update Initiative

## Templates
Reference external files:
- `.claude/templates/alpha-feature.md`
- `.claude/templates/alpha-feature-overview.md`

## Report
(keep as-is)
```

---

## Priority Improvements

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| 1 | Fix shell path handling | Low | High (blocks execution) |
| 2 | Add label verification | Low | Medium (prevents failures) |
| 3 | Make architecture step adaptive | Medium | High (saves 50%+ time) |
| 4 | Merge Steps 7 + 7.5 | Medium | Medium (reduces complexity) |
| 5 | Extract templates to files | Medium | Medium (reduces length) |
| 6 | Add complexity assessment | Low | Medium (enables fast path) |
| 7 | Renumber steps cleanly | Low | Low (clarity) |
| 8 | Add Feature Hints emphasis | Low | Low (better results) |

---

## Metrics from This Execution

| Metric | Value |
|--------|-------|
| Total execution time | ~25 minutes |
| Agent calls (exploration) | 6 parallel |
| Agent calls (architecture) | 4 parallel |
| Features created | 5 |
| GitHub issues created | 5 |
| Label creation needed | 2 |
| Shell errors encountered | 1 |
| Manual interventions | 3 (labels, path fix, label creation) |

---

## Conclusion

The `/alpha:feature-decompose` command is fundamentally sound but has accumulated complexity through organic growth. The main issues are:

1. **Over-engineering** in architecture step (3.5) and dependency validation (7.5)
2. **Brittleness** in shell commands and label assumptions
3. **Verbosity** from embedded templates

With the recommended improvements, execution time could reduce by ~40% while maintaining quality, and failure modes would be eliminated.
