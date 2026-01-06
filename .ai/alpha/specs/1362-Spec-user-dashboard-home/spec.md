# Project Specification: User Dashboard Home

## Metadata
| Field | Value |
|-------|-------|
| **Document Owner** | Development Team |
| **Created** | 2025-12-31 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal dashboard at `/home` that consolidates user progress, tasks, activities, and quick actions into a unified engagement hub.

### Press Release Headline
> "SlideHeroes announces Personal Dashboard enabling learners to track progress, manage tasks, and book coaching sessions in one intuitive view"

### Elevator Pitch (30 seconds)
The User Dashboard Home transforms the empty `/home` page into an engagement-focused command center. Users see their course progress at a glance via a radial chart, understand their presentation strengths through a spider diagram from self-assessments, manage their presentation workflow via a kanban summary, track recent activities, access contextual quick actions, book coaching sessions through Cal.com integration, and navigate directly to their presentation outlines.

---

## 2. Problem Statement

### Problem Description
Currently, the personal account home page at `/home` is empty - users land on a blank page with just a header. This forces users to navigate through multiple sections to understand their progress, find their next task, or access key features. This fragmented experience reduces engagement and makes it difficult for users to maintain momentum in their presentation development journey.

### Who Experiences This Problem?
- **Active learners** progressing through the course who want to see their completion status
- **Presentation creators** managing multiple presentation outlines
- **Users with coaching sessions** who need quick access to upcoming bookings
- **Returning users** who forget where they left off

### Current Alternatives
Today, users must:
- Navigate to `/home/course` to see course progress
- Navigate to `/home/assessment` to see their self-assessment results
- Navigate to `/home/kanban` to see their tasks
- Navigate to `/home/ai/storyboard` to access presentations
- There is no activity feed or quick actions panel

### Impact of Not Solving
- **Business impact**: Lower engagement and course completion rates; users may churn before completing the course
- **User impact**: Frustration from constant navigation; lack of clarity on next steps
- **Competitive impact**: Modern learning platforms (Coursera, Udemy, etc.) provide comprehensive dashboards

---

## 3. Vision & Goals

### Product Vision
A beautiful, engagement-focused dashboard that users want to visit daily. The dashboard surfaces the most important information at a glance, provides clear next steps, and celebrates progress to maintain motivation throughout the presentation development journey.

### Primary Goals (SMART)
| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Increase user engagement | Daily active users returning to dashboard | 40% increase in /home page views | Analytics (PostHog/Vercel) |
| G2: Reduce navigation friction | Time to access key features | <2 clicks to any major feature | UX testing |
| G3: Improve course completion | Users completing course after dashboard launch | 25% improvement in completion rate | Database query on course_progress |

### Strategic Alignment
Aligns with SlideHeroes' mission to make presentation development accessible and engaging. A well-designed dashboard is the cornerstone of user retention for SaaS learning platforms.

---

## 4. Target Users

### Primary Persona
**Name**: Alex the Active Learner
**Role**: Professional preparing presentations regularly
**Goals**: Complete the SlideHeroes course, apply learnings to real presentations, track improvement over time
**Pain Points**: Forgets where they left off, loses track of presentation drafts, doesn't remember coaching session times
**Quote**: "I wish I could see everything I need in one place when I log in"

### Secondary Personas
1. **Sarah the Session Booker**: Focuses on coaching sessions; needs quick access to booking and upcoming sessions
2. **Mike the Multi-Tasker**: Has multiple presentations in progress; needs to see all drafts and their status

### Anti-Personas (Who This Is NOT For)
- **Team Account Users**: This dashboard is for `/home` (personal accounts), not `/home/[account]` (team accounts)
- **First-Time Visitors**: New users should be onboarded before seeing the full dashboard
- **Admin Users**: Admin functionality is separate

---

## 5. Solution Overview

### Proposed Solution
Build a 7-component dashboard organized in a 3-3-1 grid layout:

