# Hierarchical ID System for Alpha Workflow

## Overview

The Alpha autonomous coding workflow uses a hierarchical ID system (`S#.I#.F#.T#`) to uniquely identify and track work items at each level of decomposition. This system eliminates GitHub issue clutter by creating only one GitHub issue per Spec, while using semantic IDs for initiatives, features, and tasks.

## ID Format Specification

```
S1362.I1.F2.T3
│     │  │  └── Task 3
│     │  └───── Feature 2 (within Initiative 1)
│     └──────── Initiative 1 (within Spec 1362)
└────────────── Spec GitHub Issue #1362
```

### Components

| Level | Format | Description | GitHub Issue? |
|-------|--------|-------------|---------------|
| **Spec** | `S1362` | Project specification | ✅ Yes - Only level with GitHub issue |
| **Initiative** | `S1362.I1` | Strategic milestone (2-8 weeks) | ❌ No |
| **Feature** | `S1362.I1.F1` | Vertical slice (3-10 days) | ❌ No |
| **Task** | `S1362.I1.F1.T1` | Atomic work unit (2-8 hours) | ❌ No |

## Shorthand Conventions

Within a given context, prefixes can be omitted for brevity:

### Inside a Spec Context
When working within Spec `S1362`:
- `I1` refers to `S1362.I1`
- `I1.F2` refers to `S1362.I1.F2`
- `I1.F2.T3` refers to `S1362.I1.F2.T3`

### Inside an Initiative Context
When working within Initiative `S1362.I1`:
- `F2` refers to `S1362.I1.F2`
- `F2.T3` refers to `S1362.I1.F2.T3`

### Inside a Feature Context
When working within Feature `S1362.I1.F2`:
- `T3` refers to `S1362.I1.F2.T3`

### Cross-Context References
Always use fully-qualified IDs when referencing items from a different spec:
- `S1362.I1.F2` (referencing from another spec)

## Directory Naming Convention

### Spec Directories
```
.ai/alpha/specs/S1362-Spec-user-dashboard-home/
```

### Initiative Directories
```
.ai/alpha/specs/S1362-Spec-user-dashboard-home/
├── S1362.I1-Initiative-dashboard-foundation/
├── S1362.I2-Initiative-progress-visualization/
└── S1362.I3-Initiative-coaching-integration/
```

### Feature Directories
```
.ai/alpha/specs/S1362-Spec-user-dashboard-home/
└── S1362.I1-Initiative-dashboard-foundation/
    ├── S1362.I1.F1-Feature-dashboard-page-grid/
    ├── S1362.I1.F2-Feature-presentation-table/
    └── S1362.I1.F3-Feature-quick-actions-panel/
```

## Priority and Numbering

The number in the ID corresponds to the **priority** within that level:

