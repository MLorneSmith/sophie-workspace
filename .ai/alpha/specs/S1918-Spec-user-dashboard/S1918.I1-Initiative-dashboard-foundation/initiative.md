# Initiative: Dashboard Foundation

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1918 |
| **Initiative ID** | S1918.I1 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 1 |

---

## Description
Build the core dashboard page structure including routing, responsive grid layout, page header, and navigation integration. This initiative establishes the foundation that all widgets will be placed into.

## Business Value
Without the dashboard container, no widgets can be displayed. This unblocks all subsequent initiatives and ensures users can navigate to and view the dashboard from day one.

---

## Scope

### In Scope
- [x] Dashboard page at `/home/(user)/page.tsx` with PageHeader component
- [x] Responsive 3-row CSS Grid layout (3-3-1 pattern for desktop)
- [x] Mobile-first breakpoints (single column mobile, 2-col tablet, 3-col desktop)
- [x] Placeholder widget slots for all 7 widgets
- [x] Navigation integration (sidebar link active state)
- [x] Dark mode compatible layout

### Out of Scope
- [ ] Actual widget implementations (separate initiatives)
- [ ] Data fetching logic (I2)
- [ ] Loading skeletons for widgets (I6)
- [ ] Empty states (I6)

---

## Dependencies

### Blocks
- S1918.I2: Data Layer (needs page structure)
- S1918.I3: Progress Widgets (needs grid slots)
- S1918.I4: Activity & Task Widgets (needs grid slots)
- S1918.I5: Coaching Integration (needs grid slot)
- S1918.I6: Polish & Accessibility (needs base page)

### Blocked By
- None (foundation initiative)

### Parallel With
- None (must complete first)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | CSS Grid + existing PageHeader pattern |
| External dependencies | Low | No external APIs |
| Unknowns | Low | Well-documented patterns in codebase |
| Reuse potential | High | Can adapt from team dashboard layout |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Dashboard Page Shell**: Create page.tsx with PageHeader, metadata, i18n
2. **Responsive Grid Layout**: CSS Grid with 3-row layout and breakpoints
3. **Widget Placeholder Components**: Skeleton placeholders for each widget slot

### Suggested Order
1. Page shell (routing, header, PageBody wrapper)
2. Grid layout with responsive breakpoints
3. Placeholder components showing widget positions

---

## Validation Commands
```bash
# Verify page exists
test -f apps/web/app/home/\(user\)/page.tsx && echo "✓ Page exists"

# Check for grid classes in page
grep -q "grid" apps/web/app/home/\(user\)/page.tsx && echo "✓ Grid layout found"

# Type check
pnpm typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx`