**Row 1 (3 cards):**
1. Course Progress Radial Chart
2. Self-Assessment Spider Diagram
3. Kanban Summary Card

**Row 2 (3 cards):**
4. Recent Activity Feed
5. Quick Actions Panel
6. Coaching Sessions Card (Cal.com)

**Row 3 (full width):**
7. Presentation Outline Table

### Key Capabilities

1. **Course Progress Visualization**: Radial progress chart showing completion percentage and lesson counts, reusing existing `RadialProgress` component

2. **Assessment Spider Diagram**: Radar chart displaying self-assessment category scores (Structure, Story, Style, etc.), reusing existing `RadarChart` component from assessment module

3. **Kanban Task Summary**: Shows current "Doing" tasks and suggests next task, with direct link to kanban board

4. **Activity Feed Timeline**: Chronological list of recent actions - presentations created/updated, lessons completed, quiz scores, assessments completed

5. **Quick Actions Panel**: Contextual CTAs based on user state - "Continue Course", "New Presentation", "Complete Assessment", "Review Storyboard"

6. **Coaching Sessions Integration**: Cal.com embed for booking; displays next 1-2 upcoming sessions with date/time, join link, reschedule option

7. **Presentation Outline Table**: List of all user presentations with quick edit button to navigate directly to outline editor

### Customer Journey

1. User logs in and lands on `/home` dashboard
2. User sees course progress (65% complete) and is motivated to continue
3. User notices their spider diagram shows weak "Structure" score - decides to revisit that assessment
4. User checks their kanban summary - sees they're working on "Create Opening Hook"
5. User clicks "Continue Course" in quick actions to resume where they left off
6. After completing a lesson, user returns to dashboard and sees it in activity feed
7. User books a coaching session via embedded Cal.com widget
8. User clicks on a presentation in the table to edit its outline

### Hypothetical Customer Quote
> "Finally, I can see everything I need when I log in. The progress chart keeps me motivated, and I never miss a coaching session anymore."
> — Alex, Marketing Professional

---

## 6. Scope Definition

### In Scope

- [x] Course Progress Radial Chart component (reuse existing `RadialProgress`)
- [x] Self-Assessment Spider Diagram component (reuse existing `RadarChart`)
- [x] Kanban Summary Card with current/next task display
- [x] Activity Feed Timeline component (NEW - requires activity tracking)
- [x] Quick Actions Panel with contextual CTAs
- [x] Coaching Sessions Card with Cal.com embed/API integration
- [x] Presentation Outline Table with edit navigation
- [x] Dashboard page layout (3-3-1 grid, responsive)
- [x] Data loader for parallel fetching all dashboard data
- [x] Activity tracking system (NEW database table + service)

### Out of Scope

- [ ] Team account dashboard (separate project at `/home/[account]`)
- [ ] Real-time updates via WebSocket (use refresh/revalidation instead)
- [ ] Dashboard customization/widget rearrangement
- [ ] Gamification features (badges, streaks, leaderboards)
- [ ] Mobile app version
- [ ] Email notifications for activity
- [ ] Advanced analytics/reporting

### Future Considerations (v2+)

- Drag-and-drop dashboard widget rearrangement
- Personalized recommendations based on activity
- Goal setting and tracking
- Weekly progress email summaries
- Dark mode optimizations for charts

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| Supabase `course_progress` table | DB Query | Existing - read course completion data |
| Supabase `lesson_progress` table | DB Query | Existing - count completed lessons |
| Supabase `survey_responses` table | DB Query | Existing - read category_scores JSONB |
| Supabase `tasks`/`subtasks` tables | DB Query | Existing - read kanban task status |
| Supabase `building_blocks_submissions` table | DB Query | Existing - read presentations |
| Supabase NEW `user_activities` table | DB Query | NEW - activity tracking |
| Cal.com API v2 | REST API | External - fetch upcoming bookings |
| Cal.com Embed SDK | Client Script | External - booking modal |

