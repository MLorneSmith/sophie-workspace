# Feature: Accessibility Audit & Fixes

## Metadata
| Field | Value |
|-------|-------|
| **Parent Initiative** | S1877.I4 |
| **Feature ID** | S1877.I4.F4 |
| **Status** | Draft |
| **Estimated Days** | 3 |
| **Priority** | 4 |

## Description

Conducts WCAG 2.1 AA accessibility audit on the presentation table widget and dashboard page. Ensures keyboard navigation, screen reader compatibility, color contrast, focus management, and ARIA labeling compliance. Fixes any identified issues.

## User Story

**As a** User with disabilities (visual impairment, motor impairment)

**I want to** navigate and interact with the presentation table using keyboard or screen reader

**So that** I can manage my presentations independently without requiring mouse use

## Acceptance Criteria

### Must Have
- [ ] All table headers have proper ARIA labels or text content
- [ ] Edit Outline buttons have `aria-label="Edit presentation outline for {title}"`
- [ ] Table rows support keyboard navigation (Tab/Shift+Tab through rows, Enter to select)
- [ ] Focus indicators visible on keyboard navigation (visible outline/ring)
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for normal text)
- [ ] Empty state text is screen reader accessible
- [ ] Loading skeleton has appropriate ARIA attributes (aria-hidden)
- [ ] Page remains navigable without mouse
- [ ] Focus moves to content after page load

### Nice to Have
- [ ] Skip to table link for screen reader users
- [ ] Announcements when sorting/filtering changes
- [ ] Focus trap within filter dropdown when open

## Vertical Slice Components

| Layer | Component | Status |
|-------|-----------|--------|
| **UI** | Table component with ARIA fixes | Modified |
| **UI** | Button with proper labels | Modified |
| **Testing** | Accessibility audit test cases | New |
| **Documentation** | Accessibility findings report | New |

## Architecture Decision

**Approach**: Clean

**Rationale**: Follow WCAG 2.1 AA guidelines systematically. Test with keyboard-only navigation, screen reader, and color contrast tools. Fix issues incrementally with semantic HTML, ARIA attributes, and CSS focus indicators.

### Key Architectural Choices

1. **Semantic Table**: Use native HTML `<table>` elements (already done via `@kit/ui/table` components).
2. **ARIA Labels**: Add explicit `aria-label` to interactive elements where button text alone is insufficient (e.g., "Edit" icon buttons).
3. **Keyboard Navigation**: Ensure all interactive elements are tab-navigable and Enter-activatable.
4. **Focus Management**: Use Tailwind's `focus-visible` class for visible focus indicators.
5. **Color Contrast**: Verify semantic color classes (`text-foreground`, `text-muted-foreground`) meet AA standards.

### Trade-offs Accepted

- **Manual testing required**: Automated axe/Lighthouse tests help but keyboard/screen reader testing requires manual verification.

## Required Credentials

None required.

## Dependencies

### Blocks
- None

### Blocked By
- S1877.I4.F1 (Presentation Table Widget) - Requires base table component to audit
- S1877.I4.F3 (Empty/Loading States) - Requires complete component with states to audit

### Parallel With
- None (depends on F1, F3)

## Files to Create/Modify

### New Files
- `apps/e2e/tests/user/dashboard-presentation-table-accessibility.spec.ts` - E2E accessibility tests for presentation table

### Modified Files
- `apps/web/app/home/(user)/_components/presentation-table-widget.tsx` - Add ARIA labels, keyboard handling
- `apps/web/app/home/(user)/_components/table-column-definitions.ts` - Add ARIA meta to column definitions

## Task Hints

### Candidate Tasks

1. **Audit ARIA labels**: Review all interactive elements for proper labels
2. **Audit keyboard navigation**: Test Tab/Enter/Escape navigation flow
3. **Audit color contrast**: Verify all text/background combinations meet AA
4. **Audit screen reader**: Test with NVDA/JAWS (or use automated axe-core)
5. **Fix ARIA issues**: Add missing aria-labels, roles
6. **Fix keyboard issues**: Ensure proper tab order, enter activation
7. **Fix contrast issues**: Adjust color classes if violations found
8. **Create E2E tests**: Add accessibility test suite for presentation table

### Suggested Order

1. Conduct manual accessibility audit
2. Create list of findings
3. Fix ARIA labeling issues
4. Fix keyboard navigation issues
5. Fix color contrast issues
6. Run axe-core automated scan
7. Create E2E test suite
8. Re-verify all fixes

## Validation Commands

```bash
# Typecheck after implementation
pnpm typecheck

# Run accessibility E2E tests
pnpm --filter web-e2e test dashboard-presentation-table-accessibility

# Manual keyboard test
# 1. Open /home in browser
# 2. Press Tab to navigate through interface
# 3. Verify you can reach all interactive elements
# 4. Verify visible focus indicator follows keyboard

# Manual screen reader test (if available)
# 1. Enable screen reader (NVDA/VoiceOver)
# 2. Navigate to /home
# 3. Tab through presentation table
# 4. Verify all elements announced correctly

# Color contrast check
# Use browser extension (axe DevTools or WebAIM contrast checker)
# Verify all text/background combinations pass AA
```

## Related Files
- Initiative: `../initiative.md`
- F1-F3: All prior features in this initiative
- Accessibility tests: `apps/e2e/tests/accessibility/accessibility-hybrid.spec.ts` (reference)
- Tasks: `./tasks.json` (created in next phase)
