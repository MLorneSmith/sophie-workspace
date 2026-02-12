# Dashboard Integration Verification Checklist

**Spec:** S2072 - User Dashboard
**Feature:** S2072.I6.F3 - Dashboard Integration Verification
**Date:** 2026-02-12
**Status:** In Progress

---

## 1. Widget Rendering

All 7 widgets must render without errors on the dashboard page at `/home`.

### Row 1: Progress Widgets

- [ ] **Course Progress Radial** renders with radial chart or empty state
- [ ] **Skills Spider Diagram** renders with radar chart or empty state
- [ ] **Kanban Summary Card** renders with task summary or empty state

### Row 2: Activity & Actions Widgets

- [ ] **Recent Activity Feed** renders with activity list or empty state
- [ ] **Quick Actions Panel** renders with contextual action buttons
- [ ] **Coaching Sessions Card** renders with sessions or booking CTA

### Row 3: Full-Width Table

- [ ] **Presentations Table** renders with data table or empty rows

---

## 2. Loading States

Loading skeletons must appear during data fetching for each row.

- [ ] Dashboard loading skeleton renders via `loading.tsx`
- [ ] Row 1 skeleton shows 3 placeholder cards (h-64)
- [ ] Row 2 skeleton shows 3 placeholder cards (h-64)
- [ ] Row 3 skeleton shows 1 full-width placeholder (h-48)
- [ ] Skeleton animation respects `prefers-reduced-motion`
- [ ] Skeleton has `role="status"` and `aria-label` attributes

---

## 3. Empty States

Each widget must display an engaging empty state when no data is available.

- [ ] **Course Progress** shows "Start Course" CTA at 0%
- [ ] **Skills Spider** shows "No Assessment Yet" with "Take Assessment" CTA
- [ ] **Kanban Summary** shows "No tasks in progress" with "View Kanban" CTA
- [ ] **Activity Feed** shows "No activity yet" with "Start Learning" CTA
- [ ] **Quick Actions** always shows at least one action (New Presentation)
- [ ] **Coaching Sessions** shows "No upcoming sessions" with "Book a Session" CTA
- [ ] **Presentations Table** shows empty table (0 rows)

---

## 4. Responsive Layout

Dashboard grid must adapt to mobile (375px), tablet (768px), and desktop (1440px).

### Mobile (375px)

- [ ] Row 1 widgets stack vertically (1 column)
- [ ] Row 2 widgets stack vertically (1 column)
- [ ] Row 3 table is full width
- [ ] All widgets are readable and interactive
- [ ] No horizontal scrollbar appears

### Tablet (768px)

- [ ] Row 1 displays in 2-column grid
- [ ] Row 2 displays in 2-column grid
- [ ] Row 3 table is full width
- [ ] Widget heights remain consistent

### Desktop (1440px)

- [ ] Row 1 displays in 3-column grid
- [ ] Row 2 displays in 3-column grid
- [ ] Row 3 table is full width
- [ ] 3-3-1 layout pattern is correct

---

## 5. Navigation Links

All links in widgets and quick actions must navigate to the correct destinations.

### Quick Actions Panel

- [ ] "Continue Course" navigates to `/home/courses`
- [ ] "Take Assessment" navigates to `/home/assessment/survey`
- [ ] "New Presentation" navigates to `/home/presentations/new` or equivalent
- [ ] "Review Storyboard" navigates to presentations area

### Widget Internal Links

- [ ] Kanban "View Kanban" link navigates to `/home/kanban`
- [ ] Activity Feed "Start Learning" CTA navigates to `/home/courses`
- [ ] Skills Spider "Take Assessment" CTA navigates to `/home/assessment/survey`
- [ ] Coaching Sessions booking CTA links to Cal.com or booking page
- [ ] Course Progress "Start Course" CTA navigates to courses

---

## 6. Accessibility

WCAG 2.1 AA compliance for all dashboard elements.

- [ ] All widgets have proper ARIA labels
- [ ] Charts have `aria-describedby` with screen-reader descriptions
- [ ] Loading states have `role="status"` attribute
- [ ] Skip-to-content link is present and functional
- [ ] Color contrast meets AA standards (4.5:1 for text)
- [ ] Keyboard navigation works across all widgets
- [ ] Focus management is logical (tab order follows visual order)

---

## 7. TypeScript & Code Quality

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] No `console.error` messages in browser console
- [ ] No unhandled promise rejections

---

## 8. Data Integration

- [ ] Dashboard loader fetches all 7 data sources in parallel
- [ ] Individual loader failures don't crash the page (graceful degradation)
- [ ] Cal.com API integration returns bookings or handles missing env gracefully
- [ ] Activity feed displays real user activity events

---

## 9. Test Results Summary

| Category | Total | Pass | Fail | Skip |
|----------|-------|------|------|------|
| Widget Rendering | 7 | | | |
| Loading States | 6 | | | |
| Empty States | 7 | | | |
| Responsive (375px) | 5 | | | |
| Responsive (768px) | 4 | | | |
| Responsive (1440px) | 4 | | | |
| Navigation Links | 9 | | | |
| Accessibility | 7 | | | |
| Code Quality | 4 | | | |
| Data Integration | 4 | | | |
| **Total** | **57** | | | |

---

## 10. Issues Found

| # | Severity | Category | Description | Suggested Fix |
|---|----------|----------|-------------|---------------|
| | | | | |

---

## 11. Screenshots

Screenshots captured during verification are stored in:
`.ai/alpha/validation/S2072.I6.F3/`