### Technical Constraints

- **Performance**: Dashboard must load <2s; use parallel data fetching with `Promise.all()`
- **Security**: All queries must respect RLS policies (user can only see own data)
- **Compliance**: Cal.com integration must not expose API keys client-side
- **Scalability**: Activity feed should be paginated; limit to 10 recent items

### Technology Preferences/Mandates

- Use existing `RadialProgress` and `RadarChart` components
- Use shadcn/ui `Card`, `Table`, `Button` components
- Use React Query for client-side caching
- Use server actions for Cal.com API calls (hide API key)
- Use Recharts (already installed) for any new charts
- Follow existing loader pattern (`*-page.loader.ts`)

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API access | External | Medium | Need API key; rate limits apply |
| Activity tracking table | This project | Low | Must create before activity feed works |
| Existing chart components | Internal | Low | Already tested and production-ready |
| User has course/assessment data | User | Low | Handle empty states gracefully |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Cal.com API is stable**: Cal.com API v2 provides booking data as documented — *Validation: Test API calls in development*
2. **Users have some data**: Most dashboard users have started the course or created presentations — *Validation: Analytics on existing user activity*
3. **RLS policies exist**: All existing tables have proper RLS for user isolation — *Validation: Verified in codebase exploration*
4. **Chart components work at any size**: Existing RadialProgress and RadarChart are responsive — *Validation: Test at 320px dashboard card size*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API rate limits hit during peak usage | Low | Medium | Cache booking data; 15-min stale time | Development |
| R2 | Activity table grows too large over time | Medium | Low | Implement 90-day retention policy | Development |
| R3 | Empty states look bad for new users | Medium | High | Design compelling empty states that guide users | Design/Dev |
| R4 | Performance degrades with many presentations | Low | Medium | Paginate presentation table; limit 25 per page | Development |

### Open Questions

1. [ ] What is the Cal.com event type slug for coaching sessions?
2. [ ] Should we show quiz scores in activity feed or just "Quiz passed"?
3. [ ] What should the empty state CTA be for users with no course progress?
4. [ ] How long should activity items be retained before cleanup?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 dashboard components render correctly
- [ ] Dashboard loads in <2 seconds on average connection
- [ ] All data queries respect RLS (verified via test)
- [ ] Empty states display for each component when no data exists
- [ ] Cal.com booking flow works end-to-end
- [ ] Activity tracking records user actions
- [ ] Mobile responsive (stacks to single column)
- [ ] All TypeScript strict mode compliance
- [ ] Unit tests for data loaders
- [ ] E2E test for dashboard load

### Launch Criteria

- [ ] Dashboard accessible at `/home` for authenticated personal account users
- [ ] No console errors in production
- [ ] Lighthouse performance score >80
- [ ] All shadcn components pass accessibility checks
- [ ] Cal.com API key configured in production environment

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| /home page views | ~500/week | 750/week | 4 weeks post-launch |
| Avg. session duration on /home | 0s (empty page) | >30s | 4 weeks post-launch |
| Course completion rate | Current baseline | +10% | 8 weeks post-launch |
| Coaching session bookings | Current baseline | +15% | 4 weeks post-launch |

---

## 10. Decomposition Hints

> **Note**: This section provides guidance for the next phase (initiative/feature decomposition).

### Candidate Initiatives

1. **Dashboard Layout & Infrastructure**: Create the 3-3-1 grid layout, page structure, data loader, and empty state handling

2. **Progress Visualization Components**: Course progress radial chart and assessment spider diagram (reusing existing components)

3. **Task & Activity Tracking**: Kanban summary card AND activity feed (requires new activity_log table)

4. **Quick Actions & Navigation**: Quick actions panel and presentation outline table with navigation

5. **Cal.com Coaching Integration**: Server actions for Cal.com API, booking modal embed, upcoming sessions display

### Suggested Priority Order

