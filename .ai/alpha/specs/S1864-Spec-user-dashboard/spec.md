# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1864 |
| **GitHub Issue** | #1864 |
| **Document Owner** | Alpha Spec Agent |
| **Created** | 2026-01-27 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal user dashboard at `/home` providing at-a-glance progress tracking, task management, activity monitoring, coaching scheduling, and presentation management.

### Press Release Headline
> "SlideHeroes announces User Dashboard enabling learners to track their presentation skills journey with integrated progress visualization, task management, and coaching scheduling"

### Elevator Pitch (30 seconds)
SlideHeroes users currently lack a central hub to view their learning progress, upcoming tasks, and recent activity. The new User Dashboard consolidates course progress, self-assessment results, kanban tasks, activity feeds, quick actions, coaching sessions, and presentation outlines into a single, responsive interface that helps users understand where they are in their journey and what to do next.

---

## 2. Problem Statement

### Problem Description
Users currently navigate between multiple disconnected pages to understand their progress, view tasks, check assessments, and manage presentations. There is no unified view showing the user's current state, what they've accomplished, or what they should do next.

### Who Experiences This Problem?
- **Primary**: Active learners using SlideHeroes courses who want to track their progress
- **Secondary**: Users with in-progress presentations who need quick access to their work
- **Tertiary**: Users considering coaching sessions who want scheduling integration

### Current Alternatives
- Navigate to `/home/(user)/course` for course progress
- Navigate to `/home/(user)/kanban` for task management
- Navigate to `/home/(user)/assessment/survey` for assessment results
- Navigate to individual presentation pages for outline editing
- No integrated coaching session visibility

### Impact of Not Solving
- **Business impact**: Lower engagement and retention due to fragmented experience
- **User impact**: Confusion about progress, missed tasks, difficulty finding relevant actions
- **Competitive impact**: Modern learning platforms offer consolidated dashboard experiences

---

## 3. Vision & Goals

### Product Vision
A beautiful, responsive dashboard that serves as the user's home base - showing exactly where they are in their learning journey, what they should do next, and providing one-click access to all relevant features. The dashboard should load quickly, update in real-time, and adapt seamlessly across devices.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase user engagement | Daily active users on /home | +40% vs current (baseline ~50/day) | Supabase analytics |
| G2: Reduce time to action | Time from login to meaningful action | <15 seconds (from ~45s current) | Session recording analysis |
| G3: Improve course completion | Users who complete >50% of course | +25% within 3 months of launch | course_progress table queries |
| G4: Increase coaching bookings | New coaching session bookings | +30% from dashboard widget | Cal.com webhook analytics |

### Strategic Alignment
This dashboard directly supports SlideHeroes' mission to help users become better presenters by making their learning journey visible and actionable. It reduces friction to key features and increases engagement with core platform capabilities.

---

## 4. Target Users

### Primary Persona
**Name**: Learning Lauren
**Role**: Professional seeking to improve presentation skills
**Goals**: Complete course modules, track assessment progress, practice with presentations
**Pain Points**: Loses track of progress, forgets incomplete tasks, needs coaching accountability
**Quote**: "I want to open SlideHeroes and immediately know what I should work on next"

### Secondary Personas
1. **Busy Brad** - Manager who has limited time, needs quick access to resume where he left off
2. **Coaching Clara** - User who values 1:1 coaching and needs easy session booking/management

### Anti-Personas (Who This Is NOT For)
- Team administrators managing multiple users (they have `/home/[account]`)
- Content creators/instructors (they use Payload CMS)
- First-time visitors (they see marketing pages, not dashboard)

---

## 5. Solution Overview

### Proposed Solution
A 7-widget dashboard arranged in a 3-3-1 responsive grid layout at `/home/(user)/page.tsx`, replacing the current minimal page with a rich, data-driven interface.

### Key Capabilities

