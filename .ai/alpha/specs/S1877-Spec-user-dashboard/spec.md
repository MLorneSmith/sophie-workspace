# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1876 |
| **GitHub Issue** | #1876 |
| **Document Owner** | Alpha Spec Agent |
| **Created** | 2026-01-28 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal user dashboard at `/home` providing at-a-glance progress tracking, task management, activity monitoring, and presentation management.

### Press Release Headline
> "SlideHeroes announces User Dashboard enabling learners to track their presentation skills journey with integrated progress visualization, task management, and presentation access"

### Elevator Pitch (30 seconds)
SlideHeroes users currently navigate between multiple disconnected pages to understand their progress, view tasks, and manage presentations. The new User Dashboard consolidates course progress, self-assessment results, kanban tasks, activity feeds, and presentation outlines into a single, responsive interface that helps users understand where they are in their journey and what to do next.

---

## 2. Problem Statement

### Problem Description
Users currently navigate between multiple disconnected pages to understand their progress, view tasks, check assessments, and manage presentations. There is no unified view showing the user's current state, what they've accomplished, or what they should do next.

### Who Experiences This Problem?
- **Primary**: Active learners using SlideHeroes courses who want to track their progress
- **Secondary**: Users with in-progress presentations who need quick access to their work
- **Tertiary**: Users with task lists who want visibility on upcoming work

### Current Alternatives
- Navigate to `/home/(user)/course` for course progress
- Navigate to `/home/(user)/kanban` for task management
- Navigate to `/home/(user)/assessment/survey` for assessment results
- Navigate to individual presentation pages for outline editing
- No integrated view of all user activity

### Impact of Not Solving
- **Business impact**: Lower engagement and retention due to fragmented experience
- **User impact**: Confusion about progress, missed tasks, difficulty finding relevant actions
- **Competitive impact**: Modern learning platforms offer consolidated dashboard experiences

---

## 3. Vision & Goals

### Product Vision
A beautiful, responsive dashboard that serves as the user's home base - showing exactly where they are in their learning journey, what they should do next, and providing one-click access to all relevant features. The dashboard should load quickly, update efficiently, and adapt seamlessly across devices.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase user engagement | Daily active users on /home | +40% vs current (baseline ~50/day) | Supabase analytics |
| G2: Reduce time to action | Time from login to meaningful action | <15 seconds (from ~45s current) | Session recording analysis |
| G3: Improve course completion | Users who complete >50% of course | +25% within 3 months of launch | course_progress table queries |
| G4: Increase kanban engagement | Tasks completed via dashboard | +20% tasks marked as complete | tasks table status tracking |

### Strategic Alignment
This dashboard directly supports SlideHeroes' mission to help users become better presenters by making their learning journey visible and actionable. It reduces friction to key features and increases engagement with core platform capabilities.

---

## 4. Target Users

### Primary Persona
**Name**: Learning Lauren
**Role**: Professional seeking to improve presentation skills
**Goals**: Complete course modules, track assessment progress, practice with presentations
**Pain Points**: Loses track of progress, forgets incomplete tasks, needs quick access to resume learning
**Quote**: "I want to open SlideHeroes and immediately know what I should work on next"

### Secondary Personas
1. **Busy Brad** - Manager who has limited time, needs quick access to resume where they left off
2. **Organized Oliver** - User who manages multiple projects and needs consolidated task view

### Anti-Personas (Who This Is NOT For)
- Team administrators managing multiple users (they have `/home/[account]`)
- Content creators/instructors (they use Payload CMS)
- First-time visitors (they see marketing pages, not dashboard)

---

## 5. Solution Overview

### Proposed Solution
A 6-widget dashboard arranged in a 3-3-1 responsive grid layout at `/home/(user)/page.tsx`, replacing the current minimal page with a rich, data-driven interface.

### Key Capabilities

