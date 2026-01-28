# Initiative: Presentation Table & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1864 |
| **Initiative ID** | S1864.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 5 |

---

## Description
Implement the presentation outline table widget showing user's presentations with quick-edit access, and complete the polish phase including empty states refinement, skeleton loading improvements, accessibility compliance (WCAG 2.1 AA), and E2E test coverage for the complete dashboard.

## Business Value
The presentation table provides quick access to the user's most important work products, reducing friction to resume editing. The polish phase ensures a professional, accessible experience that meets quality standards and provides confidence through automated testing.

---

## Scope

### In Scope
- [ ] Presentation Outline Table Widget with DataTable
- [ ] Sortable columns (title, type, last updated)
- [ ] Quick "Edit Outline" action buttons
- [ ] Pagination for users with many presentations
- [ ] Empty state refinement for all 7 widgets
- [ ] Skeleton loading refinement for all widgets
- [ ] Accessibility audit and WCAG 2.1 AA compliance
- [ ] Keyboard navigation verification
- [ ] Screen reader testing
- [ ] E2E test suite for dashboard load and widget interactions
- [ ] Performance validation (LCP <3s, FCP <1.5s)

### Out of Scope
- [ ] Inline outline editing (link to presentation page)
- [ ] Presentation creation from dashboard
- [ ] Bulk actions on presentations
- [ ] Advanced filtering/search
- [ ] Visual regression testing (manual review sufficient for v1)

---

## Dependencies

### Blocks
- None (final initiative)

### Blocked By
- S1864.I1: Dashboard Foundation (requires grid layout)
- S1864.I2: Progress & Assessment Widgets (for empty state patterns)
- S1864.I3: Activity & Task Widgets (for empty state patterns)
- S1864.I4: Coaching Integration (for empty state patterns)

### Parallel With
- None (polish phase should run after other widgets are complete)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Medium | DataTable integration, accessibility audit |
| External dependencies | Low | Uses existing components |
| Unknowns | Low | Clear requirements, existing patterns |
| Reuse potential | High | DataTable patterns, E2E test utilities |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Presentation Table Widget**: DataTable with columns (title, type, updated_at), edit buttons, pagination
2. **Empty States Polish**: Consistent empty state design and messaging across all 7 widgets
3. **Accessibility Compliance**: Keyboard navigation, ARIA labels, color contrast, screen reader support
4. **E2E Dashboard Tests**: Page load test, widget render tests, interaction tests, performance assertions

### Suggested Order
1. Presentation Table Widget (complete the widget set)
2. Empty States Polish (unified experience)
3. Accessibility Compliance (quality assurance)
4. E2E Dashboard Tests (validation and regression prevention)

---

## Validation Commands
```bash
# Verify table widget renders
curl -s http://localhost:3000/home | grep -q "PresentationTableWidget"

# Run accessibility audit
pnpm --filter web-e2e test:a11y

# Run E2E tests
pnpm --filter web-e2e test:dashboard

# Performance check
lighthouse http://localhost:3000/home --only-categories=performance
```

---

## Related Files
- Spec: `../spec.md`
- DataTable: `packages/ui/src/makerkit/data-table.tsx`
- EmptyState: `packages/ui/src/makerkit/empty-state.tsx`
- Building blocks table: `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql`
- E2E directory: `apps/e2e/`
- Features: `./S1864.I5.F*-Feature-*/` (created in next phase)