1. **Course Progress Radial Widget**: Circular progress chart showing overall course completion percentage with lesson breakdown
2. **Assessment Spider Chart Widget**: Radar/spider diagram visualizing self-assessment scores across presentation skill categories
3. **Kanban Summary Widget**: Card showing current "Doing" tasks and next pending task with quick links to kanban board
4. **Activity Feed Widget**: Chronological timeline of user actions (presentations, lessons, quizzes, assessments) with pagination
5. **Quick Actions Panel**: Contextual CTAs based on user state ("Continue Course", "New Presentation", "Complete Assessment", "Review Storyboard")
6. **Coaching Sessions Widget**: Cal.com integration showing upcoming sessions with join/reschedule links, or booking CTA if no sessions
7. **Presentation Outline Table**: Data table of user's presentations with quick-edit outline buttons, sortable and filterable

### Customer Journey

1. User logs in and lands on `/home` dashboard
2. User sees at-a-glance progress (radial chart, spider diagram)
3. User reviews current tasks and upcoming actions (kanban summary, quick actions)
4. User checks recent activity for context (activity feed)
5. User either continues existing work or starts new task via quick actions
6. User can book/join coaching sessions directly from dashboard
7. User accesses presentations via table for quick outline editing

### Hypothetical Customer Quote
> "Finally, I can see everything in one place! I know exactly where I am in the course and what I should work on next. The coaching widget reminds me about my upcoming session - I would have forgotten otherwise."
> — Learning Lauren, Marketing Manager

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, widgets stack vertically | Progress widgets side-by-side at 375px+, table scrolls horizontally |
| Tablet (768-1024px) | 2-column grid for row 1 & 2, full-width table | Spider chart and radial chart resize proportionally |
| Desktop (>1024px) | 3-3-1 grid as designed | Full layout with all widgets visible above fold |

---

## 6. Scope Definition

### In Scope

- [x] Course progress radial progress widget with lesson breakdown
- [x] Spider/radar chart for assessment category scores
- [x] Kanban summary card (doing tasks + next task)
- [x] Activity feed with pagination (last 30 days, new activity_logs table)
- [x] Quick actions panel with contextual CTAs
- [x] Coaching sessions widget with Cal.com integration (Cal.com ready)
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
- [ ] A/B testing framework

### Future Considerations (v2+)

- WebSocket-based real-time activity feed
- User-configurable widget layout
- Achievement badges and streaks
- Calendar integration beyond Cal.com
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
| `public.activity_logs` | DB Read/Write | **NEW TABLE** - Unified activity tracking |
| Cal.com V2 API | REST API | Fetch upcoming bookings, embed booking widget |
| Recharts | Client Library | RadialBarChart, RadarChart visualizations |

### Technical Constraints

- **Performance**: Initial load <3 seconds, widgets <500ms individually
- **Security**: All data fetched via RLS-protected Supabase queries
- **Compliance**: No PII in client logs, Cal.com data follows their privacy policy
- **Scalability**: Queries optimized for users with 100+ presentations, 1000+ activity entries

### Technology Preferences/Mandates

- **Charts**: Recharts (already configured via `@kit/ui/chart`)
- **State**: React Query for client-side caching (existing pattern)
- **Data Fetching**: Server component loaders with `Promise.all()` parallel fetching
- **UI Components**: Shadcn/ui Card, Table, Badge, Skeleton from `@kit/ui`
- **Cal.com**: Embed script (vanilla JS) - @calcom/atoms is deprecated; use `Cal("inline", {...})` for booking widget

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API availability | External | Medium | Graceful degradation if API unavailable |
| Recharts performance | External | Low | Already used in team dashboard successfully |
| Survey data structure | Internal | Low | category_scores JSONB format established |
| New activity_logs table | Internal | Medium | Requires migration, seed data, RLS policies |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have course progress data**: Most dashboard users have started the course — *Validation: Query course_progress for user distribution*
2. **Assessment completion rate**: >30% of users have completed self-assessment — *Validation: Query survey_responses completion stats*
3. **Cal.com credentials available**: API keys and webhook secrets configured — *Validation: Verify env vars in Vercel*
4. **Existing UI components sufficient**: No new shadcn components needed beyond what's installed — *Validation: Component inventory verified*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limits | Medium | Medium | Cache booking data, implement exponential backoff | Dev Team |
| R2 | Activity feed query performance with 1000+ entries | Medium | High | Add pagination, indexes on activity_logs(user_id, created_at) | Dev Team |
| R3 | Spider chart empty state (no assessment) | High | Low | Show "Complete Assessment" CTA instead of empty chart | Dev Team |
| R4 | User confusion with multiple CTAs | Low | Medium | User testing to validate quick actions hierarchy | Product |

