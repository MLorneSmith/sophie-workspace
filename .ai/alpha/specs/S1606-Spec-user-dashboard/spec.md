# Project Specification: User Dashboard

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1606 |
| **GitHub Issue** | #1606 |
| **Document Owner** | Claude |
| **Created** | 2026-01-20 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal dashboard at `/home` providing users with a unified view of their learning progress, presentation workflow, activities, and coaching sessions.

### Press Release Headline
> "SlideHeroes launches Personal Dashboard enabling users to track progress, manage presentations, and accelerate their learning journey in one unified view"

### Elevator Pitch (30 seconds)
SlideHeroes users currently navigate between multiple pages to check course progress, manage presentations, and book coaching sessions. The Personal Dashboard consolidates these touchpoints into a single, actionable view with 7 key components: course progress visualization, self-assessment spider chart, kanban summary, activity feed, quick actions, coaching sessions, and a presentation outline table. This reduces friction and increases user engagement by surfacing the right information at the right time.

---

## 2. Problem Statement

### Problem Description
Users lack a centralized view of their SlideHeroes journey. Currently, they must:
- Navigate to `/home/course` to check course progress
- Visit `/home/assessment` to see self-assessment results
- Open `/home/kanban` to view current tasks
- Go to `/home/ai` to manage presentations
- Check `/home/coaching` to book sessions

This fragmented experience leads to lower engagement and users missing important next steps.

### Who Experiences This Problem?
- **Active learners**: Users mid-course who need to track progress and complete next lessons
- **Presentation creators**: Users with presentations in various stages who need quick access to outlines
- **Coaching clients**: Users who have booked or need to book coaching sessions

### Current Alternatives
- Manually navigating between 5+ pages to get a complete picture
- Relying on email notifications (if configured)
- No alternative for at-a-glance progress visibility

### Impact of Not Solving
- **Business impact**: Lower user engagement, reduced course completion rates, decreased coaching session bookings
- **User impact**: Frustration from context-switching, missed learning opportunities, incomplete presentations
- **Competitive impact**: Users may prefer competitors with better dashboard experiences

---

## 3. Vision & Goals

### Product Vision
A personal command center that surfaces the most important information and actions for each user based on their current state. Users should be able to understand their progress and take their next best action within 10 seconds of landing on the dashboard.

### Primary Goals (SMART)

| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase user engagement | Daily active users on `/home` | +40% DAU within 30 days of launch | Analytics (page views, session duration) |
| G2: Improve course completion | Course completion rate | +25% completion rate within 60 days | Database query on `course_progress` |
| G3: Boost presentation activity | Presentations edited per user/week | +30% edits via dashboard quick access | Track outline button clicks |
| G4: Increase coaching bookings | Coaching session bookings | +20% booking rate via dashboard CTA | Cal.com API booking attribution |

### Strategic Alignment
Aligns with SlideHeroes' mission to be the one-stop platform for presentation excellence. The dashboard embodies the "learning + doing" philosophy by connecting course content with practical presentation creation.

---

## 4. Target Users

### Primary Persona
**Name**: Sarah the Active Learner
**Role**: Marketing Manager taking the SlideHeroes course
**Goals**: Complete the course, create better presentations for work, track her improvement
**Pain Points**: Loses track of where she left off, forgets to complete assessments, misses scheduled coaching sessions
**Quote**: "I want to open SlideHeroes and immediately know what I should do next without hunting through menus."

### Secondary Personas
1. **Mike the Presentation Pro**: Completed the course, uses SlideHeroes primarily for presentation creation. Needs quick access to outlines and storyboards.
2. **Lisa the New User**: Just started, hasn't completed assessment. Needs clear onboarding guidance via CTAs.

### Anti-Personas (Who This Is NOT For)
- Team administrators managing multiple users (use team dashboard at `/home/[account]`)
- Unauthenticated visitors (marketing pages serve this audience)
- Users who only use the AI canvas without the course

---

## 5. Solution Overview

### Proposed Solution
Build a 7-component dashboard at `/home/(user)/page.tsx` using a 3-column responsive grid layout:

**Row 1 (3 columns):**
1. Course Progress Radial Graph
2. Self-Assessment Spider Chart
3. Kanban Summary Card

**Row 2 (3 columns):**
4. Recent Activity Feed
5. Quick Actions Panel
6. Coaching Sessions Card

**Row 3 (full width):**
7. Presentation Outline Table

### Key Capabilities

1. **Course Progress Visualization**: Radial progress chart showing completion percentage with lesson count and current lesson indicator
2. **Self-Assessment Spider Chart**: Radar chart displaying category scores from the most recent assessment survey
3. **Kanban Summary**: Current "Doing" task and next "To Do" task from the user's kanban board
4. **Activity Feed**: Timeline of recent actions (presentations, lessons, quizzes, assessments) with timestamps
5. **Quick Actions Panel**: Contextual CTAs based on user state (Continue Course, New Presentation, Complete Assessment, Review Storyboard)
6. **Coaching Sessions**: Display upcoming sessions from Cal.com API or booking CTA if none scheduled
7. **Presentation Table**: List of user's presentations with quick-edit outline buttons

