# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1864.I5 |
| **Feature ID** | S1864.I5.F3 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 3 |

## Description
Ensure the complete user dashboard meets WCAG 2.1 AA compliance standards. This includes verifying keyboard navigation across all 7 widgets, adding appropriate ARIA labels, ensuring proper color contrast, and validating screen reader support for all interactive elements and data visualizations.

## User Story
**As a** user with accessibility needs
**I want to** navigate and use the dashboard with keyboard, screen reader, or other assistive technologies
**So that** I can access all dashboard features regardless of my abilities

## Acceptance Criteria

### Must Have
- [ ] All 7 widgets have proper `aria-label` or `aria-labelledby` attributes
- [ ] All interactive elements are keyboard accessible (Tab navigation)
- [ ] Focus indicators are visible (2px outline minimum)
- [ ] Charts (radial, spider) have text alternatives for screen readers
- [ ] Tables have proper header associations (`scope` attributes)
- [ ] Color contrast meets 4.5:1 ratio for text, 3:1 for UI elements
- [ ] Loading states announce to screen readers (`aria-busy`, `aria-live`)
- [ ] No keyboard traps exist (Escape key exits modals/embeds)
- [ ] Heading hierarchy is logical (H2 for widget titles)
- [ ] HybridAccessibilityTester passes with 0 critical/serious violations

### Nice to Have
- [ ] Skip link to main dashboard content
- [ ] Reduced motion support for animations
- [ ] High contrast mode support

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ARIA attributes on all widgets | New/Modified |
| **Logic** | Keyboard event handlers where needed | New/Modified |
| **Data** | None | N/A |
| **Database** | None | N/A |

## Architecture Decision

**Approach**: Pragmatic - Leverage existing Radix UI foundation with targeted enhancements
**Rationale**: Radix UI components (via ShadcnUI) already provide ARIA patterns. Focus on verifying compliance, adding missing attributes, and ensuring chart accessibility.

### Key Architectural Choices
1. Use semantic HTML elements (`<article>`, `<section>`, `<nav>`) for widgets
2. Add `aria-label` to all Card components for widget identification
3. Provide text alternatives for visual charts via `aria-describedby`
4. Use `aria-live="polite"` for dynamic content updates (activity feed, loading states)
5. Test with HybridAccessibilityTester from E2E suite

### Trade-offs Accepted
- Charts remain visual-only with text summary (not full data table alternative)
- Focus on AA compliance (not AAA)
- Screen reader testing manual (automated tools catch 30-40% of issues)

## Required Credentials
> None required

## Dependencies

### Blocks
- F4 (E2E Tests) - needs accessibility compliance for test assertions

### Blocked By
- S1864.I1 through S1864.I4 - needs all widgets implemented to audit
- S1864.I5.F1 (Presentation Table) - needs table for accessibility audit
- S1864.I5.F2 (Empty States) - needs empty states for accessibility audit

### Parallel With
- F2 (Empty States Polish) - can work on ARIA aspects while empty states are polished

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard-a11y.ts` - Shared ARIA utilities (optional)

### Modified Files
- `apps/web/app/home/(user)/_components/course-progress-widget.tsx` - Add ARIA attributes
- `apps/web/app/home/(user)/_components/assessment-spider-widget.tsx` - Add ARIA attributes and chart description
- `apps/web/app/home/(user)/_components/kanban-summary-widget.tsx` - Add ARIA attributes
- `apps/web/app/home/(user)/_components/activity-feed-widget.tsx` - Add ARIA attributes and live region
- `apps/web/app/home/(user)/_components/quick-actions-panel.tsx` - Add ARIA attributes
- `apps/web/app/home/(user)/_components/coaching-sessions-widget.tsx` - Add ARIA attributes
- `apps/web/app/home/(user)/_components/presentations-table-widget.tsx` - Verify table accessibility
- `apps/web/app/home/(user)/page.tsx` - Add landmark roles and skip link

## Component Strategy

| UI Element | Component | Source | Rationale |
|------------|-----------|--------|-----------|
| Widget containers | Card with aria-labelledby | @kit/ui/card | Semantic grouping with label |
| Charts | Recharts with aria-describedby | recharts | Text alternative for visual data |
| Tables | DataTable (inherently accessible) | @kit/ui/enhanced-data-table | TanStack Table has built-in a11y |
| Buttons | Button (already accessible) | @kit/ui/button | Radix UI handles focus |

**Components to Install**: None - all components already available

## ARIA Implementation Guide

### Widget Container Pattern
```tsx
<Card aria-labelledby={`${widgetId}-title`}>
  <CardHeader>
    <CardTitle id={`${widgetId}-title`}>Widget Title</CardTitle>
  </CardHeader>
  <CardContent aria-live="polite" aria-busy={isLoading}>
    {content}
  </CardContent>
</Card>
```

### Chart Accessibility Pattern
```tsx
<div role="img" aria-describedby="chart-description">
  <RadialBarChart ... />
  <p id="chart-description" className="sr-only">
    Course progress: 65% complete, 13 of 20 lessons finished
  </p>
</div>
```

### Loading State Pattern
```tsx
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? (
    <div role="status">
      <Spinner />
      <span className="sr-only">Loading dashboard data...</span>
    </div>
  ) : (
    <WidgetContent />
  )}
</div>
```

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Audit existing ARIA**: Review all widgets for current accessibility state
2. **Add widget ARIA labels**: Add aria-labelledby to all Card containers
3. **Implement chart descriptions**: Add sr-only text descriptions for charts
4. **Add live regions**: Implement aria-live for activity feed and loading states
5. **Verify keyboard navigation**: Test Tab order across all widgets
6. **Add focus indicators**: Ensure visible focus styles on all interactive elements
7. **Verify color contrast**: Run contrast checks on all text and UI elements
8. **Test with screen reader**: Manual testing with VoiceOver/NVDA
9. **Run automated audit**: Use HybridAccessibilityTester to verify compliance
10. **Fix violations**: Address any critical/serious violations found

### Suggested Order
1. Audit → 2. Widget ARIA → 3. Charts → 4. Live regions → 5. Keyboard → 6. Focus → 7. Contrast → 8. Screen reader → 9. Automated → 10. Fixes

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Run accessibility tests
pnpm --filter web-e2e test:shard5  # Accessibility shard

# Manual keyboard testing
# 1. Navigate to /home dashboard
# 2. Tab through all interactive elements
# 3. Verify focus is visible on each element
# 4. Verify all actions accessible via Enter/Space

# Screen reader testing (macOS)
# 1. Enable VoiceOver (Cmd + F5)
# 2. Navigate to /home dashboard
# 3. Verify all widgets announced with labels
# 4. Verify chart data read via descriptions
```

## Related Files
- Initiative: `../initiative.md`
- HybridAccessibilityTester: `apps/e2e/tests/accessibility/hybrid-a11y.ts`
- Accessibility test spec: `apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts`
- Accessibility documentation: `.ai/ai_docs/context-docs/testing+quality/accessibility-testing.md`
- WCAG implementation guide: `.ai/ai_docs/software-docs/ui/accessibility.md`
