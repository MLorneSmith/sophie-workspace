# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1823.I5 |
| **Feature ID** | S1823.I5.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Ensure WCAG 2.1 AA accessibility compliance across all dashboard widgets including color contrast validation, keyboard navigation, ARIA labels, and axe-core audit integration. This ensures the platform is usable by all learners including those using assistive technologies.

## User Story
**As a** user with accessibility needs
**I want to** navigate and understand the dashboard using keyboard and screen reader
**So that** I can access all features regardless of my abilities

## Acceptance Criteria

### Must Have
- [ ] All interactive elements have visible focus indicators
- [ ] Full keyboard navigation through all widgets (Tab, Enter, Arrow keys)
- [ ] ARIA labels on all buttons and interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 large text)
- [ ] Screen reader announces widget headings and content appropriately
- [ ] No accessibility violations from HybridAccessibilityTester
- [ ] `data-testid` attributes on all interactive elements for E2E testing
- [ ] Skip link to main content (if not already present)

### Nice to Have
- [ ] Reduced motion preferences respected
- [ ] High contrast mode support
- [ ] Voice control compatibility

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ARIA labels, focus styles, semantic HTML | Modified |
| **Logic** | Keyboard event handlers | Modified |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Leverage existing a11y infrastructure
**Rationale**: Use the established HybridAccessibilityTester pattern and shadcn/ui's built-in ARIA support. Focus on custom WCAG validation and keyboard navigation rather than full axe-core (which has known false positive issues in this codebase).

### Key Architectural Choices
1. Use HybridAccessibilityTester from `apps/e2e/tests/accessibility/hybrid-a11y.ts`
2. Leverage Radix UI primitives' built-in ARIA support (Dialog, Dropdown, etc.)
3. Add `aria-label` attributes to custom interactive elements
4. Ensure focus-visible styles using Tailwind `focus-visible:` prefix
5. Use semantic HTML (`<main>`, `<section>`, `<nav>`, `<article>`)

### Trade-offs Accepted
- Skip Lighthouse audit in CI (known Chrome launcher issues)
- Skip automated contrast checks for branded elements (tracked separately)
- Focus on critical/serious violations only

## Component Strategy

| UI Element | Approach | Rationale |
|------------|----------|-----------|
| Widget cards | Add `role="region"` and `aria-label` | Screen reader announces sections |
| Tables | DataTable has built-in a11y | TanStack Table accessibility |
| Buttons | Ensure `aria-label` for icon-only | Screen reader announces action |
| Charts | Add `aria-describedby` for chart description | Charts need text alternatives |
| Links | Use semantic `<a>` elements | Built-in keyboard support |

**Components to Install**: None - infrastructure already exists

## Required Credentials
> Environment variables required for this feature to function. Extracted from research files.

None required - testing infrastructure only.

## Dependencies

### Blocks
- F4: E2E tests require accessible elements with proper test IDs

### Blocked By
- F1: Presentation table widget needs a11y attributes
- F2: Empty states need a11y attributes
- S1823.I1-I4: All widgets need to be in place for comprehensive audit

### Parallel With
- Can start on existing widgets while F1 and F2 are in progress

## Files to Create/Modify

### New Files
- `apps/e2e/tests/accessibility/dashboard-a11y.spec.ts` - Dashboard-specific a11y tests
- `apps/web/app/home/(user)/_components/skip-link.tsx` - Skip to main content link (if needed)

### Modified Files
- All widget components - Add ARIA labels and roles:
  - `course-progress-widget.tsx`
  - `assessment-widget.tsx`
  - `kanban-summary-widget.tsx`
  - `activity-feed-widget.tsx`
  - `quick-actions-panel.tsx`
  - `coaching-sessions-widget.tsx`
  - `presentation-table-widget.tsx`
- `apps/web/app/home/(user)/page.tsx` - Add landmark roles to grid sections
- Dashboard layout - Ensure proper heading hierarchy (h1 → h2 → h3)

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Audit existing widgets**: Run HybridAccessibilityTester on current dashboard
2. **Add ARIA labels**: Label all interactive elements without text
3. **Add region roles**: Mark widget cards as landmark regions
4. **Add chart descriptions**: Provide text alternatives for Recharts
5. **Verify keyboard navigation**: Tab through all interactive elements
6. **Add focus styles**: Ensure visible focus indicators on all focusables
7. **Fix heading hierarchy**: Ensure h1 > h2 > h3 cascade
8. **Add data-testid attributes**: For E2E test targeting
9. **Create a11y test spec**: Dashboard-specific accessibility tests
10. **Run full audit**: Validate no critical/serious violations

### Suggested Order
1. Audit → 2. Fix critical issues → 3. Add ARIA → 4. Keyboard nav → 5. Test spec → 6. Final audit

## ARIA Label Specifications

| Widget/Element | ARIA Pattern |
|----------------|--------------|
| Course Progress Card | `role="region" aria-label="Course progress"` |
| Assessment Card | `role="region" aria-label="Self-assessment results"` |
| Kanban Card | `role="region" aria-label="Task summary"` |
| Activity Card | `role="region" aria-label="Recent activity"` |
| Quick Actions | `role="navigation" aria-label="Quick actions"` |
| Coaching Card | `role="region" aria-label="Coaching sessions"` |
| Presentation Table | `role="region" aria-label="Presentation outlines"` |
| Edit button | `aria-label="Edit presentation: {title}"` |
| View board link | `aria-label="View full kanban board"` |

## Validation Commands
```bash
# Run accessibility audit
pnpm --filter web-e2e a11y:test

# Quick keyboard navigation test
agent-browser open http://localhost:3000/home
agent-browser snapshot -i -c  # Capture accessibility tree

# Check focus order
# Tab through page and verify logical order

# Run HybridAccessibilityTester
pnpm --filter web-e2e test -- --grep "dashboard-a11y"
```

## Related Files
- Initiative: `../initiative.md`
- A11y Tester: `apps/e2e/tests/accessibility/hybrid-a11y.ts`
- A11y Config: `apps/e2e/.axerc.json`
- A11y Docs: `.ai/ai_docs/context-docs/testing+quality/accessibility-testing.md`
