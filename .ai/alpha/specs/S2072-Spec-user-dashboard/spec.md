# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S[pending] |
| **GitHub Issue** | #[pending] |
| **Document Owner** | Claude Code |
| **Created** | 2026-02-12 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A personalized user dashboard at `/home` that provides an at-a-glance view of learning progress, tasks, activity, and upcoming coaching sessions.

### Press Release Headline
> "SlideHeroes announces User Dashboard enabling learners to track their presentation mastery journey in a single, beautiful view."

### Elevator Pitch (30 seconds)
The User Dashboard replaces the current placeholder home page with a comprehensive command center. Users see their course progress visually, understand their skill gaps via assessment results, manage their tasks, and access quick actions—all in one place with engaging empty states that encourage progress even for new users.

---

## 2. Problem Statement

### Problem Description
Users currently land on a placeholder home page (`/home`) with no meaningful content. They must navigate to separate pages for course progress, tasks, assessments, and coaching—creating friction and reducing engagement. Users lack a unified view of their learning journey.

### Who Experiences This Problem?
- **New users** who want immediate orientation after signup
- **Active learners** tracking course progress and skills
- **Busy professionals** who need quick status before diving deeper
- **Coaching participants** managing session schedules

### Current Alternatives
- Navigate to `/home/course` for progress (separate page)
- Navigate to `/home/kanban` for tasks (separate page)
- Navigate to `/home/assessment` for skills (separate page)
- Navigate to `/home/coaching` for sessions (separate page)

**Gaps**: No unified view, no quick actions, no activity timeline, wasted navigation clicks.

### Impact of Not Solving
- **Business impact**: Lower user engagement, missed coaching bookings, reduced course completion
- **User impact**: Fragmented experience, harder to track progress, more clicks to accomplish tasks
- **Competitive impact**: Modern SaaS products have unified dashboards—we appear less polished

---

## 3. Vision & Goals

### Product Vision
A dashboard that feels like a personalized command center—showing users exactly what they need to know and do next, with visualizations that motivate continued progress even when starting from zero.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase engagement | /home page views | +40% vs baseline (0 currently) | Analytics page view tracking |
| G2: Improve task visibility | Tasks marked "doing" completed | +25% completion rate | Database: tasks table status changes |
| G3: Boost coaching bookings | Coaching sessions booked | +30% sessions booked | Cal.com booking data |
| G4: Reduce navigation clicks | Clicks to common actions | -50% (3→1.5 avg) | Session replay analysis |

### Strategic Alignment
This dashboard supports the core product promise: helping users master presentation skills. By surfacing progress, tasks, and coaching in one view, we reinforce the learning journey and reduce friction to engagement.

---

## 4. Target Users

### Primary Persona
**Name**: Active Learner Alex
**Role**: Professional improving presentation skills
**Goals**: Track progress, complete course, book coaching, manage presentation projects
**Pain Points**: Too many pages to check, forgets what's next, wants quick status
**Quote**: "I want to see where I stand and what I should do next—all in one glance."

### Secondary Personas
- **New User Nina**: Just signed up, needs orientation and encouragement (empty states critical)
- **Busy Manager Marcus**: Checks dashboard weekly for quick status update

### Anti-Personas (Who This Is NOT For)
- Team administrators managing multiple users (different dashboard needed)
- Course content creators (admin interface)
- Unauthenticated visitors (marketing site)

---

## 5. Solution Overview

### Proposed Solution
A dashboard page at `/home` with a responsive 3-3-1 grid layout:
- **Row 1**: Course Progress Radial | Skills Spider Diagram | Kanban Summary Card
- **Row 2**: Recent Activity Feed | Quick Actions Panel | Coaching Sessions Card
- **Row 3**: Presentations Table (full-width)

### Key Capabilities

1. **Course Progress Radial Chart**: Circular progress indicator showing course completion percentage with lessons completed count
2. **Skills Spider Diagram**: Radar chart displaying self-assessment category scores (structure, story, substance, style, self-confidence)
3. **Kanban Summary Card**: Shows current "Doing" tasks with count and next task preview, links to full kanban
4. **Recent Activity Feed**: Timeline of recent activity (presentations created, lessons completed, quiz scores, assessments)
5. **Quick Actions Panel**: Context-aware CTAs based on user state (Continue Course, New Presentation, Complete Assessment, Review Storyboard)
6. **Coaching Sessions Card**: Shows upcoming 1-2 booked sessions with date/time/join link, OR booking CTA if none
7. **Presentations Table**: List of user's presentations with quick edit link

### Customer Journey