### Customer Journey

1. User logs in and lands on `/home` dashboard
2. Sees course progress (65%) and current lesson indicator
3. Notices incomplete assessment in Quick Actions → clicks "Complete Assessment"
4. After assessment, returns to dashboard to see updated spider chart
5. Sees "Doing" task from kanban is "Complete lesson 12" → clicks to continue
6. Notices upcoming coaching session in 2 days → clicks join link to add to calendar
7. Scrolls to presentations, clicks edit on "Q1 Sales Pitch" outline

### Hypothetical Customer Quote
> "The dashboard is exactly what I needed - I can see my progress, what I'm working on, and what's coming up. I actually complete more lessons now because it's so easy to pick up where I left off."
> — Sarah, Marketing Manager

### Responsive Behavior

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Mobile (<768px) | Single column, stacked | Cards stack vertically, presentation table scrolls horizontally |
| Tablet (768-1024px) | 2 columns | Row 1&2 become 2x2 grid, presentation table full width |
| Desktop (>1024px) | 3 columns + full width row | Primary design target per mockup |

---

## 6. Scope Definition

### In Scope

- [x] Course progress radial chart component
- [x] Self-assessment spider/radar chart component
- [x] Kanban summary card (current task + next task)
- [x] Recent activity feed (10-20 items with infinite scroll)
- [x] Quick actions panel with contextual CTAs
- [x] Coaching sessions card with Cal.com API integration
- [x] Presentation outline table with edit buttons
- [x] Dashboard page loader with parallel data fetching
- [x] Responsive layout (mobile, tablet, desktop)
- [x] Loading skeletons for all components
- [x] Empty states for components with no data

### Out of Scope

- [ ] Team dashboard (separate feature for `/home/[account]`)
- [ ] Real-time WebSocket updates (use polling/refresh)
- [ ] Dashboard customization (drag-and-drop widget arrangement)
- [ ] Analytics/metrics beyond existing database fields
- [ ] Push notifications or email integration
- [ ] Gamification elements (badges, streaks, leaderboards)
- [ ] Export functionality for progress data

### Future Considerations (v2+)

- Drag-and-drop dashboard customization
- Real-time activity updates via Supabase realtime
- Goal setting and milestone tracking
- Personalized recommendations using AI
- Comparison with cohort averages

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| `course_progress` table | DB/Supabase | Fetch completion_percentage, current_lesson_id, completed_at |
| `lesson_progress` table | DB/Supabase | Count completed lessons for progress calculation |
| `survey_responses` table | DB/Supabase | Fetch category_scores JSONB for spider chart |
| `tasks` table | DB/Supabase | Query status='doing' and status='do' for kanban summary |
| `building_blocks_submissions` table | DB/Supabase | List presentations with title, outline for table |
| `quiz_attempts` table | DB/Supabase | Include in activity feed |
| Cal.com API v2 | External REST API | Fetch upcoming bookings via `GET /v2/bookings?status=upcoming` |
| Payload CMS | API | Fetch lesson metadata for activity feed enrichment |

### Technical Constraints

- **Performance**: Dashboard must load in <3 seconds (LCP), skeleton states shown within 500ms
- **Security**: All data fetched server-side via RLS-protected queries; Cal.com API key stored as server env variable
- **Compliance**: No PII exposed in client-side caching; GDPR-compliant data handling
- **Scalability**: Parallel data fetching with `Promise.all()` to prevent waterfall

### Technology Preferences/Mandates

- Use existing `RadialProgress` component from `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
- Use existing `RadarChart` component from `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- Use Shadcn Card, Table, Badge components from `@kit/ui`
- Follow loader pattern: `apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts`
- Use React Query for client-side data fetching where needed
- Server Components for initial render; client components only for interactivity

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API Key | Infrastructure | Medium | Required for coaching sessions; API v2 stable, v1 deprecated Feb 2026 |
| Existing RadialProgress | Course feature | Low | Already implemented and tested |
| Existing RadarChart | Assessment feature | Low | Already implemented and tested |
| Database tables | DBA | Low | All tables exist with RLS policies |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have course data**: Most users will have started the course and have progress data — *Validation: Check `course_progress` table for null percentages*
2. **Cal.com API availability**: Cal.com API will remain stable and accessible — *Validation: Monitor Cal.com status page; implement fallback CTA*
3. **Assessment completion**: Users have completed at least one assessment — *Validation: Show "Complete Assessment" CTA if no survey_responses*
4. **Reasonable data volume**: Users have <100 presentations, <50 activity items to display — *Validation: Add pagination limits*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limits hit during peak usage | Medium | Medium | Implement 5-minute caching, use webhooks for updates | Backend |
| R2 | Dashboard load time exceeds 3 seconds | Low | High | Parallel fetching, skeleton states, lazy load below-fold | Frontend |
| R3 | Empty state confusion for new users | Medium | Medium | Design clear empty states with actionable CTAs | Design |
| R4 | Spider chart rendering issues on mobile | Low | Low | Test responsive behavior, fallback to list view if needed | Frontend |

