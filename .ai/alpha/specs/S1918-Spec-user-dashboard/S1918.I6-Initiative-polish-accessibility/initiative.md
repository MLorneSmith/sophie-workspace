# Initiative: Polish & Accessibility

## Metadata
| Field | Value |
|-------|-------|
| **Parent Spec** | S1918 |
| **Initiative ID** | S1918.I6 |
| **Status** | Draft |
| **Estimated Weeks** | 2 |
| **Priority** | 6 |

---

## Description
Add loading skeletons, error boundaries, accessibility compliance, and final polish to all dashboard widgets. This ensures a production-ready user experience with proper feedback for all widget states.

## Business Value
Polish and accessibility ensure the dashboard feels professional and is usable by all users. Loading states prevent perceived slowness; error handling prevents frustration; accessibility ensures legal compliance and broader reach.

---

## Scope

### In Scope
- [x] Loading skeletons for all 7 widgets
- [x] Error boundaries with friendly recovery UI
- [x] Accessibility audit (keyboard navigation, ARIA labels, focus management)
- [x] Reduced motion support for chart animations
- [x] Empty state refinement across all widgets
- [x] Final visual polish (spacing, alignment, transitions)
- [x] E2E tests for dashboard rendering

### Out of Scope
- [ ] Widget implementations (I3, I4, I5)
- [ ] Performance optimization beyond loading states
- [ ] Analytics/tracking implementation

---

## Dependencies

### Blocks
- None (final initiative)

### Blocked By
- S1918.I1: Dashboard Foundation (needs base page)
- S1918.I2: Data Layer (needs loader for error states)
- S1918.I3: Progress Widgets (needs widgets to polish)
- S1918.I4: Activity & Task Widgets (needs widgets to polish)
- S1918.I5: Coaching Integration (needs widget to polish)

### Parallel With
- None (depends on all other initiatives)

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Technical complexity | Low | Standard patterns for skeletons/errors |
| External dependencies | Low | No external APIs |
| Unknowns | Low | Well-documented accessibility patterns |
| Reuse potential | High | Skeleton/error patterns reusable |

---

## Feature Hints
> Guidance for the next decomposition phase

### Candidate Features
1. **Loading Skeletons**: Skeleton components matching widget layouts
2. **Error Boundaries**: Error UI with retry functionality
3. **Accessibility Compliance**: ARIA labels, keyboard nav, focus management
4. **E2E Tests**: Playwright tests for dashboard scenarios

### Suggested Order
1. Loading skeletons (improves perceived performance immediately)
2. Error boundaries (handles failure gracefully)
3. Accessibility compliance (audit and fix issues)
4. E2E tests (validates entire flow)

---

## Validation Commands
```bash
# Check skeleton components exist
grep -r "Skeleton" apps/web/app/home/\(user\)/_components/*.tsx | head -5

# Run accessibility check (manual lighthouse audit)
# pnpm dev → navigate to /home → run Lighthouse accessibility audit

# Run E2E tests
pnpm --filter web-e2e test:e2e -- --grep "dashboard"

# Type check
pnpm typecheck
```

---

## Related Files
- Spec: `../spec.md`
- Features: `./<feature-#>-<slug>/` (created in next phase)
- Reference: `packages/ui/src/shadcn/skeleton.tsx`
- Reference: `.ai/alpha/specs/S1918-Spec-user-dashboard/research-library/perplexity-dashboard-ux.md`