- `I1` = Priority 1 initiative (implemented first)
- `I2` = Priority 2 initiative (implemented after I1's dependencies are met)
- `F1` = Priority 1 feature within its initiative
- `T1` = Priority 1 task within its feature

This makes the ID self-documenting - `S1362.I2.F3.T1` tells you:
- It's in Spec #1362
- It's in the 2nd priority initiative
- It's in the 3rd priority feature of that initiative
- It's the 1st task to be done in that feature

## GitHub Issue Integration

### Spec Issue
Only the Spec gets a GitHub issue. This issue serves as:
1. The single tracking point for the entire project
2. A container for all progress updates
3. The reference point for the semantic ID system

### Progress Updates via Comments
Instead of creating individual issues, progress is recorded via structured comments on the Spec issue:

#### Initiative Decomposition Comment
```markdown
## [Decomposition Update] Initiatives Created

| ID | Name | Priority | Est. Weeks | Dependencies |
|----|------|----------|------------|--------------|
| S1362.I1 | Dashboard Foundation | 1 | 2-3 | None |
| S1362.I2 | Progress Visualization | 2 | 2 | S1362.I1 |
| S1362.I3 | Coaching Integration | 3 | 4 | S1362.I1 |

_Decomposed on 2026-01-19 by /alpha:initiative-decompose_
```

#### Feature Decomposition Comment
```markdown
## [Decomposition Update] Features for S1362.I1

| ID | Name | Days | Priority | Dependencies |
|----|------|------|----------|--------------|
| S1362.I1.F1 | Dashboard Page & Grid | 4 | 1 | None |
| S1362.I1.F2 | Presentation Table | 3 | 2 | S1362.I1.F1 |
| S1362.I1.F3 | Quick Actions Panel | 2 | 3 | S1362.I1.F1 |

_Decomposed on 2026-01-19 by /alpha:feature-decompose_
```

## Dependency References

Dependencies between items use the semantic ID format:

### Within Same Initiative
```markdown
### Dependencies

#### Blocked By
- F1: Dashboard Page & Grid (provides layout container)

#### Blocks
- F3: Quick Actions Panel
```

### Cross-Initiative Dependencies
```markdown
### Dependencies

#### Blocked By
- S1362.I1: Dashboard Foundation (provides UI infrastructure)

#### Blocks
- S1362.I3.F2: Coaching Widget
```

## tasks.json Metadata

The `tasks.json` file uses semantic IDs in its metadata:

```json
{
  "metadata": {
    "feature_id": "S1362.I1.F1",
    "feature_name": "Dashboard Page & Grid Layout",
    "feature_slug": "dashboard-page-grid",
    "initiative_id": "S1362.I1",
    "spec_id": "S1362",
    "created_at": "2026-01-19T10:00:00Z",
    "complexity": {
      "score": 45,
      "level": "STANDARD",
      "target_steps": { "min": 8, "max": 12 }
    }
  },
  "tasks": [
    {
      "id": "S1362.I1.F1.T1",
      "type": "task",
      "name": "Create dashboard TypeScript types",
      "dependencies": {
        "blocked_by": [],
        "blocks": ["T2", "T3"]
      }
    },
    {
      "id": "S1362.I1.F1.T2",
      "type": "task",
      "name": "Create dashboard data loader skeleton",
      "dependencies": {
        "blocked_by": ["T1"],
        "blocks": ["T4"]
      }
    }
  ]
}
```

Note: Within the same feature, task dependencies can use shorthand (`T1`, `T2`) since the context is implicit.

## Migration Guide for Existing Specs

### Automatic Compatibility
The orchestrator and scripts support both old and new naming conventions during the transition period:

**Old Pattern (still supported):**
```
1362-Spec-user-dashboard-home/
├── 1363-Initiative-foundation/
│   └── 1367-Feature-dashboard-page/
```

**New Pattern:**
```
S1362-Spec-user-dashboard-home/
├── S1362.I1-Initiative-foundation/
│   └── S1362.I1.F1-Feature-dashboard-page/
```

### Manual Migration (Optional)
To migrate an existing spec to the new naming:

1. **Rename spec directory**:
   ```bash
   mv .ai/alpha/specs/1362-Spec-slug .ai/alpha/specs/S1362-Spec-slug
   ```

2. **Rename initiative directories**:
   ```bash
   mv S1362-Spec-slug/1363-Initiative-slug S1362-Spec-slug/S1362.I1-Initiative-slug
   ```

3. **Rename feature directories**:
   ```bash
   mv S1362.I1-Initiative-slug/1367-Feature-slug S1362.I1-Initiative-slug/S1362.I1.F1-Feature-slug
   ```

4. **Update metadata in documents**:
   - Update `initiative.md` metadata tables
   - Update `feature.md` metadata tables
   - Update `tasks.json` metadata

5. **Regenerate manifest**:
   ```bash
   tsx .ai/alpha/scripts/generate-spec-manifest.ts 1362
   ```

## Benefits

1. **Reduced GitHub Clutter**: Only 1 issue per spec instead of potentially dozens
2. **Self-Documenting IDs**: `S1362.I2.F3` immediately tells you its position in the hierarchy
3. **Stable References**: IDs don't change (unlike GitHub issue numbers which are assigned at creation)
4. **Clear Scope**: Easy to see what belongs to what
5. **Offline-Friendly**: Can work with IDs without GitHub connectivity

## Related Documentation

- `.claude/commands/alpha/spec.md` - Spec creation command
- `.claude/commands/alpha/initiative-decompose.md` - Initiative decomposition
- `.claude/commands/alpha/feature-decompose.md` - Feature decomposition
- `.claude/commands/alpha/task-decompose.md` - Task decomposition
- `.ai/alpha/docs/alpha-implementation-system.md` - System overview
