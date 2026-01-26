# Dependency Analysis: S1815 (User Dashboard)

## Overview

Analysis of S1815 spec manifest to identify opportunities for feature-level dependency optimization.

## Current State

### Initiative Structure

| Initiative | Features | Completed | Dependencies |
|------------|----------|-----------|--------------|
| S1815.I1 (Dashboard Foundation) | 4 | 3/4 | None |
| S1815.I2 (Progress/Assessment) | 2 | 0/2 | S1815.I1 (initiative-level) |
| S1815.I3 (Activity/Task Widgets) | 4 | 0/4 | S1815.I1 (initiative-level) |
| S1815.I4 (Coaching Integration) | 3 | 0/3 | S1815.I1 (initiative-level) |
| S1815.I5 (Polish/Testing) | 4 | 0/4 | S1815.I1, I2, I3, I4 (initiative-level) |

### Problem Visualization

```
Current Dependency Graph (Initiative-Level):

[I1] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 ┣━ F1 (Types/Loader) ✅                                           ┃
 ┣━ F2 (Page Shell) ✅                                             ┃
 ┣━ F3 (Grid Layout) ✅                                            ┃
 ┗━ F4 (Skeleton Loading) 🔄 <-- sbx-a                             ┃
                                                                   ┃
[I2] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BLOCKED BY I1 ━┫
 ┣━ F1 (Course Progress Widget) ⏳                                 ┃
 ┗━ F2 (Spider Chart Widget) ⏳                                    ┃
                                                                   ┃
[I3] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BLOCKED BY I1 ━┫
 ┣━ F1 (Kanban Summary) ⏳                                         ┃
 ┣━ F2 (Activity Data Aggregation) ⏳                              ┃
 ┣━ F3 (Activity Feed) ⏳                                          ┃
 ┗━ F4 (Quick Actions) ⏳                                          ┃
                                                                   ┃
[I4] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BLOCKED BY I1 ━┛
 ┣━ F1 (Cal.com Foundation) ⏳
 ┣━ F2 (Coaching Widget) ⏳
 ┗━ F3 (Session Actions) ⏳

Result: 2 of 3 sandboxes IDLE while waiting for I1.F4 to complete
```

## Optimized Feature-Level Dependencies

### Actual Dependencies Analysis

**I1 Foundation Features:**
- `S1815.I1.F1` (Types/Loader): Provides TypeScript types and data loading patterns
- `S1815.I1.F2` (Page Shell): Provides page layout container
- `S1815.I1.F3` (Grid Layout): Provides responsive grid system for widgets
- `S1815.I1.F4` (Skeleton Loading): Provides loading state components

**I2 Features - What They Actually Need:**
- `S1815.I2.F1` (Course Progress Widget): Needs types (F1) + grid placement (F3)
- `S1815.I2.F2` (Spider Chart Widget): Needs types (F1) + grid placement (F3)

**I3 Features - What They Actually Need:**
- `S1815.I3.F1` (Kanban Summary): Needs types (F1) + grid placement (F3)
- `S1815.I3.F2` (Activity Data): Needs types (F1) only (data layer)
- `S1815.I3.F3` (Activity Feed): Needs types (F1) + grid (F3) + data (I3.F2)
- `S1815.I3.F4` (Quick Actions): Needs types (F1) + grid (F3)

**I4 Features - What They Actually Need:**
- `S1815.I4.F1` (Cal.com Foundation): Needs types (F1) only
- `S1815.I4.F2` (Coaching Widget): Needs types (F1) + grid (F3) + Cal.com (I4.F1)
- `S1815.I4.F3` (Session Actions): Needs Cal.com (I4.F1) + widget (I4.F2)

### Optimized Dependency Graph

```
Optimized Feature-Level Dependencies:

[I1.F1] Types/Loader ✅
   │
   ├─────────────────────────────────────────────────────────────────┐
   │                                                                 │
[I1.F2] Page Shell ✅                                               │
   │                                                                 │
[I1.F3] Grid Layout ✅ ──────────────────────────────────────────┐  │
   │                                                              │  │
[I1.F4] Skeleton Loading 🔄                                       │  │
                                                                  │  │
[I2.F1] Course Progress ⏳ <─── Only needs F1 + F3 ──────────────┤  │
[I2.F2] Spider Chart ⏳ <─────── Only needs F1 + F3 ──────────────┤  │
                                                                  │  │
[I3.F1] Kanban Summary ⏳ <───── Only needs F1 + F3 ──────────────┤  │
[I3.F2] Activity Data ⏳ <────── Only needs F1 ────────────────────│──┘
[I3.F4] Quick Actions ⏳ <────── Only needs F1 + F3 ──────────────┤
[I3.F3] Activity Feed ⏳ <────── Needs F1 + F3 + I3.F2 ───────────┘

[I4.F1] Cal.com Foundation ⏳ <── Only needs F1 ───────────────────┐
[I4.F2] Coaching Widget ⏳ <───── Needs F1 + F3 + I4.F1 ───────────┤
[I4.F3] Session Actions ⏳ <───── Needs I4.F1 + I4.F2 ─────────────┘
```

