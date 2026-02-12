# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S2072.I6 |
| **Feature ID** | S2072.I6.F2 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 2 |

## Description

Ensures the dashboard meets WCAG 2.1 AA accessibility standards through comprehensive audit and remediation. Adds ARIA labels, ensures keyboard navigation works for all interactive elements, manages focus states, and validates screen reader compatibility. This is a cross-cutting feature that touches all dashboard widgets.

## User Story
**As a** user with visual or motor impairments
**I want to** navigate and interact with the dashboard using only keyboard and screen reader
**So that** I can access the same functionality as other users

## Acceptance Criteria

### Must Have
- [ ] All interactive elements have descriptive ARIA labels
- [ ] Tab order follows logical reading sequence (left-to-right, top-to-bottom)
- [ ] Focus indicators visible on all focusable elements
- [ ] Charts have text alternatives (data tables or aria-label with summary)
- [ ] Loading states announced to screen readers (`aria-busy`, `aria-live`)
- [ ] Empty state CTAs are keyboard accessible
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components)
- [ ] Dashboard passes axe-core automated audit with zero violations
- [ ] Skip-to-content link for keyboard users

### Nice to Have
- [ ] High contrast mode support
- [ ] Screen reader testing with NVDA or VoiceOver
- [ ] Reduced motion support documented and tested

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ARIA attributes on all widgets | Modify |
| **UI** | Focus management hooks | New |
| **Logic** | Skip-to-content link | New |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Incremental enhancement following WCAG guidelines

**Rationale**:
- Use semantic HTML elements where possible (buttons, links, headings)
- Add ARIA attributes only where HTML semantics insufficient
- Leverage Radix UI primitives (already in shadcn components) which have built-in accessibility
- Focus on real issues found via axe-core audit rather than theoretical problems

### Key Architectural Choices
1. Run axe-core audit first, prioritize violations by severity
2. Use `aria-label` for icons without text
3. Add `aria-describedby` for complex widgets (charts)
4. Use `role="status"` for loading announcements
5. Ensure all widgets wrapped in appropriate landmark regions

### Trade-offs Accepted
- Full screen reader testing deferred (manual, time-consuming)
- High contrast mode not required for MVP

## Required Credentials
> No external credentials required for this feature.

| Variable | Description | Source |
|----------|-------------|--------|
| N/A | This feature is pure frontend accessibility | N/A |

## Dependencies

### Blocks
- S2072.I6.F3 (Dashboard Integration Verification) - needs accessible widgets to verify

### Blocked By
- S2072.I2.F1 (Course Progress Radial) - needs widget for ARIA labels
- S2072.I2.F2 (Skills Spider Diagram) - needs widget for chart accessibility
- S2072.I3.F1-F3 (Activity & Actions Widgets) - needs interactive elements
- S2072.I4.F1-F2 (Coaching Integration) - needs booking buttons
- S2072.I5.F1 (Presentations Table) - needs table accessibility
- S2072.I6.F1 (Dashboard Loading Orchestrator) - needs loading skeleton for aria-busy

### Parallel With
- None - depends on all widgets being implemented

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_components/dashboard/skip-to-content.tsx` - Skip navigation link
- `apps/web/app/home/(user)/_lib/hooks/use-focus-management.ts` - Focus trap and management

### Modified Files
- `apps/web/app/home/(user)/_components/dashboard/course-progress-radial.tsx` - Add aria-label, role
- `apps/web/app/home/(user)/_components/dashboard/skills-spider-diagram.tsx` - Add chart description
- `apps/web/app/home/(user)/_components/dashboard/activity-feed.tsx` - Add aria-live for updates
- `apps/web/app/home/(user)/_components/dashboard/quick-actions-panel.tsx` - Ensure button labels
- `apps/web/app/home/(user)/_components/dashboard/kanban-summary.tsx` - Add link descriptions
- `apps/web/app/home/(user)/_components/dashboard/coaching-sessions-card.tsx` - Add button labels
- `apps/web/app/home/(user)/_components/dashboard/presentations-table.tsx` - Table accessibility
- `apps/web/app/home/(user)/layout.tsx` - Add skip-to-content link

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Run axe-core audit**: Identify all violations on dashboard page
2. **Add skip-to-content link**: Keyboard navigation enhancement
3. **Fix ARIA violations**: Address each axe-core finding
4. **Add chart text alternatives**: Data descriptions for screen readers
5. **Test keyboard navigation**: Manual tab-through testing
6. **Test focus indicators**: Verify all focusable elements have visible focus

### Suggested Order
1. Run automated axe-core audit (document findings)
2. Create skip-to-content component
3. Fix critical violations (button labels, focus order)
4. Add chart accessibility (text alternatives)
5. Test keyboard navigation manually
6. Re-run axe-core to verify fixes

## Validation Commands
```bash
# Type checking
pnpm typecheck

# Run axe-core accessibility audit (if configured)
pnpm --filter web test:e2e -- --grep "accessibility"

# Manual keyboard navigation test
pnpm dev
# Navigate to /home, use Tab key to traverse all interactive elements
# Verify visible focus indicator on each element

# Manual screen reader test (optional)
# Enable VoiceOver (Mac) or NVDA (Windows), navigate dashboard
```

## Related Files
- Initiative: `../initiative.md`
- Tasks: `./tasks.json` (created in next phase)
- Reference: `packages/ui/src/shadcn/button.tsx` (has built-in accessibility)
- Reference: `apps/web/app/home/(user)/layout.tsx` (skip link location)
- WCAG Reference: https://www.w3.org/WAI/WCAG21/quickref/