### Open Questions

1. [ ] Should the activity feed show team activities or only personal? → **Decision: Personal only (per interview)**
2. [x] Cal.com API integration approach → **Decision: Direct API calls with caching (per interview)**
3. [x] Dashboard scope (personal vs team) → **Decision: Personal only at `/home/(user)` (per interview)**

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 dashboard components implemented and functional
- [ ] Responsive layout working on mobile, tablet, desktop
- [ ] Loading skeletons implemented for all components
- [ ] Empty states designed and implemented for each component
- [ ] Cal.com API integration working with caching
- [ ] Dashboard loads in <3 seconds on desktop
- [ ] All TypeScript types properly defined (no `any`)
- [ ] Unit tests for data loaders (80% coverage)
- [ ] E2E test for dashboard smoke test
- [ ] Documentation updated

### Launch Criteria

- [ ] Staging environment tested by product team
- [ ] Performance benchmarks met (<3s LCP, <1.5s FCP)
- [ ] Cal.com API key configured in production
- [ ] Analytics events implemented for tracking goals
- [ ] Rollback plan documented

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Daily active users on `/home` | ~500/day | ~700/day (+40%) | 30 days |
| Course completion rate | 35% | 44% (+25%) | 60 days |
| Average session duration | 4 min | 6 min (+50%) | 30 days |
| Coaching bookings via dashboard | 0 (new) | 20/week | 30 days |

---

## 10. Decomposition Hints

### Standard Initiative Categories to Consider

1. **Foundation/Layout** (P0) - Dashboard page structure, grid layout, routing, shell components
2. **Data Layer** (P0/P1) - Loaders for all 7 data sources, parallel fetching, caching, type definitions
3. **Core Components** - The 7 dashboard widgets/components that deliver user value
4. **Integrations** - Cal.com API integration (higher risk, can be parallel)
5. **Polish & Edge Cases** - Empty states, loading states, error handling, accessibility

### Candidate Initiatives

1. **Dashboard Foundation** (P0): Page structure, responsive grid layout, navigation update, base card layout
2. **Data Layer & Loaders** (P0): Dashboard page loader, parallel data fetching, type definitions, caching strategy
3. **Progress Visualization** (P1): Course progress radial chart, self-assessment spider chart
4. **Task & Activity Components** (P1): Kanban summary card, recent activity feed
5. **Action & Booking Components** (P1): Quick actions panel, coaching sessions card with Cal.com integration
6. **Presentation Management** (P1): Presentation outline table with edit actions
7. **Polish & States** (P2): Loading skeletons, empty states, error boundaries, accessibility audit

### Suggested Priority Order

1. **P0 - Foundation & Data Layer**: Must be done first; all components depend on layout and data
2. **P1 - Core Components**: Can be parallelized after foundation; 4 initiatives can run concurrently
3. **P2 - Polish**: Final pass after all components are functional

> **Rule**: Foundation and Data Layer are P0. Cal.com integration is medium risk due to external dependency but can run in parallel with other P1 work.

### Complexity Indicators

| Area | Complexity | Rationale (based on codebase findings) |
|------|------------|----------------------------------------|
| Dashboard Layout | Low | Existing grid patterns in `dashboard-demo-charts.tsx` (900 lines of examples) |
| Course Progress | Low | `RadialProgress` component already exists at `/course/_components/RadialProgress.tsx` |
| Spider Chart | Low | `RadarChart` component already exists at `/assessment/survey/_components/radar-chart.tsx` |
| Kanban Summary | Low | `tasks` table exists with status field; simple query |
| Activity Feed | Medium | Requires aggregating from 4 tables; no existing feed component |
| Quick Actions | Low | Conditional rendering based on user state; straightforward logic |
| Coaching Sessions | Medium | External Cal.com API integration; requires caching and error handling |
| Presentation Table | Low | `building_blocks_submissions` table exists; use existing data-table |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Radial Progress** | Circular progress indicator showing percentage completion |
| **Spider/Radar Chart** | Multi-axis chart displaying category scores as a polygon |
| **Kanban** | Task management system with columns (do, doing, done) |
| **Building Blocks** | Presentation components (title, audience, situation, complication, answer, outline) |
| **Storyboard** | Visual slide sequence stored as JSONB in `building_blocks_submissions` |