1. **Course Progress Radial Widget**: Circular progress chart showing overall course completion percentage with lesson breakdown
2. **Assessment Spider Chart Widget**: Radar/spider diagram visualizing self-assessment scores across presentation skill categories
3. **Kanban Summary Card**: Card showing current "Doing" tasks and next pending task with quick links to kanban board
4. **Activity Feed Widget**: Chronological timeline of user actions (presentations, lessons, quizzes, assessments) with pagination
5. **Quick Actions Panel**: Contextual CTAs based on user state ("Continue Course", "New Presentation", "Complete Assessment", "Review Storyboard")
6. **Presentation Outline Table**: Data table of user's presentations with quick-edit outline buttons, sortable and filterable

### Customer Journey

1. User logs in and lands on `/home` dashboard
2. User sees at-a-glance progress (radial chart, spider diagram)
3. User reviews current tasks and upcoming actions (kanban summary, quick actions)
4. User checks recent activity for context (activity feed)
5. User either continues existing work or starts new task via quick actions
6. User accesses presentations via table for quick outline editing

### Hypothetical Customer Quote
> "Finally, I can see everything in one place! I know exactly where I am in my course and what I should work on next. The quick actions help me pick up right where I left off."
> — Learning Lauren, Marketing Manager

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, widgets stack vertically | Progress widgets side-by-side at 640px+, table scrolls horizontally |
| Tablet (768-1024px) | 2-column grid for row 1 & 2, full-width table | Spider chart and radial chart resize proportionally |
| Desktop (>1024px) | 3-3-1 grid as designed | Full layout with all widgets visible above fold |

---

## 6. Scope Definition

### In Scope

- [x] Course progress radial progress widget with lesson breakdown
- [x] Spider/radar chart for assessment category scores
- [x] Kanban summary card (doing tasks + next task)
- [x] Activity feed with pagination (last 30 days, existing AI request logs)
- [x] Quick actions panel with contextual CTAs
- [x] Presentation outline table with edit buttons
- [x] Responsive grid layout (mobile/tablet/desktop)
- [x] Skeleton loading states for all widgets
- [x] Empty states for each widget

### Out of Scope

- [ ] Real-time WebSocket updates (use polling/refetch for v1)
- [ ] Dashboard customization/widget reordering
- [ ] Team dashboard enhancements (separate feature)
- [ ] Gamification elements (badges, streaks, leaderboards)
- [ ] Push notifications for activity
- [ ] Dashboard analytics/heatmaps
- [ ] Coaching sessions (noted as future consideration below)
- [ ] A/B testing framework

### Future Considerations (v2+)

- WebSocket-based real-time activity feed
- User-configurable widget layout
- Achievement badges and streaks
- Coaching integration (custom booking system)
- Export/share progress reports

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `public.course_progress` | DB Read | Course completion percentages, current_lesson_id |
| `public.lesson_progress` | DB Read | Individual lesson completion tracking |
| `public.quiz_attempts` | DB Read | Quiz scores and completion status |
| `public.survey_responses` | DB Read | Assessment category_scores JSONB for spider chart |
| `public.tasks` / `public.subtasks` | DB Read | Kanban task data (status, priority) |
| `public.building_blocks_submissions` | DB Read | Presentation outlines with storyboard |
| `public.ai_request_logs` | DB Read | Existing table for activity feed (AI usage) |
| Recharts | Client Library | RadialBarChart, RadarChart visualizations |

### Technical Constraints

- **Performance**: Initial load <3 seconds, widgets <500ms individually
- **Security**: All data fetched via RLS-protected Supabase queries
- **Compliance**: No PII in client logs
- **Scalability**: Queries optimized for users with 100+ presentations, 1000+ activity entries

### Technology Preferences/Mandates

