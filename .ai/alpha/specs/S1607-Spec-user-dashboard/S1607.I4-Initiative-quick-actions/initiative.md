# Initiative: Quick Actions & Presentations

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1607 |
| **Initiative ID** | S1607.I4 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 4 |

---

## Description
Implement the Quick Actions Panel with contextual CTAs and the Presentation Outlines Table. Quick Actions provides intelligent suggestions based on user state (continue course, new presentation, complete assessment), while the full-width table displays all user presentations with quick "Edit Outline" actions.

## Business Value
Quick Actions reduces decision fatigue by surfacing the most relevant next action, increasing conversion rates for course completion and presentation creation. The outlines table provides instant access to in-progress work, reducing friction to continue editing.

---

## Scope

### In Scope
- [x] Quick Actions Panel with 3-4 contextual CTAs
- [x] Conditional logic for CTA display based on user state:
  - "Continue Course" (if course in progress)
  - "New Presentation"
  - "Complete Assessment" (if assessment not done)
  - "Review Storyboard" (if drafts exist)
- [x] Presentation Outlines Table (full-width, sortable)
- [x] Columns: Title, Audience, Type, Updated, Actions
- [x] "Edit Outline" button linking to outline editor
- [x] Query building_blocks_submissions for outline data
- [x] Empty states for both widgets
- [x] Loading skeletons

### Out of Scope
- [ ] Advanced table filtering/search
- [ ] Bulk actions on presentations
- [ ] Presentation deletion from dashboard
- [ ] Custom CTA configuration by users

---

## Dependencies

### Blocks
- None

### Blocked By
- S1607.I1: Dashboard Foundation & Data Layer (provides page structure and loader)

### Parallel With
- S1607.I2: Progress & Assessment Visualization
- S1607.I3: Task & Activity Awareness
- S1607.I5: Coaching Integration

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Simple conditional rendering and table |
| External dependencies | None | Data from local database |
| Unknowns | Low | Button and Table patterns well-established |
| Reuse potential | High | Existing Button, Card, Table components |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Quick Actions Panel Widget**: Contextual CTAs with state-based logic
2. **Presentation Outlines Table Widget**: Sortable table with edit actions
3. **User State Queries**: Check course progress, assessment status, drafts

### Suggested Order
1. User State Queries (determines what CTAs show)
2. Quick Actions Panel Widget (depends on state queries)
3. Presentation Outlines Table Widget (independent)

---

## Validation Commands
```bash
# Verify Quick Actions shows contextual CTAs
# Manual: New user sees "Start Course", user in course sees "Continue Course"

# Verify Outlines Table shows presentations
# Manual: Create presentation, verify it appears in table

# Verify Edit Outline links work
# Manual: Click "Edit Outline", verify navigation to editor

# TypeScript validation
pnpm --filter web typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Parent Initiative: `../S1607.I1-Initiative-dashboard-foundation/`
- Reference: `packages/ui/src/shadcn/table.tsx`
- Reference: `packages/ui/src/shadcn/button.tsx`