1. **User navigates to `/home`** (or is redirected after login)
2. **Dashboard loads with parallel data fetching** for all widgets
3. **User sees at-a-glance status** across learning, tasks, and coaching
4. **User clicks a quick action** to continue course, start presentation, or book coaching
5. **User returns later** to check progress update or next task

### Hypothetical Customer Quote
> "Finally, I can see everything in one place! The progress ring motivates me, and I love that empty charts still look engaging—no depressing blank screens."
> — Active Learner Alex, Professional

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column stacked | All widgets full-width, table scrolls horizontally |
| Tablet (768-1024px) | 2-column grid | First two rows become 2-col, table remains full |
| Desktop (>1024px) | 3-3-1 grid | Primary design target, all widgets visible |

---

## 6. Scope Definition

### In Scope

- [x] Dashboard page at `/home` route (personal account context)
- [x] Course progress radial chart widget
- [x] Skills spider diagram widget (from assessment data)
- [x] Kanban summary card with "doing" tasks
- [x] Activity feed showing recent events across domains
- [x] Quick actions panel with contextual CTAs
- [x] Coaching sessions card (booked sessions OR booking CTA)
- [x] Presentations table with edit link
- [x] Empty states for all widgets (engaging, not depressing)
- [x] Loading skeletons for async data
- [x] Responsive grid layout

### Out of Scope

- [ ] Team account dashboard (separate feature)
- [ ] Real-time updates via WebSockets (polling or refresh only)
- [ ] Activity feed pagination (show last 10 items only)
- [ ] Calendar integration beyond Cal.com booking
- [ ] Customizable/reorderable widgets
- [ ] Dashboard analytics/admin view

### Future Considerations (v2+)

- Real-time updates with Supabase Realtime subscriptions
- Activity feed with infinite scroll
- Widget customization/reordering
- Team dashboard variant
- Gamification badges/achievements

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `course_progress` table | Supabase DB | Completion percentage, current lesson |
| `lesson_progress` table | Supabase DB | Individual lesson completion status |
| `quiz_attempts` table | Supabase DB | Quiz scores and pass/fail status |
| `survey_responses` table | Supabase DB | Assessment category_scores JSONB |
| `tasks` table | Supabase DB | Kanban tasks with status enum |
| `building_blocks_submissions` table | Supabase DB | Presentations with outlines |
| Cal.com V2 API | External REST | Fetch bookings with Bearer token auth |

### Technical Constraints

- **Performance**: Initial load < 2s LCP, parallel data fetching required
- **Security**: All data user-scoped via RLS, no admin client needed
- **Compliance**: Cal.com API key server-side only
- **Scalability**: Activity feed limited to 10 items to prevent N+1 queries

### Technology Preferences/Mandates

