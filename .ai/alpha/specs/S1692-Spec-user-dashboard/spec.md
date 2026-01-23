# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1692 |
| **GitHub Issue** | #1692 |
| **Document Owner** | Claude Opus 4.5 |
| **Created** | 2026-01-21 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive user dashboard at `/home` providing at-a-glance progress tracking, task management, activity insights, and quick actions for the presentation development workflow.

### Press Release Headline
> "SlideHeroes announces User Dashboard enabling learners to track progress, manage tasks, and accelerate their presentation journey from a single unified view"

### Elevator Pitch (30 seconds)
The User Dashboard is the central command center for SlideHeroes users. It consolidates course progress, self-assessment insights, task management, recent activity, coaching sessions, and presentation outlines into a single, actionable view. Users can immediately see where they are in their learning journey, what tasks need attention, and take quick actions to continue their progress - all without navigating to multiple pages.

---

## 2. Problem Statement

### Problem Description
Users currently lack a unified view of their SlideHeroes journey. Progress data, tasks, presentations, and coaching sessions are scattered across different pages, requiring users to navigate multiple sections to understand their current state and decide what to do next.

### Who Experiences This Problem?
- **Active learners** who want to quickly resume where they left off
- **Busy professionals** with limited time who need to maximize each session
- **New users** who need orientation and guidance on next steps
- **Returning users** who want to pick up momentum after a gap

### Current Alternatives
Today, users must:
1. Visit `/home/course` to check course progress
2. Visit `/home/assessment` to view self-assessment results
3. Visit `/home/kanban` to manage tasks
4. Visit `/home/coaching` to book/view sessions
5. Visit `/home/ai/canvas` or `/home/ai/storyboard` for presentations

### Impact of Not Solving
- **Business impact**: Lower engagement, higher churn from friction in the user journey
- **User impact**: Frustration from context-switching, difficulty maintaining momentum
- **Competitive impact**: Competitors with unified dashboards provide better user experience

---

## 3. Vision & Goals

### Product Vision
A personalized, intelligent dashboard that serves as the user's daily starting point - immediately showing what matters most, celebrating progress, and providing frictionless paths to continue their presentation development journey.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase daily active usage | Dashboard page views per user/week | +40% vs current /home visits (baseline ~500/week) | PostHog analytics |
| G2: Reduce time to first action | Seconds from page load to first interaction | <10 seconds for 80% of sessions | PostHog funnel tracking |
| G3: Improve course completion rates | Users completing full course | +25% over 90 days | Supabase `course_progress.completed_at` |
| G4: Increase coaching session bookings | Weekly coaching bookings | +30% over 60 days | Cal.com API metrics |

### Strategic Alignment
This dashboard directly supports SlideHeroes' mission to help professionals become better presenters by:
- Reducing friction in the learning journey
- Providing motivation through visible progress
- Enabling quick access to high-value features (AI tools, coaching)

---

## 4. Target Users

### Primary Persona
**Name**: Alex the Ambitious Professional
**Role**: Mid-level manager preparing for career-defining presentations
**Goals**: Master presentation skills efficiently while balancing busy schedule
**Pain Points**: Limited time, needs to maximize every learning session, loses momentum between sessions
**Quote**: "I have 20 minutes before my next meeting - I want to see exactly where I left off and make progress right now."

### Secondary Personas
1. **Jordan the New User** - Just signed up, needs guidance on where to start and what to do first
2. **Taylor the Power User** - Deep into the course, wants quick access to advanced tools and upcoming coaching

### Anti-Personas (Who This Is NOT For)
- Team administrators managing multiple users (separate admin dashboard)
- Content creators/instructors (different workflow)
- Casual browsers not committed to the learning journey

---

## 5. Solution Overview

### Proposed Solution
A 7-widget dashboard organized in a 3-3-1 grid layout:
- **Row 1**: Course Progress, Self-Assessment Spider Chart, Kanban Summary
- **Row 2**: Activity Feed, Quick Actions, Coaching Sessions
- **Row 3**: Presentation Outline Table (full width)

### Key Capabilities

1. **Course Progress Radial Graph**: SVG-based circular progress indicator showing overall course completion percentage with lesson breakdown on hover
2. **Self-Assessment Spider/Radar Chart**: Recharts-based radar visualization of skill scores across 5-8 categories from the self-assessment survey
3. **Kanban Summary Card**: Shows current "Doing" tasks and next recommended task with quick navigation to full kanban board
4. **Recent Activity Feed**: Timeline of user actions (presentations created/updated, lessons completed, quiz scores, assessments completed)
5. **Quick Actions Panel**: Contextual CTAs based on user state (Continue Course, New Presentation, Complete Assessment, Review Storyboard)
6. **Coaching Sessions Widget**: Shows upcoming sessions with join/reschedule links, or booking CTA if none scheduled
7. **Presentation Outline Table**: Data table listing all user presentations with quick-edit actions

