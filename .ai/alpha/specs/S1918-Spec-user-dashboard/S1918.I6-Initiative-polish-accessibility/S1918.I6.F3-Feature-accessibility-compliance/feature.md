# Feature: Accessibility Compliance

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1918.I6 |
| **Feature ID** | S1918.I6.F3 |
| **Status** | Draft |
| **Estimated Days** | 4 |
| **Priority** | 3 |

## Description
Conduct accessibility audit and implement fixes for the dashboard page and all 7 widgets. This includes ARIA labels, keyboard navigation, focus management, reduced motion support for animations, and WCAG 2.1 AA compliance.

## User Story
**As a** user with accessibility needs
**I want to** navigate the dashboard using keyboard and screen reader
**So that** I can access all features regardless of input method or visual ability

## Acceptance Criteria

### Must Have
- [ ] All interactive elements have proper ARIA labels
- [ ] Dashboard fully navigable via keyboard (Tab, Enter, Space, Arrow keys)
- [ ] Focus indicators visible on all interactive elements
- [ ] Charts respect `prefers-reduced-motion` media query
- [ ] Screen reader announces widget titles and content appropriately
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Focus trap for modal dialogs (if any)
- [ ] Skip link to main content area

### Nice to Have
- [ ] Lighthouse accessibility score 90+
- [ ] Announce live regions for dynamic content updates
- [ ] High contrast mode support

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | ARIA labels, focus styles, skip link | Modify |
| **Logic** | `useReducedMotion` hook, keyboard handlers | New/Modify |
| **Data** | N/A | N/A |
| **Database** | N/A | N/A |

## Architecture Decision

**Approach**: Pragmatic - Audit-driven fixes with reusable accessibility utilities
**Rationale**: Start with automated audit (Lighthouse), prioritize WCAG AA violations, create reusable hooks/utilities for common patterns.

### Key Architectural Choices
1. Create `useReducedMotion` hook for animation control
2. Add ARIA attributes directly to existing components
3. Use semantic HTML where possible before ARIA
4. Follow existing keyboard navigation patterns from Kanban

### Trade-offs Accepted
- Some chart accessibility limited by Recharts capabilities
- Manual testing required for screen reader verification

## Required Credentials
> None required

## Dependencies

### Blocks
- None

### Blocked By
- S1918.I1.F1: Dashboard page must exist
- S1918.I3.F1, S1918.I3.F2: Progress widgets must exist for chart accessibility
- S1918.I4.F1-F4, S1918.I5.F2: Widgets must exist for ARIA additions

### Parallel With
- F1: Loading Skeletons (independent)
- F2: Error Boundaries (independent)
- F4: E2E Test Suite (may add a11y tests after this)

## Files to Create/Modify

### New Files
- `apps/web/app/home/(user)/_lib/hooks/use-reduced-motion.ts`
- `apps/web/app/home/(user)/_components/skip-link.tsx`

### Modified Files
- `apps/web/app/home/(user)/page.tsx` - Add skip link, ARIA landmarks
- `apps/web/app/home/(user)/_components/*-widget.tsx` - Add ARIA labels to each widget
- Progress chart components - Add `prefers-reduced-motion` support
- `apps/web/globals.css` or widget styles - Ensure focus visible styles

## Task Hints
> Guidance for the next decomposition phase

### Candidate Tasks
1. **Run Lighthouse accessibility audit**: Document baseline score and violations
2. **Create useReducedMotion hook**: Detect and respect motion preference
3. **Create skip link component**: Allow keyboard users to skip to main content
4. **Add ARIA labels to widget cards**: Proper `aria-labelledby`, `role` attributes
5. **Add keyboard navigation to Quick Actions**: Enter/Space handlers, focus management
6. **Apply reduced motion to chart animations**: Disable/reduce animations based on preference
7. **Add focus visible styles**: Ensure focus indicators are visible on all elements
8. **Verify color contrast**: Check and fix any contrast violations
9. **Test with screen reader**: Manual VoiceOver/NVDA testing and fixes

### Suggested Order
1. Run audit (T1)
2. Create utility hooks (T2)
3. Skip link (T3)
4. ARIA labels for widgets (T4 - can parallel T5-T8)
5. Keyboard navigation (T5)
6. Reduced motion (T6)
7. Focus styles (T7)
8. Color contrast (T8)
9. Screen reader testing (T9 - final verification)

## Validation Commands
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Lighthouse accessibility audit (manual)
# 1. Start dev server: pnpm dev
# 2. Open Chrome DevTools → Lighthouse
# 3. Run Accessibility audit
# 4. Target: 90+ score

# Keyboard navigation test (manual)
# 1. Navigate entire dashboard with Tab key
# 2. Activate elements with Enter/Space
# 3. Verify focus visible at all times

# Reduced motion test (manual)
# 1. Enable "Reduce motion" in OS settings
# 2. Verify chart animations are disabled
```

## Related Files
- Initiative: `../initiative.md`
- Pattern: `apps/web/app/home/(user)/kanban/_components/task-card.tsx` (keyboard handlers)
- Pattern: `packages/ui/src/shadcn/alert.tsx` (`role="alert"`)
- Research: `../../../research-library/perplexity-dashboard-ux.md` (widget states)
- Research: `../../../research-library/context7-recharts-radar.md` (animation props)