- **Charts**: Recharts via `@kit/ui/chart` wrapper (existing pattern)
- **Data Fetching**: Server component with loader, optional React Query for client state
- **Layout**: Tailwind CSS grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`)
- **Empty States**: Skeleton components from `@kit/ui/skeleton`

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Recharts | External | Low | Already in project |
| Cal.com V2 API | External | Medium | API rate limits, availability |
| Existing loaders | Internal | Low | Reuse patterns from course/kanban |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have personal accounts (not team-only)**: Dashboard is for personal context — *Validation: Check user account type on page load*
2. **Cal.com API key has permission to query bookings**: Bearer token works for V2 API — *Validation: Test API call during implementation*
3. **Activity can be aggregated from existing tables**: No dedicated activity_events table needed — *Validation: Query performance test with UNION*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com V2 API unavailable or changed | Low | High | Graceful fallback to booking CTA only | Backend |
| R2 | Activity aggregation query slow | Medium | Medium | Limit to 10 items, add caching | Backend |
| R3 | Empty states feel sparse | Medium | Medium | Follow UX research patterns, add illustrations | Frontend |

### Open Questions

1. [ ] Should activity feed include AI feature usage (canvas, outline generator)?
2. [ ] What is the max number of "doing" tasks to show in kanban summary?
3. [ ] Should coaching sessions include reschedule capability or just link to Cal.com?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] Dashboard page renders at `/home` with all 7 widgets
- [ ] All widgets have proper empty states for new users
- [ ] All widgets have loading skeleton states
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Typecheck passes with no errors
- [ ] E2E tests cover dashboard loading and widget interactions

### Launch Criteria

- All 7 widgets functional with real data
- Empty states implemented for all widgets
- Loading states implemented for all async widgets
- Cal.com integration working (booking CTA at minimum)
- Mobile responsive layout verified

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| /home page views | 0 | 500/week | 2 weeks |
| Dashboard bounce rate | N/A | <40% | 2 weeks |
| Quick action click rate | N/A | >25% | 2 weeks |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page shell, grid layout, routing
2. **Data Layer** (P0) - Dashboard loader with parallel fetching, types
3. **Progress Widgets** (P1) - Course radial, Skills spider diagram
4. **Activity & Actions** (P1) - Activity feed, Quick actions panel
5. **Task & Session Widgets** (P1) - Kanban summary, Coaching sessions
6. **Presentation Table** (P2) - Full-width table component
7. **Polish & Empty States** (P2) - Loading skeletons, empty states, error boundaries

### Candidate Initiatives

1. **I1: Dashboard Foundation & Data Layer** - Page shell, grid layout, parallel loader
2. **I2: Progress Visualization Widgets** - Course radial, Skills spider diagram
3. **I3: Activity & Action Widgets** - Activity feed, Quick actions panel
4. **I4: Task & Coaching Widgets** - Kanban summary, Coaching sessions card
5. **I5: Presentation Table** - Presentations table with edit links
6. **I6: Polish & Empty States** - Loading states, empty states, accessibility

### Suggested Priority Order

1. **P0**: Foundation + Data Layer (enables everything else)
2. **P1**: Progress Widgets, Activity/Actions, Task/Coaching (parallel possible)
3. **P2**: Presentation Table, Polish (can be parallel with P1)

### Complexity Indicators

| Area | Complexity | Rationale |
|------|------------|-----------|
| Dashboard loader | Medium | Aggregates 6+ data sources in parallel |
| Activity feed | High | No activity_events table, must UNION across tables |
| Cal.com integration | Medium | V2 API + Bearer token, existing research |
| Empty states | Medium | 7 different widgets need unique empty states |
| Charts | Low | Existing RadarChart component, RadialProgress pattern exists |

---

## 11. Appendices

### A. Glossary

- **SCQA**: Situation-Complication-Question-Answer framework for presentations
- **RLS**: Row Level Security (Supabase)
- **Radial Progress**: Circular donut chart showing percentage completion
- **Spider Diagram**: Radar chart showing multi-axis data (skills assessment)

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Yes | SVG radial, needs Recharts upgrade |
| RadarChart | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Production-ready, accepts CategoryScores |
| ChartContainer | `packages/ui/src/shadcn/chart.tsx` | Yes | Wraps Recharts with theming |
| KanbanBoard | `apps/web/app/home/(user)/kanban/_components/kanban-board.tsx` | Pattern only | Extract status filtering logic |
| TaskCard | `apps/web/app/home/(user)/kanban/_components/task-card.tsx` | Pattern only | Use for kanban summary |
| EmptyState | `packages/ui/src/makerkit/empty-state.tsx` | Yes | Compound component pattern |
| Skeleton | `packages/ui/src/shadcn/skeleton.tsx` | Yes | Loading states |
| Card | `packages/ui/src/shadcn/card.tsx` | Yes | Widget containers |
| Calendar (iframe) | `apps/web/app/home/(user)/coaching/_components/calendar.tsx` | Pattern only | Cal.com iframe embed |
| Presentation Selector | `apps/web/app/home/(user)/ai/_components/edit-presentation-combobox.tsx` | Pattern only | Data fetching pattern |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `supabase/migrations/20250319104726_web_course_system.sql` | Course completion tracking |
| `lesson_progress` | Same | Individual lesson completion |
| `quiz_attempts` | Same | Quiz scores and pass/fail |
| `survey_responses` | `supabase/migrations/20250319104724_web_survey_system.sql` | Assessment category_scores |
| `tasks` | `supabase/migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status |
| `building_blocks_submissions` | `supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentations |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `perplexity-calcom-nextjs-integration-post-platform.md` | Use iframe embed + V2 API; @calcom/atoms requires deprecated OAuth; Bearer token with `cal_` prefix | Section 7 (Cal.com integration), Coaching widget |
| `perplexity-dashboard-empty-states-ux.md` | Ghost visualizations preserve structure; single CTA > multiple; positive framing ("Start by adding" vs "You don't have"); engage new users with illustrations | Section 5 (Empty states), Section 6 (Scope) |
| `context7-recharts-radial-radar.md` | PieChart with innerRadius for radial; RadarChart with PolarGrid/PolarAngleAxis/PolarRadiusAxis; ChartContainer wrapper; aspect-square for widgets | Section 7 (Technical), Progress widgets |

### D. External References

- [Cal.com V2 API Documentation](https://cal.com/docs/api/v2)
- [Cal.com Embed Documentation](https://cal.com/docs/core-features/embed)
- [Nielsen Norman Group: Empty State Design](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Recharts Documentation](https://recharts.org/)

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                            My Dashboard                                         │
├────────────────────────┬────────────────────────┬────────────────────────────────┤
│ [Course Progress]      │ [Skills Assessment]    │ [Current Tasks]                │
│   ╭───────╮            │      ╱╲                │ ┌─────────────────────────────┐│
│   │  67%  │            │     ╱  ╲               │ │ Doing: 3 tasks              ││
│   ╰───────╯            │    ╱    ╲              │ │ Next: "Complete storyboard"  ││
│   12 of 18 lessons     │   ╱──────╲             │ │                             ││
│                        │  ╱        ╲            │ │ [View Kanban →]             ││
├────────────────────────┼────────────────────────┼────────────────────────────────┤
│ [Recent Activity]      │ [Quick Actions]        │ [Coaching Sessions]           │
│ ┌────────────────────┐ │ ┌────────────────────┐ │ ┌─────────────────────────────┐│
│ │ ✓ Lesson 5 done    │ │ │ [Continue Course]  │ │ │ Next: Feb 15 at 2:00 PM     ││
│ │ ○ Quiz: 85%        │ │ │ [New Presentation] │ │ │ [Join Session] [Reschedule] ││
│ │ ○ Assessment done  │ │ │ [Complete Survey]  │ │ │                             ││
│ │ ○ Pres. created    │ │ │ [Review Storyboard]│ │ │ ─────────────────────────── ││
│ └────────────────────┘ │ └────────────────────┘ │ │ Feb 22 at 10:00 AM          ││
├────────────────────────┴────────────────────────┴────────────────────────────────┤
│ [My Presentations]                                          [Edit] [New +]       │
│ ┌────────────────────┬─────────────────┬─────────────────┬─────────────────────┐│
│ │ Title              │ Created         │ Status          │ Actions             ││
│ ├────────────────────┼─────────────────┼─────────────────┼─────────────────────┤│
│ │ Q4 Sales Pitch     │ Feb 10, 2026    │ Has Storyboard  │ [Edit Outline]      ││
│ │ Product Launch     │ Feb 5, 2026     │ Draft           │ [Edit Outline]      ││
│ │ Team Update        │ Jan 28, 2026    │ Complete        │ [Edit Outline]      ││
│ └────────────────────┴─────────────────┴─────────────────┴─────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────┘
```