### Impact Analysis

**Features that can start NOW (after I1.F3 completed):**
1. `S1815.I2.F1` - Course Progress Widget
2. `S1815.I2.F2` - Spider Chart Widget
3. `S1815.I3.F1` - Kanban Summary Widget
4. `S1815.I3.F2` - Activity Data Aggregation
5. `S1815.I3.F4` - Quick Actions Panel
6. `S1815.I4.F1` - Cal.com Foundation

**That's 6 features that can run in parallel instead of waiting for I1.F4!**

### Dependency Table for Manifest Update

| Feature ID | Current Dependencies | Optimized Dependencies |
|------------|---------------------|------------------------|
| S1815.I2.F1 | `["S1815.I1"]` | `["S1815.I1.F1", "S1815.I1.F3"]` |
| S1815.I2.F2 | `["S1815.I1"]` | `["S1815.I1.F1", "S1815.I1.F3"]` |
| S1815.I3.F1 | `["S1815.I1"]` | `["S1815.I1.F1", "S1815.I1.F3"]` |
| S1815.I3.F2 | `["S1815.I1"]` | `["S1815.I1.F1"]` |
| S1815.I3.F3 | `["S1815.I1", "S1815.I3.F2"]` | `["S1815.I1.F1", "S1815.I1.F3", "S1815.I3.F2"]` |
| S1815.I3.F4 | `["S1815.I1"]` | `["S1815.I1.F1", "S1815.I1.F3"]` |
| S1815.I4.F1 | `["S1815.I1"]` | `["S1815.I1.F1"]` |
| S1815.I4.F2 | `["S1815.I1", "S1815.I4.F1"]` | `["S1815.I1.F1", "S1815.I1.F3", "S1815.I4.F1"]` |
| S1815.I4.F3 | `["S1815.I1", "S1815.I4.F1", "S1815.I4.F2"]` | `["S1815.I4.F1", "S1815.I4.F2"]` |
| S1815.I5.F1 | `["S1815.I1", "S1815.I2", "S1815.I3", "S1815.I4", "S1815.I1.F1"]` | Keep (final polish needs all) |
| S1815.I5.F2-F4 | Similar initiative-level deps | Keep (polish phase needs all) |

## Root Cause

The issue stems from the manifest generation logic in `manifest.ts`:

```typescript
// Pass 3: Propagate initiative-level dependencies to features
for (const initiative of initiatives) {
  if (initiative.dependencies.length > 0) {
    for (const feature of featureQueue) {
      if (feature.initiative_id === initiative.id) {
        // This adds initiative-level deps to ALL features
        const combinedDeps = new Set([
          ...initiative.dependencies,  // <-- This is the problem
          ...feature.dependencies,
        ]);
        feature.dependencies = [...combinedDeps];
      }
    }
  }
}
```

This causes ALL features in an initiative to inherit the initiative's blockers, even when individual features only need specific upstream features.

## Solution Approach

### Option 1: Enhanced Feature Decomposition (Recommended)

Update `/alpha:feature-decompose` to:
1. Ask for specific feature dependencies, not initiative dependencies
2. Use format: `Blocked By: S1815.I1.F1, S1815.I1.F3` (specific features)
3. Only fall back to initiative-level for final polish phases

### Option 2: Manifest Generation Fix

Modify `generateSpecManifest()` to:
1. Skip initiative-level dependency propagation (remove Pass 3)
2. Trust feature.md files to specify correct dependencies
3. Add validation for dependency completeness

### Recommended Implementation

1. **Short-term**: Manually update S1815 manifest with optimized deps
2. **Medium-term**: Update feature-decompose to generate better deps
3. **Long-term**: Add dependency analyzer tool

## Estimated Impact

**Current throughput:** 1 feature at a time (2/3 sandboxes idle)
**Optimized throughput:** Up to 3 features in parallel

**Time savings estimate:**
- Remaining features: 14
- Current: ~14 sequential runs (one at a time)
- Optimized: ~5-6 parallel batches
- Estimated speedup: **60-70% reduction in wall-clock time**

---

*Analysis completed: 2026-01-26*