- **Charts**: Recharts (already configured via `@kit/ui/chart`)
- **State**: React Query for client-side caching (existing pattern)
- **Data Fetching**: Server component loaders with `Promise.all()` parallel fetching
- **UI Components**: Shadcn/ui Card, Table, Badge, Skeleton from `@kit/ui`

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Recharts performance | External | Low | Already used in team dashboard successfully |
| Survey data structure | Internal | Low | category_scores JSONB format established |
| Activity feed source | Internal | Medium | Use existing ai_request_logs table |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have course progress data**: Most dashboard users have started a course — *Validation: Query course_progress for user distribution*
2. **Assessment completion rate**: >30% of users have completed self-assessment — *Validation: Query survey_responses completion stats*
3. **Existing UI components sufficient**: No new shadcn components needed beyond what's installed — *Validation: Component inventory verified*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Activity feed query performance with 1000+ entries | Medium | High | Use existing ai_request_logs table with indexes on (user_id, request_timestamp), pagination | Dev Team |
| R2 | Spider chart empty state (no assessment) | High | Low | Show "Complete Assessment" CTA instead of empty chart | Dev Team |
| R3 | User confusion with multiple CTAs | Low | Medium | User testing to validate quick actions hierarchy | Product |
| R4 | Large presentation table rendering performance | Medium | Low | Add pagination limit, virtualize if needed | Dev Team |

### Open Questions

1. [ ] Maximum number of presentations to show in table (pagination threshold)?
2. [ ] Should activity feed include non-AI events (course completions, quiz passes)?
3. [ ] Default sort order for presentation table?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 6 widgets render correctly with real data
- [ ] Responsive layout works on mobile (375px), tablet (768px), desktop (1280px)
- [ ] All widgets have loading skeletons and empty states
- [ ] Activity feed populates from ai_request_logs table
- [ ] E2E tests cover dashboard load and widget interactions
- [ ] Performance: LCP <3s, FCP <1.5s on desktop
- [ ] Accessibility: WCAG 2.1 AA compliance (keyboard nav, screen reader)

### Launch Criteria

- [ ] All E2E tests passing in CI
- [ ] Performance budget met (Lighthouse score >80)
- [ ] Feature flag enabled for gradual rollout

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Daily /home page views | 50 | 70 | 2 weeks post-launch |
| Course completion rate | 15% | 19% | 1 month post-launch |
| Task completion rate | N/A | +20% | 1 month post-launch |
| User satisfaction (survey) | N/A | >4.0/5.0 | 1 month post-launch |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page shell, responsive grid, PageHeader integration
2. **Data Layer** (P0) - Dashboard loader, type definitions
3. **Core Components** (P1) - Progress widgets, kanban summary, activity feed, quick actions
4. **Polish & Edge Cases** (P2) - Empty states, skeleton loading, accessibility, E2E tests

### Candidate Initiatives

1. **Dashboard Foundation** (P0): Page shell, responsive grid layout, routing, skeleton containers
2. **Progress & Assessment Widgets** (P1): Radial course progress, spider assessment chart
3. **Activity & Task Widgets** (P1): Activity feed from ai_request_logs, kanban summary, quick actions
4. **Presentation Table & Polish** (P2): Data table, empty states, skeleton refinement, accessibility audit, E2E tests

### Suggested Priority Order