### Open Questions

1. [x] Cal.com integration approach — **Answered: Cal.com ready, proceed with full integration**
2. [x] Activity feed data source — **Answered: Create new activity_logs table**
3. [x] Activity feed date range — **Answered: Last 30 days with pagination**
4. [ ] Should activity feed include system events (login, logout)?
5. [ ] Maximum number of presentations to show in table (pagination threshold)?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 widgets render correctly with real data
- [ ] Responsive layout works on mobile (375px), tablet (768px), desktop (1280px)
- [ ] All widgets have loading skeletons and empty states
- [ ] Cal.com booking and session display functional
- [ ] Activity feed populates from activity_logs table
- [ ] E2E tests cover dashboard load and widget interactions
- [ ] Performance: LCP <3s, FCP <1.5s on desktop
- [ ] Accessibility: WCAG 2.1 AA compliance (keyboard nav, screen reader)

### Launch Criteria

- [ ] All E2E tests passing in CI
- [ ] Performance budget met (Lighthouse score >80)
- [ ] Cal.com webhook configured in production
- [ ] activity_logs migration applied to production
- [ ] Feature flag enabled for gradual rollout

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Daily /home page views | 50 | 70 | 2 weeks post-launch |
| Course completion rate | 15% | 19% | 1 month post-launch |
| Coaching bookings via dashboard | 0 | 10/week | 1 month post-launch |
| User satisfaction (survey) | N/A | >4.0/5.0 | 1 month post-launch |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page shell, responsive grid, PageHeader integration
2. **Data Layer** (P0) - Dashboard loader, activity_logs table/migration, type definitions
3. **Core Components** (P1) - Progress widgets, kanban summary, activity feed, quick actions
4. **Integrations** (P2) - Cal.com coaching widget (higher risk, external dependency)
5. **Polish & Edge Cases** (P3) - Empty states, skeleton loading, accessibility, E2E tests

### Candidate Initiatives

1. **Dashboard Foundation** (P0): Page shell, responsive grid layout, routing, skeleton containers
2. **Progress & Assessment Widgets** (P1): Radial course progress, spider assessment chart
3. **Activity & Task Widgets** (P1): Activity feed with activity_logs table, kanban summary, quick actions
4. **Coaching Integration** (P2): Cal.com widget, booking embed, webhook handler
5. **Presentation Table & Polish** (P3): Data table, empty states, accessibility, E2E tests

### Suggested Priority Order

