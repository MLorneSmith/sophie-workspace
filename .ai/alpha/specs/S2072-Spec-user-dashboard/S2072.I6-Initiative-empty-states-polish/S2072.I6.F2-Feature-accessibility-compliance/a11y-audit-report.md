# Accessibility Audit Report - Dashboard

**Date**: 2026-02-12
**Route**: /home (User Dashboard)
**Standard**: WCAG 2.1 AA
**Method**: Static code analysis of all dashboard widget components

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| Serious | 8 |
| Moderate | 4 |
| Minor | 2 |

## Critical Violations

### 1. No skip-to-content link (WCAG 2.4.1 - Bypass Blocks)

- **Widget**: Layout (`layout.tsx`)
- **Element**: Missing - no skip link exists
- **Impact**: Keyboard users must tab through all navigation to reach content
- **Fix**: Add `SkipToContent` component as first child in layout, add `id="main-content"` to main area

### 2. Chart images lack text alternatives (WCAG 1.1.1 - Non-text Content)

- **Widget**: Course Progress Radial (`course-progress-radial.tsx`)
- **Element**: `<ChartContainer>` / `<PieChart>` - no `role="img"` or `aria-label`
- **Impact**: Screen readers cannot convey chart data to users
- **Fix**: Add `role="img"`, `aria-label` with summary text to chart containers

## Serious Violations

### 3. Radar chart missing accessible name (WCAG 1.1.1)

- **Widget**: Skills Spider Diagram (`skills-spider-diagram.tsx`)
- **Element**: `<ChartContainer>` / `<RadarChart>`
- **Impact**: Screen readers see chart but cannot describe its purpose or data
- **Fix**: Add `role="img"`, `aria-label`, and `aria-describedby` with data summary

### 4. Kanban Summary link lacks context (WCAG 2.4.4 - Link Purpose)

- **Widget**: Kanban Summary Card (`kanban-summary-card.tsx`)
- **Element**: `<Link>` "View Kanban" at line 74-80
- **Impact**: Link purpose unclear without surrounding context for screen readers
- **Fix**: Add `aria-label` with task count context (e.g., "View all 3 in-progress tasks in Kanban board")

### 5. Activity Feed not a live region (WCAG 4.1.3 - Status Messages)

- **Widget**: Recent Activity Feed (`recent-activity-feed.tsx`)
- **Element**: Feed `<ul>` container
- **Impact**: Dynamic updates not announced to screen readers
- **Fix**: Add `aria-live="polite"`, `aria-label="Recent activity timeline"`

### 6. Quick Actions buttons lack icon context (WCAG 4.1.2 - Name Role Value)

- **Widget**: Quick Actions Panel (`quick-actions-panel.tsx`)
- **Element**: `ActionButton` components with icons
- **Impact**: While buttons have text labels, the panel and nav section lack semantic grouping
- **Fix**: Add `aria-label` to card navigation section, ensure panel is recognizable

### 7. Coaching Session "Join" link lacks context (WCAG 2.4.4)

- **Widget**: Coaching Sessions Card (`coaching-sessions-card.tsx`)
- **Element**: `<a>` "Join Session" at line 73-82
- **Impact**: Multiple "Join Session" links indistinguishable for screen readers
- **Fix**: Add `aria-label` with session title context (e.g., "Join session: Presentation Skills on Feb 15")

### 8. Coaching Session "Book" button lacks context (WCAG 2.4.4)

- **Widget**: Coaching Sessions Card (`coaching-sessions-card.tsx`)
- **Element**: `<Button>` "Book a Session" at line 99
- **Impact**: Button purpose unclear without session context
- **Fix**: Add descriptive `aria-label` to booking button

### 9. Presentations table edit buttons lack context (WCAG 2.4.4)

- **Widget**: Presentations Table (`presentations-table.tsx`)
- **Element**: Edit icon button at line 66-74 - has `aria-label="Edit presentation"` but lacks title context
- **Impact**: Multiple "Edit presentation" buttons indistinguishable
- **Fix**: Add presentation title to aria-label (e.g., "Edit presentation: My First Deck")

### 10. Presentations table missing accessible label (WCAG 1.3.1 - Info and Relationships)

- **Widget**: Presentations Table (`presentations-table.tsx`)
- **Element**: `<DataTable>` at line 104
- **Impact**: Table lacks a descriptive accessible label
- **Fix**: Add `aria-label` to table wrapper with item count

## Moderate Violations

### 11. No `aria-busy` during loading states (WCAG 4.1.3)

- **Widget**: Multiple widgets with skeleton loading
- **Fix**: Add `aria-busy="true"` to loading states

### 12. Status counts lack semantic grouping (WCAG 1.3.1)

- **Widget**: Kanban Summary Card
- **Element**: Status count `<span>` elements at lines 117-119
- **Fix**: Use `aria-label` on the container div

### 13. Empty state buttons lack accessible relationship (WCAG 1.3.1)

- **Widget**: Skills Spider Diagram empty state
- **Fix**: Ensure empty state is announced with context

### 14. Chart container missing `aria-describedby` (WCAG 1.1.1)

- **Widget**: Course Progress Radial
- **Fix**: Add hidden description element with detailed data

## Minor Violations

### 15. Coaching session time icon decorative (WCAG 1.1.1)

- **Widget**: Coaching Sessions Card
- **Element**: `<Clock>` icon at line 66
- **Fix**: Already decorative (next to text), add `aria-hidden="true"` explicitly

### 16. Priority badge lacks semantic meaning (WCAG 1.3.1)

- **Widget**: Kanban Summary Card
- **Element**: Priority `<Badge>` at line 103-109
- **Fix**: Consider adding visually hidden text for screen readers

## Affected Components Map

| Component | Critical | Serious | Moderate | Minor |
|-----------|----------|---------|----------|-------|
| layout.tsx | 1 | 0 | 0 | 0 |
| course-progress-radial.tsx | 1 | 0 | 1 | 0 |
| skills-spider-diagram.tsx | 0 | 1 | 1 | 0 |
| kanban-summary-card.tsx | 0 | 1 | 1 | 1 |
| recent-activity-feed.tsx | 0 | 1 | 0 | 0 |
| quick-actions-panel.tsx | 0 | 1 | 0 | 0 |
| coaching-sessions-card.tsx | 0 | 2 | 0 | 1 |
| presentations-table.tsx | 0 | 2 | 1 | 0 |

## Remediation Priority

1. **Immediate** (Critical): Skip-to-content, chart text alternatives
2. **High** (Serious): ARIA labels on links/buttons, live regions
3. **Medium** (Moderate): Loading states, semantic grouping
4. **Low** (Minor): Decorative icons, badge semantics
