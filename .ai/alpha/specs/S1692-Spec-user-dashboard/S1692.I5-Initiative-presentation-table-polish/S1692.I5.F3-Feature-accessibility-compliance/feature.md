# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1692.I5 |
| **Feature ID** | S1692.I5.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Conduct a comprehensive WCAG 2.1 AA accessibility audit of the user dashboard, including the new Presentation Table widget. Identify and fix critical/serious violations, ensure keyboard navigation works, and validate screen reader compatibility.

## User Story
**As a** user with accessibility needs
**I want to** navigate and use the dashboard with assistive technology
**So that** I can access all features without barriers

## Acceptance Criteria

### Must Have
- [ ] Dashboard passes WCAG 2.1 AA automated tests
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works for table (Tab, Enter, Arrow keys)
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets 4.5:1 ratio for text
- [ ] Screen reader announces table structure correctly
- [ ] No critical or serious axe-core violations

### Nice to Have
- [ ] Skip link to main content
- [ ] Reduced motion support for animations
- [ ] High contrast mode compatibility

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **Testing** | E2E accessibility test suite | New |
| **UI** | ARIA attributes on table components | Modified |
| **UI** | Focus indicators CSS | Modified |
| **Documentation** | Accessibility audit report | New |

## Architecture Decision

**Approach**: Pragmatic
**Rationale**: Use existing `HybridAccessibilityTester` infrastructure from the codebase. Focus on critical/serious violations first (WCAG 2.1 AA level). Document minor violations for future sprints.

### Key Architectural Choices
1. Automated testing with axe-core via HybridAccessibilityTester
2. Manual keyboard navigation testing
3. Focus on DataTable accessibility patterns (row navigation, action buttons)

### Trade-offs Accepted
- Skip Lighthouse in CI (too slow, use axe-core only)
- Minor violations documented but not fixed this sprint
- VoiceOver/NVDA testing deferred to QA team

## Dependencies

### Blocks
- F4: E2E Dashboard Tests (validates accessibility fixes are preserved)

### Blocked By
- F1: Presentation Table Widget (needs table to test)

### Parallel With
- F2: Empty States Polish (can run in parallel after F1)

## Files to Create/Modify

### New Files
- `apps/e2e/tests/accessibility/dashboard-accessibility.spec.ts` - WCAG 2.1 AA test suite
- `.ai/reports/feature-reports/2026-01-21/accessibility-audit-report.md` - Findings and fixes

### Modified Files
- `apps/web/app/home/(user)/_components/presentations-table.tsx` - Add ARIA labels
- Potentially other dashboard components based on audit findings

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Create accessibility test file**: Set up Playwright test with HybridAccessibilityTester
2. **Run baseline audit**: Execute initial WCAG 2.1 AA scan
3. **Document violations**: List all critical/serious/moderate violations
4. **Fix critical violations**: Address ARIA labels, role attributes
5. **Fix serious violations**: Address keyboard navigation, focus indicators
6. **Fix contrast issues**: Adjust colors to meet 4.5:1 ratio
7. **Add keyboard navigation**: Implement arrow key navigation for table
8. **Retest and document**: Run final audit, document results

### Suggested Order
1. Create test → 2. Baseline → 3. Document → 4. Critical fixes → 5. Serious fixes → 6. Contrast → 7. Keyboard → 8. Retest

## Validation Commands
```bash
# Run accessibility tests
pnpm --filter web-e2e test:e2e -- --grep "accessibility"

# Manual testing checklist
# 1. Tab through entire dashboard - all elements reachable
# 2. Enter/Space activates buttons and links
# 3. Arrow keys navigate table rows
# 4. Escape closes modals
# 5. Screen reader announces content correctly
```

## Related Files
- Initiative: `../initiative.md`
- HybridAccessibilityTester: `apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts`
- DataTable: `packages/ui/src/makerkit/data-table.tsx`
- WCAG guidelines: https://www.w3.org/WAI/WCAG21/quickref/?levels=aa
