# Initiative: Presentation Table & Polish

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1823 |
| **Initiative ID** | S1823.I5 |
| **Status** | Draft |
| **Estimated Weeks** | 2-3 |
| **Priority** | 5 |

---

## Description
Implement the Presentation Outline Table widget and complete dashboard polish including empty states for all widgets, accessibility compliance (WCAG 2.1 AA), and E2E test coverage. This initiative brings the dashboard to production-ready quality with comprehensive testing and UX completeness.

## Business Value
Provides users with a complete view of their presentation outlines and ensures the dashboard is accessible, tested, and polished. Empty states guide new users to first actions. Accessibility compliance ensures the platform is usable by all learners. E2E tests provide regression protection.

---

## Scope

### In Scope
- [x] Presentation Outline Table with title, audience, last updated, edit link
- [x] Empty states for all 7 widgets with appropriate CTAs
- [x] WCAG 2.1 AA accessibility compliance (color contrast, keyboard navigation, ARIA labels)
- [x] E2E tests covering happy path and empty states
- [x] Performance validation (LCP < 1.5s, CLS < 0.1)
- [x] "New Presentation" CTA in table widget
- [x] axe-core accessibility audit integration

### Out of Scope
- [ ] Presentation preview/editing from dashboard
- [ ] Sorting/filtering table columns
- [ ] Pagination (show all presentations)
- [ ] Dark mode optimizations (v2)

---

## Dependencies

### Blocks
- None (final initiative)

### Blocked By
- S1823.I1 (needs grid layout)
- S1823.I2 (needs widgets for empty state patterns)
- S1823.I3 (needs widgets for empty state patterns)
- S1823.I4 (needs widget for empty state patterns)

### Parallel With
- None (depends on all prior initiatives)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Standard table component, existing patterns |
| External dependencies | Low | Internal DB queries only |
| Unknowns | Low | Table patterns established, a11y tools known |
| Reuse potential | High | `DataTable`, `EmptyState` components exist |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Presentation Table Widget**: Query building_blocks_submissions, display in DataTable with actions
2. **Empty States for All Widgets**: Design and implement contextual empty states with CTAs
3. **Accessibility Compliance**: axe-core audit, keyboard navigation, ARIA labels, color contrast
4. **E2E Dashboard Tests**: Playwright tests for happy path, empty states, responsive behavior

### Suggested Order
1. Presentation Table Widget (completes widget set)
2. Empty States (UX completeness)
3. Accessibility Compliance (a11y audit)
4. E2E Dashboard Tests (regression protection)

---

## Validation Commands
```bash
# Verify table renders
curl -s http://localhost:3000/home | grep -q "presentation\|outline"

# Run accessibility audit
pnpm --filter web-e2e test:a11y -- --grep "dashboard"

# Run E2E tests
pnpm --filter web-e2e test:shard1 -- --grep "dashboard"

# Performance audit
pnpm --filter web build && npx lighthouse http://localhost:3000/home --output=json | jq '.audits["largest-contentful-paint"].numericValue'
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Presentations Table: `migrations/20250211000000_web_create_building_blocks_submissions.sql`
- DataTable Component: `packages/ui/src/makerkit/data-table.tsx`
- EmptyState Component: `packages/ui/src/makerkit/empty-state.tsx`
- E2E Framework: `apps/e2e/tests/`