### Customer Journey

1. User logs in and lands on `/home` dashboard
2. User immediately sees their course progress (motivation) and any in-progress tasks
3. User clicks "Continue Course" to resume learning OR clicks on a specific task
4. User completes a lesson/task, returns to dashboard to see updated progress
5. User books a coaching session or starts a new presentation from quick actions
6. User returns daily, building habit through visible progress and easy resumption

### Hypothetical Customer Quote
> "The dashboard completely changed how I use SlideHeroes. I can see my progress at a glance and always know exactly what to do next. I've finally finished the course and booked my first coaching session!"
> — Alex, Marketing Manager

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked widgets | All widgets stack vertically, table scrolls horizontally |
| Tablet (768-1024px) | 2-column grid for rows 1-2 | Presentation table spans full width |
| Desktop (>1024px) | 3-3-1 grid layout | Primary design target, optimal experience |

---

## 6. Scope Definition

### In Scope

- [x] Course progress radial visualization (reuse existing `RadialProgress` component)
- [x] Self-assessment spider/radar chart using Recharts
- [x] Kanban summary card with current/next task display
- [x] Activity feed timeline (last 10 items)
- [x] Quick actions panel with contextual state-based CTAs
- [x] Coaching sessions widget with Cal.com integration
- [x] Presentation outline data table with edit actions
- [x] Responsive layout (mobile, tablet, desktop)
- [x] Loading skeletons for all widgets
- [x] Empty states for each widget

### Out of Scope

- [ ] Real-time notifications/alerts (future enhancement)
- [ ] Widget customization/drag-and-drop reordering (v2+)
- [ ] Team/shared dashboards (separate feature)
- [ ] AI-powered recommendations widget (future initiative)
- [ ] Gamification elements (badges, streaks, leaderboards)
- [ ] Dark mode specific optimizations (uses existing theme)

### Future Considerations (v2+)
- Widget customization and layout preferences
- AI-powered "What to do next" recommendations
- Integration with external calendar (Google/Outlook)
- Social features (team activity, sharing progress)
- Achievement badges and streaks

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `public.course_progress` | Supabase RLS | Course completion percentage, current lesson |
| `public.lesson_progress` | Supabase RLS | Individual lesson completion status |
| `public.quiz_attempts` | Supabase RLS | Quiz scores for activity feed |
| `public.survey_responses` | Supabase RLS | Category scores for spider chart |
| `public.tasks` | Supabase RLS | Kanban task status for summary |
| `public.subtasks` | Supabase RLS | Subtask completion counts |
| `public.building_blocks_submissions` | Supabase RLS | Presentation outlines for table |
| Payload CMS `courses` collection | REST API | Course metadata (title, lesson count) |
| Cal.com API v2 | External API | Upcoming bookings via `@calcom/atoms` |

### Technical Constraints

- **Performance**: Dashboard must load in <2 seconds (LCP), all widgets parallel-loaded
- **Security**: All data fetched via RLS-protected queries, no admin client usage
- **Compliance**: No PII exposed in client logs, user data only accessible to owner
- **Scalability**: Efficient queries with proper indexes, pagination for activity feed

### Technology Preferences/Mandates

- **Charts**: Recharts (already used in `dashboard-demo-charts.tsx`)
- **Data Fetching**: Server components with parallel `Promise.all()` pattern
- **UI Components**: Shadcn Card, Table, Badge, Progress from `@kit/ui`
- **Cal.com**: `@calcom/atoms` package (requires `CAL_OAUTH_CLIENT_ID` env var)
- **State Management**: React Query for client-side caching where needed

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API access | External | Medium | Requires OAuth client ID setup, API key |
| `@calcom/atoms` package | External | Low | Well-documented, stable package |
| Recharts | External | Low | Already in use, proven stable |
| Self-assessment survey completion | Internal | Low | Data may be empty if user hasn't taken survey |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have course progress data**: Most users will have started the course — *Validation: Check `course_progress` table has records*
2. **Cal.com OAuth credentials available**: Environment will have Cal.com API access — *Validation: Check env vars exist*
3. **Self-assessment data exists**: Users have completed at least one survey response — *Validation: Check `survey_responses.category_scores` field*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API unavailable/rate-limited | Low | Medium | Graceful fallback to booking link, cache responses | Dev Team |
| R2 | Performance degradation from parallel queries | Medium | Medium | Query optimization, skeleton loading, pagination | Dev Team |
| R3 | Empty state confusion for new users | Medium | Low | Well-designed empty states with onboarding CTAs | Dev Team |
| R4 | Spider chart unreadable with <3 categories | Low | Low | Show message if insufficient assessment data | Dev Team |

### Open Questions