1. **P0 - Foundation**: Page structure, grid layout, type definitions, dashboard loader (parallel data fetching)
2. **P0/P1 - Data Layer**: activity_logs table migration, RLS policies, seed data
3. **P1 - Progress Widgets**: Radial chart (uses existing RadialProgress pattern), spider chart (Recharts RadarChart)
4. **P1 - Activity Widgets**: Kanban summary, quick actions panel, activity feed
5. **P2 - Coaching**: Cal.com integration (can proceed in parallel once foundation complete)
6. **P3 - Polish**: Presentation table, empty states, skeleton refinement, accessibility audit, E2E tests

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Dashboard Grid Layout | Low | Existing pattern in `dashboard-demo-charts.tsx` with responsive breakpoints |
| Radial Progress Widget | Low | `RadialProgress.tsx` component exists in course page |
| Spider/Radar Chart | Medium | Existing `radar-chart.tsx` in assessment, needs adaptation |
| Activity Feed | Medium | New activity_logs table, pagination, aggregation queries |
| Kanban Summary | Low | Direct query on existing tasks table with status filter |
| Quick Actions | Low | Conditional rendering based on existing data queries |
| Cal.com Integration | Medium | External API, embed script (no package install), webhook handler |
| Presentation Table | Medium | Uses existing building_blocks_submissions, needs DataTable integration |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **SCQA Framework** | Situation-Complication-Question-Answer structure for presentations |
| **Radial Progress** | Circular progress indicator showing completion percentage |
| **Spider/Radar Chart** | Multi-axis chart showing scores across categories |
| **Cal.com Embed** | Vanilla JS embed script for Cal.com scheduling integration (atoms package deprecated) |
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
| `activity_logs` | **NEW - To be created** | Unified activity tracking |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `context7-calcom.md` | 1. **Use embed script** (`Cal("inline", {...})`) - @calcom/atoms is deprecated<br>2. V2 API for fetching upcoming bookings (Bearer auth)<br>3. Webhook signature verification with HMAC-SHA256<br>4. Config options: theme, email, name prefill<br>5. Modal and floating button alternatives available | Section 7 (Technical Context), Section 10 (Complexity - Cal.com rated Medium) |
| `context7-recharts-radar.md` | 1. RadarChart needs PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar<br>2. Data format: array of {category, score, maxScore}<br>3. Use ResponsiveContainer with initialDimension for SSR<br>4. domain={[0, 100]} for percentage scores<br>5. fillOpacity 0.3-0.6 for semi-transparent areas | Section 5 (Spider Chart Widget), Section 10 (Complexity - Medium) |
| `perplexity-dashboard-ux.md` | 1. "5-second rule" - primary metrics top/center<br>2. 12-column responsive grid, 3-6 widgets max per view<br>3. Infinite scroll preferred for activity feeds<br>4. Radial charts for single-metric progress, spider only for multivariate<br>5. <3s load time target (31% abandonment above)<br>6. Lazy load off-screen content (60% initial load reduction) | Section 5 (Layout, Responsive), Section 9 (Performance targets), Section 10 (Priority order) |

### D. External References