1. **P0 - Foundation**: Page structure, grid layout, type definitions, dashboard loader (parallel data fetching)
2. **P0/P1 - Data Layer**: Dashboard data loader with parallel fetching using Promise.all()
3. **P1 - Progress Widgets**: Radial chart (uses existing RadialProgress pattern), spider chart (Recharts RadarChart)
4. **P1 - Activity Widgets**: Kanban summary, quick actions panel, activity feed
5. **P2 - Polish**: Presentation table, empty states, skeleton refinement, accessibility audit, E2E tests

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Dashboard Grid Layout | Low | Existing pattern in `dashboard-demo-charts.tsx` with responsive breakpoints |
| Radial Progress Widget | Low | `RadialProgress.tsx` component exists in course page |
| Spider/Radar Chart | Medium | Existing `radar-chart.tsx` in assessment, needs adaptation |
| Activity Feed | Medium | Use existing ai_request_logs table, pagination, aggregation queries |
| Kanban Summary | Low | Direct query on existing tasks table with status filter |
| Quick Actions | Low | Conditional rendering based on existing data queries |
| Presentation Table | Medium | Uses existing building_blocks_submissions, needs DataTable integration |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **SCQA Framework** | Situation-Complication-Question-Answer structure for presentations |
| **Radial Progress** | Circular progress indicator showing completion percentage |
| **Spider/Radar Chart** | Multi-axis chart showing scores across categories |
| **Activity Feed** | Chronological list of user actions and events |
| **RLS** | Row Level Security - Supabase's per-row access control |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Yes | SVG-based circular progress, extract to shared |
| CourseProgressBar | `apps/web/app/home/(user)/course/_components/CourseProgressBar.tsx` | Pattern only | Linear progress reference |
| RadarChart (Assessment) | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Recharts RadarChart with category scores |
| Dashboard Grid Layout | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | 1/2/3/4 column responsive grid |
| Card/CardHeader | `packages/ui/src/shadcn/card.tsx` | Yes | Base card components |
| ChartContainer | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with theming |
| DataTable | `packages/ui/src/makerkit/data-table.tsx` | Yes | TanStack Table with sorting/pagination |
| Skeleton | `packages/ui/src/shadcn/skeleton.tsx` | Yes | Loading state component |
| EmptyState | `packages/ui/src/makerkit/empty-state.tsx` | Yes | Empty state component pattern |
| Page Layout | `packages/ui/src/makerkit/page.tsx` | Yes | PageBody, PageHeader primitives |
| Personal Page Header | `apps/web/app/home/(user)/_components/home-page-header.tsx` | Yes | Personal account header wrapper |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `apps/web/supabase/migrations/20250319104726_web_course_system.sql` | Course completion tracking |
| `lesson_progress` | Same migration | Individual lesson progress |
| `quiz_attempts` | Same migration | Quiz scores and answers |
| `survey_responses` | `apps/web/supabase/migrations/20250319104724_web_survey_system.sql` | Assessment category_scores |
| `tasks` | `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status enum |
| `subtasks` | Same migration | Task subtasks |
| `building_blocks_submissions` | `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentation outlines |
| `ai_request_logs` | `apps/web/supabase/migrations/20250416140521_web_ai_usage_cost_tracking.sql` | Existing table for activity feed |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `dashboard-best-practices.md` | 1. 3-3-1 grid works for desktop but must collapse to single-column on mobile<br>2. Follow F-pattern scanning for Western users, place critical KPIs top-left<br>3. Group related components with white space<br>4. Radial charts best for single-value progress (not comparisons)<br>5. Sequential color palettes for progress, avoid red-green combos<br>6. <3s load time target<br>7. Mobile-first approach with Tailwind breakpoints<br>8. Use Grid for 2D layouts, Flexbox for 1D flows | Section 5 (Responsive), Section 10 (Complexity), Section 11.E (Visual Assets) |
| `coaching-alternatives.md` | 1. **Cal.com open-source still available** (AGPLv3, 39,886 stars)<br>2. Self-hosting is recommended for production-grade systems<br>3. Custom build requires Google Calendar API, UTC time storage, Stripe integration<br>4. Time zone handling: store UTC, detect user timezone, use Luxon/date-fns-tz<br>5. Google Calendar API is easiest (4/10 complexity)<br>6. **Decision: Defer coaching to v2** - custom booking requires 2-4 months | Section 6 (Future Considerations), Open Questions |

### D. External References