1. [ ] Should the activity feed include team activity if user is part of a team account?
2. [ ] What is the maximum number of presentations to show in the table before pagination?
3. [ ] Should coaching widget show Cal.com inline booker or link to separate page?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 widgets implemented and functional
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Loading skeletons for all async data
- [ ] Empty states designed and implemented
- [ ] Unit tests for data loaders (>80% coverage)
- [ ] E2E test for dashboard page load
- [ ] Performance: LCP <2s, no layout shift
- [ ] Accessibility: WCAG 2.1 AA compliant

### Launch Criteria

- [ ] Dashboard accessible at `/home` route
- [ ] All environment variables documented
- [ ] Cal.com integration tested with real credentials
- [ ] Analytics events tracked for widget interactions
- [ ] No blocking bugs in production

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Dashboard page views | ~500/week | 700/week | 30 days |
| Avg time on dashboard | 0 (new page) | >45 seconds | 30 days |
| Course completion rate | Current baseline | +15% | 90 days |
| Coaching bookings | Current baseline | +20% | 60 days |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page structure, grid layout, routing, shell components
2. **Data Layer** (P0/P1) - Unified loader for all dashboard data with parallel fetching
3. **Core Components** - Individual widget implementations (7 widgets)
4. **Integrations** - Cal.com external API integration (higher risk, can parallelize)
5. **Polish & Edge Cases** - Empty states, loading states, error handling, accessibility

### Candidate Initiatives

1. **Dashboard Foundation** (P0): Page layout, grid structure, responsive breakpoints, page header - maps to Foundation/Layout
2. **Data Layer & Loaders** (P0): Unified dashboard loader with parallel fetching for all data sources - maps to Data Layer
3. **Progress & Assessment Widgets** (P1): Course progress radial + spider chart - maps to Key Capabilities 1 & 2
4. **Task & Activity Widgets** (P1): Kanban summary + activity feed - maps to Key Capabilities 3 & 4
5. **Actions & Coaching Widgets** (P1): Quick actions + Cal.com integration - maps to Key Capabilities 5 & 6
6. **Presentation Table Widget** (P1): Data table with actions - maps to Key Capability 7
7. **Polish & Testing** (P2): Empty states, loading skeletons, error handling, E2E tests

### Suggested Priority Order

