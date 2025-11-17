# Analysis: /spec vs /feature Commands

*Date: 2025-09-17*

## Executive Summary

After analyzing the command structure, I've identified significant overlap and confusion between `/spec/*` and `/feature/*` commands. The `/spec/*` commands appear to be **orphaned** from an earlier implementation attempt and should be **deprecated or removed**.

---

## Origin Story

### Original CCPM Structure (automazeio/ccpm)

```
/pm/prd-* → Product Requirements Documents
/pm/epic-* → Epic management (features)
/pm/issue-* → Task management
```

### Our Adaptation

```
/pm/prd-* → /feature/spec (renamed & integrated)
/pm/epic-* → /feature/* (renamed as feature workflow)
NEW → /spec/* (appears to be standalone, disconnected)
```

---

## Current State Analysis

### Active Workflow (/feature/*)

**Used by our CCPM process:**

```bash
/feature/spec      # Create feature specification (replaces /pm/prd-new)
/feature/plan      # Technical implementation plan
/feature/decompose # Break into tasks
/feature/sync      # Push to GitHub
/feature/start     # Launch parallel execution
/feature/status    # Check progress
/feature/analyze   # Parallelization analysis
/feature/discover  # Feature discovery
/feature/update    # Update GitHub
```

**Evidence of Active Use:**

- Referenced in `.claude/context/systems/feature-implementation-workflow.md`
- Referenced in `.claude/context/systems/pm/ccpm-system-overview.md`
- Part of documented workflow: spec → plan → decompose → sync → start
- Creates files in `.claude/implementations/[feature]/`

### Orphaned Commands (/spec/*)

**Not part of CCPM workflow:**

```bash
/spec/create     # Technical specification creation (duplicates /feature/spec)
/spec/decompose  # Task breakdown (duplicates /feature/decompose)
/spec/execute    # Execute specs (similar to /feature/start)
/spec/validate   # Validate specifications
```

**Evidence of Being Orphaned:**

- NOT mentioned in feature-implementation-workflow.md
- NOT mentioned in ccpm-system-overview.md
- Creates files in different location (unclear where)
- Appears to be from pre-CCPM implementation attempt

---

## Key Differences & Overlaps

### Overlapping Functionality

| Function | /feature Command | /spec Command | Overlap |
|----------|-----------------|---------------|---------|
| Create specification | `/feature/spec` | `/spec/create` | **100% duplicate** |
| Break into tasks | `/feature/decompose` | `/spec/decompose` | **100% duplicate** |
| Execute tasks | `/feature/start` | `/spec/execute` | **90% duplicate** |
| Validate specs | Built into workflow | `/spec/validate` | Partial |

### Command Purpose Comparison

**`/feature/spec`:**

- Part of integrated CCPM workflow
- Creates `.claude/specs/[feature].md`
- Feeds into plan → decompose → sync pipeline
- Interactive discovery process

**`/spec/create`:**

- Standalone technical specification
- "Enterprise-grade" focus
- No clear integration with other commands
- Appears over-engineered

---

## Problems Identified

1. **User Confusion**: Two ways to create specifications with no clear distinction
2. **Maintenance Burden**: Duplicate code to maintain
3. **Workflow Fragmentation**: `/spec/*` commands don't integrate with GitHub sync
4. **Documentation Inconsistency**: Only `/feature/*` documented in guides
5. **Quality Scores**: Both `/spec/*` and some `/feature/*` commands score poorly (D grades)

---

## Recommendation: Consolidate & Simplify

### Phase 1: Immediate Actions

1. **Deprecate `/spec/*` commands** - Add deprecation notices pointing to `/feature/*`
2. **Document the decision** - Update CLAUDE.md with clear workflow
3. **Preserve any unique features** - If `/spec/validate` has unique value, integrate into `/feature/spec`

### Phase 2: Migration (Week 1)

```bash
# Redirect old commands to new ones
/spec/create → /feature/spec
/spec/decompose → /feature/decompose
/spec/execute → /feature/start
/spec/validate → Integrate validation into /feature/spec
```

### Phase 3: Cleanup (Week 2)

1. Remove `/spec/*` command files after 30-day deprecation
2. Update all documentation
3. Clean up any orphaned specification files

---

## Decision Matrix

### Keep /feature/* Only (RECOMMENDED)

**Pros:**

- ✅ Single, clear workflow
- ✅ Integrated with GitHub
- ✅ Documented and tested
- ✅ Part of CCPM system
- ✅ Reduces command count by 4

**Cons:**

- ❌ May lose some "enterprise" features from /spec/create
- ❌ Need migration path for any existing /spec usage

### Keep Both (NOT RECOMMENDED)

**Pros:**

- ✅ No breaking changes
- ✅ Flexibility for different use cases

**Cons:**

- ❌ Confusing for users
- ❌ Maintenance burden
- ❌ Duplicated functionality
- ❌ Inconsistent workflows

---

## Implementation Plan

### Immediate (Today)

```bash
# 1. Add deprecation headers to /spec/* commands
echo "# ⚠️ DEPRECATED: Use /feature/spec instead" >> .claude/commands/spec/create.md

# 2. Update command inventory
node .claude/scripts/inventories/sync-command-inventory.cjs

# 3. Document in CLAUDE.md
```

### This Week

1. Audit `/spec/validate` for unique features worth preserving
2. Integrate any valuable validation into `/feature/spec`
3. Create migration guide for users
4. Update all workflow documentation

### Next Week

1. Remove deprecated commands
2. Final documentation update
3. Announce simplification to team

---

## Conclusion

The `/spec/*` commands are **orphaned remnants** from a pre-CCPM implementation. They duplicate functionality, create confusion, and aren't part of our documented workflow.

**Recommendation**: **Remove `/spec/*` commands entirely** and focus on the integrated `/feature/*` workflow that's actively used and documented.

The only exception might be `/spec/validate` if it provides unique validation not present in the feature workflow - this should be evaluated and potentially integrated into `/feature/spec` as an optional validation phase.

---

## Quick Reference

### What We Use (KEEP)

```bash
/feature/spec       # Start here
/feature/plan       # Then plan
/feature/decompose  # Break down
/feature/sync       # Push to GitHub
/feature/start      # Execute
```

### What's Redundant (REMOVE)

```bash
/spec/create       # Duplicate of /feature/spec
/spec/decompose    # Duplicate of /feature/decompose
/spec/execute      # Duplicate of /feature/start
/spec/validate     # Evaluate for integration
```

---

*Analysis based on codebase inspection, documentation review, and CCPM source comparison*
