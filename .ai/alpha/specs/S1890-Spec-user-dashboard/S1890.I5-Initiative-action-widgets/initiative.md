# Initiative: Action Widgets

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1890 |
| **Initiative ID** | S1890.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 5 |

---

## Description
Implement the Quick Actions Panel and Presentation Outline Table widgets for the dashboard. The Quick Actions Panel displays contextual CTAs based on user state (course progress, assessment completion, drafts). The Presentation Outline Table shows a full-width table of user's presentations with "Edit Outline" actions.

## Business Value
Quick Actions drive user engagement by surfacing the most relevant next step, reducing decision fatigue. The Presentation Table provides one-click access to active work, making the dashboard a true productivity hub.

---

## Scope

### In Scope
- [x] Quick Actions Panel with 2-4 contextual buttons
- [x] Action logic based on user state (has course progress?, has assessment?, has drafts?)
- [x] Presentation Outline Table using DataTable component
- [x] Table columns: Title, Last Updated, Slides Count, Status, Actions
- [x] "Edit Outline" button linking to building blocks editor
- [x] "New Presentation" action in table footer
- [x] Responsive table (cards on mobile)

### Out of Scope
- [ ] Empty state designs (handled by I7)
- [ ] Presentation creation flow (existing feature)
- [ ] Advanced table features (sorting, filtering)
- [ ] Multiple selection/bulk actions

---

## Dependencies

### Blocks
- S1890.I7: Empty States & Polish (needs widget structure)

### Blocked By
- S1890.I1: Dashboard Foundation (needs grid layout)
- S1890.I2: Data Layer (needs state data for contextual logic)

### Parallel With
- S1890.I3: Progress Widgets
- S1890.I4: Task & Activity Widgets
- S1890.I6: Coaching Integration

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Simple conditional rendering for actions; DataTable component exists |
| External dependencies | Low | All internal data and routing |
| Unknowns | Low | Clear requirements; patterns established |
| Reuse potential | High | DataTable, Button, Card components all available |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Quick Actions Panel**: Contextual CTA buttons based on user state
2. **Presentation Outline Table**: DataTable with presentation rows
3. **Action Link Integration**: Connect buttons to existing routes

### Suggested Order
1. Quick Actions Panel (F1) - simpler conditional logic
2. Presentation Outline Table (F2) - DataTable integration
3. Action Link Integration (F3) - routing verification

---

## Validation Commands
```bash
# Verify quick actions component
test -f apps/web/app/home/\(user\)/_components/quick-actions-panel.tsx && echo "✓ Quick actions exists"

# Verify presentation table component
test -f apps/web/app/home/\(user\)/_components/presentation-table.tsx && echo "✓ Presentation table exists"

# Check for contextual logic
grep -rq "hasAssessment\|hasCourse\|hasDrafts" apps/web/app/home/\(user\)/_components/ && echo "✓ Contextual logic"

# Visual verification
pnpm --filter web-e2e test:local -- -g "dashboard actions"
```

---

## Related Files
- Spec: `../spec.md`
- DataTable: `packages/ui/src/makerkit/data-table.tsx`
- Button: `packages/ui/src/shadcn/button.tsx`
- Building blocks: `apps/web/app/home/(user)/ai/page.tsx`
- Features: `./<feature-#>-<slug>/` (created in next phase)

## Quick Action Logic
| Condition | Action | Target |
|-----------|--------|--------|
| Course not started | "Start Your Journey" | `/home/course` |
| Course in progress | "Continue Course" | `/home/course` |
| No assessment | "Take Skills Assessment" | `/home/assessment` |
| Has draft presentations | "Review Storyboard" | `/home/ai` |
| Always available | "New Presentation" | `/home/ai/new` |