**Empty State Mockup (New User):**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                            My Dashboard                                         │
├────────────────────────┬────────────────────────┬────────────────────────────────┤
│ [Course Progress]      │ [Skills Assessment]    │ [Current Tasks]                │
│   ╭───────╮            │      ╱╲ (faded)        │ ┌─────────────────────────────┐│
│   │   0%  │ (faded)    │     ╱  ╲ (no fill)    │ │                             ││
│   ╰───────╯            │    ╱    ╲              │ │   📋 No tasks yet           ││
│                        │   ╱──────╲             │ │   Start tracking your       ││
│ [Start Course →]       │ [Take Assessment →]    │ │   presentation tasks        ││
│                        │                        │ │   [Add First Task →]        ││
├────────────────────────┼────────────────────────┼────────────────────────────────┤
│ [Recent Activity]      │ [Quick Actions]        │ [Coaching Sessions]           │
│ ┌────────────────────┐ │ ┌────────────────────┐ │ ┌─────────────────────────────┐│
│ │                    │ │ │                    │ │ │                             ││
│ │   🎯 No activity   │ │ │ [Start Course] ⭐  │ │ │   📅 No sessions booked     ││
│ │   yet! Start your  │ │ │ [New Presentation] │ │ │                             ││
│ │   learning journey │ │ │ [Take Assessment]  │ │ │   Book a coaching session   ││
│ │                    │ │ │                    │ │ │   to get personalized help  ││
│ │                    │ │ │                    │ │ │   [Book Session →]          ││
│ └────────────────────┘ │ └────────────────────┘ │ └─────────────────────────────┘│
├────────────────────────┴────────────────────────┴────────────────────────────────┤
│ [My Presentations]                                                              │
│ ┌────────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                            │  │
│ │     📝 No presentations yet                                                │  │
│ │     Create your first presentation outline to get started                 │  │
│ │     [Create Presentation →]                                                │  │
│ │                                                                            │  │
│ └────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-02-12 | Use 3-3-1 grid layout | Matches spec requirements, responsive with Tailwind | Spec author |
| 2026-02-12 | No activity_events table | Aggregate from existing tables, avoid migration overhead | Spec author |
| 2026-02-12 | Cal.com iframe + V2 API | Research confirmed atoms deprecated, embed reliable | Research |
| 2026-02-12 | Limit activity to 10 items | Performance, avoid pagination complexity | Spec author |