1. **P0**: Foundation + Data Layer (must complete before widgets)
2. **P1**: Progress & Assessment Widgets (can parallel with #3, #4)
3. **P1**: Task & Activity Widgets (can parallel with #2, #4)
4. **P1**: Actions & Coaching Widgets (can parallel with #2, #3)
5. **P1**: Presentation Table Widget (can parallel with #2-4)
6. **P2**: Polish & Testing (after all widgets complete)

> **Note**: Initiatives 2-5 can run in parallel once Foundation is complete. Cal.com integration (in #4) is higher risk and may require spike if OAuth setup is complex.

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Dashboard Layout | Low | Existing grid patterns in `dashboard-demo-charts.tsx` (3-col, 4-col grids) |
| Course Progress Widget | Low | Existing `RadialProgress.tsx` component can be reused directly |
| Spider Chart | Medium | Recharts available but no existing radar chart implementation |
| Kanban Summary | Low | Existing `use-tasks.ts` hooks and `tasks` table schema |
| Activity Feed | Medium | No existing activity log table - may need new table or aggregate queries |
| Quick Actions | Low | Simple conditional rendering based on existing data |
| Cal.com Integration | High | External API, requires OAuth setup, new dependency `@calcom/atoms` |
| Presentation Table | Low | Existing `building_blocks_submissions` table, shadcn DataTable available |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Radial Progress** | Circular progress indicator showing percentage completion |
| **Spider/Radar Chart** | Multi-axis chart showing values across multiple categories |
| **Kanban** | Task management methodology with columns (To Do, Doing, Done) |
| **Cal.com Atoms** | React component library for Cal.com integration |
| **RLS** | Row Level Security - Supabase feature for data access control |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Yes | SVG-based, customizable size/stroke |
| Dashboard Grid Layout | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | 4-col responsive grid pattern |
| Card Components | `packages/ui/src/shadcn/card.tsx` | Yes | Card, CardHeader, CardContent, CardFooter |
| Chart Container | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with tooltip support |
| Data Table | `packages/ui/src/shadcn/data-table.tsx` | Yes | Sorting, filtering, pagination |
| Kanban Hooks | `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts` | Yes | React Query hooks for tasks |
| Task Schema | `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts` | Yes | Zod schemas for tasks |
| Page Layout | `apps/web/app/home/(user)/page.tsx` | Pattern only | Empty PageBody ready for content |
| HomeLayoutPageHeader | `@kit/ui/page` | Yes | Standard page header component |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `migrations/20250319104726_web_course_system.sql` | Overall course completion tracking |
| `lesson_progress` | Same migration | Individual lesson tracking |
| `quiz_attempts` | Same migration | Quiz scores with JSONB answers |
| `survey_responses` | `migrations/20250319104724_web_survey_system.sql` | Assessment results with `category_scores` JSONB |
| `tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status enum |
| `subtasks` | Same migration | Task subtasks with completion |
| `building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentation outlines |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `context7-recharts-radar.md` | Use `RadarChart` with `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`; wrap in `ResponsiveContainer`; limit to 5-8 categories; `fillOpacity` 0.4-0.6 | Section 5 Key Capabilities #2, Section 7 Tech Context |
| `perplexity-dashboard-ux.md` | 5-second rule for dashboard comprehension; F-pattern scanning; limit to 5-7 primary metrics; contextual CTAs at decision points; mid-content CTAs boost conversions 32% | Section 5 Layout, Section 6 Scope, Section 10 Decomposition |
| `context7-calcom.md` | Use `@calcom/atoms` with `CalProvider`, `useBookings` hook; API v2 with Bearer auth; reschedule via `rescheduleUid` prop; webhook events for real-time | Section 5 Key Capability #6, Section 7 Dependencies |

### D. External References

- [Recharts RadarChart Documentation](https://recharts.org/en-US/api/RadarChart)
- [Cal.com Atoms Documentation](https://cal.com/docs/platform/atoms)
- [Cal.com API v2 Reference](https://cal.com/docs/api-reference/v2)
- [Shadcn UI Components](https://ui.shadcn.com/docs/components)

### E. Visual Assets

**ASCII Layout Mockup:**

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              User Dashboard                                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ Course Progress     │  │ Skills Assessment   │  │ Kanban Summary          │   │
│  │                     │  │                     │  │                         │   │
│  │    ╭───────╮        │  │      Content        │  │ DOING:                  │   │
│  │   ╱   72%   ╲       │  │    ╱        ╲       │  │ • Build argument map    │   │
│  │  │           │      │  │   ╱          ╲      │  │   (3/5 subtasks)        │   │
│  │   ╲         ╱       │  │  Delivery─────Design│  │                         │   │
│  │    ╰───────╯        │  │   ╲          ╱      │  │ NEXT:                   │   │
│  │                     │  │    ╲        ╱       │  │ • Develop outline       │   │
│  │ 18 of 25 lessons    │  │    Engagement       │  │                         │   │
│  │ [Continue Course]   │  │                     │  │ [View Kanban →]         │   │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────────┘   │
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ Recent Activity     │  │ Quick Actions       │  │ Coaching Sessions       │   │
│  │                     │  │                     │  │                         │   │
│  │ • Completed Lesson 5│  │ [▶ Continue Course] │  │ Next Session:           │   │
│  │   Today, 2:30 PM    │  │                     │  │ Jan 25, 3:00 PM         │   │
│  │                     │  │ [+ New Presentation]│  │                         │   │
│  │ • Quiz Score: 85%   │  │                     │  │ [Join] [Reschedule]     │   │
│  │   Yesterday         │  │ [📋 Complete       │  │                         │   │
│  │                     │  │    Assessment]      │  │ ─────────────────────   │   │
│  │ • Started Course    │  │                     │  │                         │   │
│  │   Jan 15            │  │ [📝 Review         │  │ [Book New Session]      │   │
│  │                     │  │    Storyboard]      │  │                         │   │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────────┘   │
│                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │ Presentation Outlines                                            [+ New] │    │
│  ├──────────────────────────────────────────────────────────────────────────┤    │
│  │ Title                    │ Type         │ Updated      │ Actions        │    │
│  ├──────────────────────────┼──────────────┼──────────────┼────────────────┤    │
│  │ Q1 Sales Strategy        │ Persuasive   │ Today        │ [Edit] [View]  │    │
│  │ Team Kickoff 2026        │ Informative  │ Jan 18       │ [Edit] [View]  │    │
│  │ Product Launch Plan      │ Pitch        │ Jan 10       │ [Edit] [View]  │    │
│  └──────────────────────────┴──────────────┴──────────────┴────────────────┘    │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Mockup Requirements Checklist:**
- [x] Component names match Key Capabilities (Section 5)
- [x] Layout matches 3-3-1 grid description
- [x] Sample content shows what each component displays
- [x] Table shows column structure (Title, Type, Updated, Actions)

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-21 | Use Recharts for spider chart | Already used in codebase, consistent with existing patterns | Spec Author |
| 2026-01-21 | Use `@calcom/atoms` for Cal.com integration | Provides React hooks and components, cleaner than iframe | Research |
| 2026-01-21 | 3-3-1 grid layout | Balances information density with readability, follows F-pattern | UX Research |
| 2026-01-21 | No real-time notifications in v1 | Reduces complexity, can add in v2 | Scope Control |