- [Recharts RadarChart](https://recharts.org/en-US/api/RadarChart)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [Shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Dashboard UX Best Practices](https://www.nngroup.com/articles/dashboard-design/)

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           User Dashboard                                      │
│  Welcome back, [User Name]! Here's your progress overview.           │
├───────────────────────┬───────────────────────┬──────────────────────────────┤
│ Course Progress        │ Assessment Spider      │ Kanban Summary               │
│ ┌─────────────────┐   │ ┌─────────────────┐   │ ┌──────────────────────────┐ │
│ │    ╭───────╮    │   │ │     Content     │   │ │ DOING                    │ │
│ │   ╱    65%  ╲   │   │ │    ╱ · · · ╲    │   │ │ □ Review Module 3 slides │ │
│ │  │          │   │   │ │   ╱ ·     · ╲   │   │ │ □ Practice introduction  │ │
│ │   ╲        ╱    │   │ │  Structure───Delivery│                          │ │
│ │    ╰───────╯    │   │ │   ╲ ·     · ╱   │   │ │ NEXT UP                  │ │
│ │                 │   │   │    ╲ · · · ╱    │   │ │ ○ Complete Quiz 4        │ │
│ │ 13/20 Lessons   │   │ │     Timing      │   │ │                          │ │
│ └─────────────────┘   │ └─────────────────┘   │ │ [View Kanban Board →]    │ │
│                       │ Overall: 72%          │ └──────────────────────────┘ │
├───────────────────────┼───────────────────────┼──────────────────────────────┤
│ Recent Activity        │ Quick Actions          │                            │
│ ┌─────────────────┐   │ ┌─────────────────┐   │                            │
│ │ 📝 Jan 27 14:32 │   │ │ [Continue       │   │                            │
│ │ Updated outline   │   │ │  Course    →]   │   │                            │
│ │ "Q1 Strategy"   │   │ │                 │   │                            │
│ │                 │   │ │ [New            │   │                            │
│ │ ✓ Jan 27 10:15 │   │ │  Presentation→]   │   │                            │
│ │ Completed L12    │   │ │                 │   │                            │
│ │ "Storytelling"   │   │ │ [Complete       │   │                            │
│ │                 │   │ │  Assessment →]   │   │                            │
│ │ 🎯 Jan 26 16:45 │   │ │                 │   │                            │
│ │ Quiz: 85%       │   │ │ [Review         │   │                            │
│ │ Module 3         │   │ │  Storyboard →]   │   │                            │
│ │                 │   │ └─────────────────┘   │                            │
│ │ [Load More...]   │   │                       │                            │
│ └─────────────────┘   │                       │                            │
├───────────────────────┴───────────────────────┴──────────────────────────────┤
│ Presentation Outlines                                                         │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Title                    │ Type          │ Last Updated  │ Actions        ││
│ ├───────────────────────────┼───────────────┼───────────────┼────────────────┤│
│ │ Q1 Strategy Presentation │ Persuasive    │ Jan 27, 2026  │ [Edit Outline] ││
│ │ Team Onboarding Deck     │ Informative   │ Jan 25, 2026  │ [Edit Outline] ││
│ │ Product Launch Keynote   │ Inspirational │ Jan 20, 2026  │ [Edit Outline] ││
│ │ Monthly Review           │ Informative   │ Jan 18, 2026  │ [Edit Outline] ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│                                                     Page 1 of 3 [< 1 2 3 >]  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Mockup Key:**
- Row 1: Course Progress (radial), Assessment Spider, Kanban Summary
- Row 2: Activity Feed (timeline), Quick Actions (contextual CTAs)
- Row 3: Presentation Outline Table (full-width with pagination)

**Component Label Mapping:**

| Mockup Label | Key Capability | Widget Component |
|--------------|----------------|------------------|
| Course Progress | #1 Course progress radial | `<CourseProgressWidget />` |
| Assessment Spider | #2 Spider diagram | `<AssessmentSpiderWidget />` |
| Kanban Summary | #3 Kanban Summary Card | `<KanbanSummaryWidget />` |
| Recent Activity | #4 Activity Feed | `<ActivityFeedWidget />` |
| Quick Actions | #5 Quick Actions Panel | `<QuickActionsPanel />` |
| Presentation Outlines | #6 Presentation table | `<PresentationTableWidget />` |

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-28 | Defer coaching sessions to v2 | Custom booking system requires 2-4 months, complex time zone handling, Google Calendar API integration. Use existing ai_request_logs for activity feed now. | Spec Agent |
| 2026-01-28 | Use existing ai_request_logs table | Avoid creating new activity_logs table, leverage existing infrastructure for activity tracking. | Spec Agent |
| 2026-01-28 | 3-3-1 grid layout | Research shows 3-column layouts work well for desktop dashboards with mobile-first stacking. | Research findings |
| 2026-01-28 | Server component loaders with parallel fetching | Codebase pattern (60-80% faster), consistent with existing dashboard. | Codebase analysis |
| 2026-01-28 | Sequential color palettes for radial progress | Research guidance to avoid red-green combos for accessibility. | Research findings |