1. **Dashboard Layout & Infrastructure** (P0) - Foundation for all other components
2. **Progress Visualization Components** (P1) - High value, low effort (reuse existing)
3. **Quick Actions & Navigation** (P1) - Drives engagement
4. **Task & Activity Tracking** (P2) - New table required; more complex
5. **Cal.com Coaching Integration** (P2) - External dependency; test separately

### Complexity Indicators

| Area | Complexity | Rationale |
|------|------------|-----------|
| Dashboard Layout | Low | Standard CSS Grid; shadcn Card components |
| Progress Charts | Low | Reusing existing RadialProgress and RadarChart |
| Kanban Summary | Low | Simple query; filter existing tasks data |
| Activity Feed | Medium | NEW table + service + trigger setup |
| Quick Actions | Low | Conditional rendering based on existing data |
| Cal.com Integration | Medium | External API; embed script; server actions |
| Presentation Table | Low | Simple query; shadcn Table component |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| Personal Account | Individual user's account (not a team); identified by `is_personal_account = true` |
| Radial Chart | Circular progress indicator showing completion percentage |
| Spider/Radar Diagram | Multi-axis chart showing scores across multiple categories |
| Kanban | Task management approach with columns (To Do, Doing, Done) |
| Cal.com | External scheduling platform for booking coaching sessions |
| RLS | Row Level Security - database-level access control |

### B. Research & References

- **Cal.com Integration**: See `research-library/calcom-embed-integration.md`
- **Dashboard Patterns**: See `research-library/perplexity-dashboard-design-patterns.md`
- **Existing Components**:
  - `RadialProgress`: `apps/web/app/home/(user)/course/_components/RadialProgress.tsx`
  - `RadarChart`: `apps/web/app/home/(user)/assessment/survey/_components/radar-chart.tsx`
- **Existing Data**:
  - Course tables: `course_progress`, `lesson_progress`, `quiz_attempts`
  - Assessment: `survey_responses.category_scores`
  - Tasks: `tasks`, `subtasks` with phase grouping
  - Presentations: `building_blocks_submissions`

### C. Visual Assets

**Layout Mockup (ASCII):**
```
┌─────────────────────────────────────────────────────────────┐
│                    User Dashboard Home                       │
├───────────────────┬───────────────────┬─────────────────────┤
│ Course Progress   │ Assessment Spider │ Kanban Summary      │
│ [Radial Chart]    │ [Radar Chart]     │ Doing: Task X       │
│ 65% Complete      │                   │ Next: Task Y        │
├───────────────────┼───────────────────┼─────────────────────┤
│ Activity Feed     │ Quick Actions     │ Coaching Sessions   │
│ • Completed L12   │ [Continue Course] │ Next: Jan 5, 2pm    │
│ • Quiz: 85%       │ [New Presentation]│ [Join] [Reschedule] │
│ • Updated Pres    │ [Assessment]      │ [Book Session]      │
├───────────────────┴───────────────────┴─────────────────────┤
│ Presentation Outline Table                                   │
│ ┌──────────────┬────────────────┬─────────────┬───────────┐ │
│ │ Title        │ Last Updated   │ Status      │ Actions   │ │
│ ├──────────────┼────────────────┼─────────────┼───────────┤ │
│ │ Q1 Review    │ Dec 28, 2025   │ In Progress │ [Edit]    │ │
│ │ Team Update  │ Dec 20, 2025   │ Draft       │ [Edit]    │ │
│ └──────────────┴────────────────┴─────────────┴───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### D. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2025-12-31 | Use personal account route `/home` | User requested; team dashboard is separate | User Interview |
| 2025-12-31 | Cal.com for coaching bookings | User specified; industry standard | User Interview |
| 2025-12-31 | 3-3-1 grid layout | User specified; presentation table needs full width | User Interview |
| 2025-12-31 | Reuse existing chart components | Reduces development time; already tested | Codebase Research |
| 2025-12-31 | New activity_log table required | No existing activity tracking found | Codebase Research |