- [Cal.com V2 API Documentation](https://cal.com/docs/api-reference/v2)
- [Recharts RadarChart](https://recharts.org/en-US/api/RadarChart)
- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [Shadcn/ui Components](https://ui.shadcn.com/docs/components)

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           User Dashboard                                      │
│  Welcome back, [User Name]! Here's your progress overview.                   │
├───────────────────────┬───────────────────────┬──────────────────────────────┤
│ Course Progress       │ Assessment Spider     │ Kanban Summary               │
│ ┌─────────────────┐   │ ┌─────────────────┐   │ ┌──────────────────────────┐ │
│ │    ╭───────╮    │   │ │     Content     │   │ │ DOING                    │ │
│ │   ╱    65%  ╲   │   │ │    ╱ · · · ╲    │   │ │ □ Review Module 3 slides │ │
│ │  │          │   │   │ │   ╱ ·     · ╲   │   │ │ □ Practice introduction  │ │
│ │   ╲        ╱    │   │ │  Structure───Delivery│ │                          │ │
│ │    ╰───────╯    │   │ │   ╲ ·     · ╱   │   │ │ NEXT UP                  │ │
│ │                 │   │ │    ╲ · · · ╱    │   │ │ ○ Complete Quiz 4        │ │
│ │ 13/20 Lessons   │   │ │     Timing      │   │ │                          │ │
│ └─────────────────┘   │ └─────────────────┘   │ │ [View Kanban Board →]    │ │
│                       │ Overall: 72%          │ └──────────────────────────┘ │
├───────────────────────┼───────────────────────┼──────────────────────────────┤
│ Recent Activity       │ Quick Actions         │ Coaching Sessions            │
│ ┌─────────────────┐   │ ┌─────────────────┐   │ ┌──────────────────────────┐ │
│ │ 📝 Jan 27 14:32 │   │ │ [Continue       │   │ │ UPCOMING                 │ │
│ │ Updated outline │   │ │  Course    →]   │   │ │ ┌──────────────────────┐ │ │
│ │ "Q1 Strategy"   │   │ │                 │   │ │ │ Jan 30, 2:00 PM      │ │ │
│ │                 │   │ │ [New            │   │ │ │ 1:1 Coaching Session │ │ │
│ │ ✓ Jan 27 10:15  │   │ │  Presentation→] │   │ │ │ [Join] [Reschedule]  │ │ │
│ │ Completed L12   │   │ │                 │   │ │ └──────────────────────┘ │ │
│ │ "Storytelling"  │   │ │ [Complete       │   │ │                          │ │
│ │                 │   │ │  Assessment →]  │   │ │ [Book New Session →]     │ │
│ │ 🎯 Jan 26 16:45 │   │ │                 │   │ │                          │ │
│ │ Quiz: 85%       │   │ │ [Review         │   │ │                          │ │
│ │ Module 3        │   │ │  Storyboard →]  │   │ │                          │ │
│ │                 │   │ └─────────────────┘   │ └──────────────────────────┘ │
│ │ [Load More...]  │   │                       │                              │
│ └─────────────────┘   │                       │                              │
├───────────────────────┴───────────────────────┴──────────────────────────────┤
│ Presentation Outlines                                                         │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ Title                    │ Type          │ Last Updated  │ Actions        ││
│ ├──────────────────────────┼───────────────┼───────────────┼────────────────┤│
│ │ Q1 Strategy Presentation │ Persuasive    │ Jan 27, 2026  │ [Edit Outline] ││
│ │ Team Onboarding Deck     │ Informative   │ Jan 25, 2026  │ [Edit Outline] ││
│ │ Product Launch Keynote   │ Inspirational │ Jan 20, 2026  │ [Edit Outline] ││
│ │ Monthly Review           │ Informative   │ Jan 18, 2026  │ [Edit Outline] ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│                                                     Page 1 of 3 [< 1 2 3 >]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Mockup Key:**
- Row 1: Course Progress (radial), Assessment Spider, Kanban Summary
- Row 2: Activity Feed (timeline), Quick Actions (contextual CTAs), Coaching Sessions (Cal.com)
- Row 3: Presentation Outline Table (full-width with pagination)

**Component Label Mapping:**
| Mockup Label | Key Capability | Widget Component |
|--------------|----------------|------------------|
| Course Progress | #1 Course progress radial | `<CourseProgressWidget />` |
| Assessment Spider | #2 Spider diagram | `<AssessmentSpiderWidget />` |
| Kanban Summary | #3 Kanban Summary Card | `<KanbanSummaryWidget />` |
| Recent Activity | #4 Activity Feed | `<ActivityFeedWidget />` |
| Quick Actions | #5 Quick Actions Panel | `<QuickActionsPanel />` |
| Coaching Sessions | #6 Coaching Sessions | `<CoachingSessionsWidget />` |
| Presentation Outlines | #7 Presentation table | `<PresentationTableWidget />` |

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-27 | Use Cal.com embed script over @calcom/atoms | @calcom/atoms (Platform) is deprecated; embed script is the supported approach | User/Spec Agent |
| 2026-01-27 | Create new activity_logs table | User preference for dedicated table over aggregation | User |
| 2026-01-27 | 30-day activity feed with pagination | User preference, balances completeness with performance | User |
| 2026-01-27 | 3-3-1 grid layout | Research shows 3-6 widgets optimal, matches 7-widget requirement | Research |
| 2026-01-27 | Server component loaders with parallel fetching | Codebase pattern (60-80% faster), consistent with existing dashboard | Codebase analysis |