### B. Codebase Exploration Results (REQUIRED)

| Component/Pattern Found | File Path | Reusable? | Notes |
|------------------------|-----------|-----------|-------|
| RadialProgress | `apps/web/app/home/(user)/course/_components/RadialProgress.tsx` | Yes | Circular progress indicator, tested and styled |
| RadarChart | `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx` | Yes | Spider chart using Recharts |
| Dashboard Demo Charts | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` | Pattern only | 900 lines of chart patterns to follow |
| User Workspace Loader | `apps/web/app/home/(user)/_lib/server/load-user-workspace.ts` | Pattern only | Cached loader with parallel fetching |
| Card Components | `packages/ui/src/shadcn/card.tsx` | Yes | Card, CardHeader, CardTitle, CardContent, CardFooter |
| Chart Container | `packages/ui/src/shadcn/chart.tsx` | Yes | Recharts wrapper with theming |
| Enhanced Data Table | `packages/ui/src/makerkit/data-table.tsx` | Yes | 1080-line enterprise table with pagination |
| Badge | `packages/ui/src/shadcn/badge.tsx` | Yes | 7 variants for status indicators |
| Skeleton | `packages/ui/src/shadcn/skeleton.tsx` | Yes | Loading placeholders |
| Empty State | `packages/ui/src/makerkit/empty-state.tsx` | Yes | EmptyState, EmptyStateHeading, EmptyStateText, EmptyStateButton |

**Tables/Schemas Identified:**

| Table Name | Location | Purpose |
|------------|----------|---------|
| `course_progress` | `migrations/20250319104726_web_course_system.sql` | Overall course completion tracking |
| `lesson_progress` | `migrations/20250319104726_web_course_system.sql` | Individual lesson completion |
| `quiz_attempts` | `migrations/20250319104726_web_course_system.sql` | Quiz submission history |
| `survey_responses` | `migrations/20250319104724_web_survey_system.sql` | Assessment category_scores for spider chart |
| `tasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Kanban tasks with status field |
| `subtasks` | `migrations/20250221144500_web_create_kanban_tables.sql` | Hierarchical subtasks |
| `building_blocks_submissions` | `migrations/20250211000000_web_create_building_blocks_submissions.sql` | Presentations with outline |
| `ai_request_logs` | `migrations/20250416140521_web_ai_usage_cost_tracking.sql` | Activity tracking for AI features |

### C. Research Integration (REQUIRED)

| Research File | Key Findings | Spec Section(s) Affected |
|--------------|--------------|-------------------------|
| `context7-calcom-api.md` | Cal.com API v2 uses Bearer auth, `cal-api-version` header required, `GET /v2/bookings?status=upcoming` for sessions, 5-15 min cache recommended, webhook support for BOOKING_CREATED/CANCELLED/RESCHEDULED | Section 7 Technical Context (integration details), Section 8 Risks (R1 rate limits) |
| `perplexity-dashboard-patterns.md` | Limit to 5-7 widgets, radial for single goals/linear for steps (hybrid recommended), 10-20 items in activity feed with infinite scroll, primary CTA above fold, skeleton states for <3s loads, lazy load below-fold | Section 5 Solution Overview (layout), Section 9 Success Criteria (performance), Section 6 Scope (widget count) |

**Key Research Insights Applied:**
1. **Cal.com API v2**: Use Bearer token auth with `cal-api-version: 2024-08-13` header. Implement 5-minute caching to avoid rate limits. V1 deprecated Feb 2026.
2. **Dashboard Layout**: 7 widgets is at upper limit of recommendation (5-7). Consider reducing if UX testing shows overload.
3. **Progress Display**: Radial for course progress (single goal), consider linear for lesson-by-lesson progress if needed in future.
4. **Activity Feed**: 10-20 items initially, infinite scroll preferred over pagination for feeds.
5. **Performance**: Skeleton states critical, target <3s initial load, lazy load below-fold components.

### D. External References

- Cal.com API Documentation: https://cal.com/docs/api-reference/v2
- Recharts Documentation: https://recharts.org/en-US/
- Shadcn UI Components: https://ui.shadcn.com/

### E. Visual Assets

- Dashboard mockup: To be created during design phase
- Responsive wireframes: To be created during design phase

### F. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-20 | Personal dashboard only (not team) | Keep scope focused; team dashboard is separate feature | User interview |
| 2026-01-20 | Cal.com API integration (not iframe) | Enable session display in dashboard; better UX | User interview |
| 2026-01-20 | Show all activity types | Comprehensive feed preferred over filtered | User interview |
| 2026-01-20 | Pull from existing kanban tasks | Use actual user tasks, not presentation workflow template | User interview |
| 2026-01-20 | User engagement as primary metric | Aligns with business goal of increased platform usage | User interview |
