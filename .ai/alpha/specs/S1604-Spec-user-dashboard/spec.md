# Project Specification: User Dashboard Home

## Metadata
| Field | Value |
|-------|-------|
| **Spec ID** | S1604 |
| **GitHub Issue** | #1604 |
| **Document Owner** | Claude (sdlc_planner) |
| **Created** | 2026-01-19 |
| **Status** | Draft |
| **Version** | 0.1 |

---

## 1. Executive Summary

### One-Line Description
A comprehensive personal account dashboard at `/home` providing at-a-glance visibility into course progress, skills assessment, tasks, activities, coaching sessions, and presentations.

### Press Release Headline
> "SlideHeroes launches unified dashboard enabling learners to track progress, manage tasks, and book coaching sessions from a single hub"

### Elevator Pitch (30 seconds)
SlideHeroes users currently navigate between multiple pages to check their course progress, view tasks, manage presentations, and book coaching. The new dashboard consolidates these into a single, actionable home screen with seven key widgets: course progress visualization, skills assessment radar, kanban summary, activity feed, quick actions, coaching sessions, and presentation outlines—enabling users to understand their status and take action without navigation.

---

## 2. Problem Statement

### Problem Description
Users land on an empty `/home` page after login and must navigate to separate pages (`/course`, `/kanban`, `/coaching`, `/ai`) to understand their current status and next actions. This fragmented experience:
- Increases cognitive load with multiple page loads
- Hides progress indicators behind navigation clicks
- Reduces engagement with key features (coaching, assessments)
- Provides no contextual guidance on what to do next

### Who Experiences This Problem?
- **Primary**: Active learners working through the presentation course
- **Secondary**: Returning users who want a quick status check
- **Tertiary**: New users who need orientation to available features

### Current Alternatives
Users must manually visit each feature page:
- `/home/course` - Course progress (full page with all lessons)
- `/home/kanban` - Task board (full kanban with drag-drop)
- `/home/coaching` - Cal.com iframe (full booking calendar)
- `/home/ai` - Presentation workspace (full editor access)
- `/home/assessment` - Self-assessment survey

This requires 5+ page loads to get a complete picture.

### Impact of Not Solving
- **Business impact**: Lower feature discovery (coaching underutilized), reduced retention
- **User impact**: Frustration, disorientation after login, missed deadlines
- **Competitive impact**: Modern LMS platforms (Coursera, LinkedIn Learning) provide rich dashboards

---

## 3. Vision & Goals

### Product Vision
A command-center dashboard that serves as the user's daily starting point—providing immediate visibility into learning progress, upcoming tasks, and clear next actions without requiring deep navigation.

### Primary Goals (SMART)
| Goal | Success Metric | Target | Measurement Method |
|------|---------------|--------|-------------------|
| G1: Reduce navigation to key info | Page loads before finding status | <1 (dashboard only) | Analytics tracking |
| G2: Increase coaching bookings | Users who book sessions | +25% vs current | Booking conversion rate |
| G3: Improve course completion | Users who finish course | +15% vs current | Course completion rate |
| G4: Boost daily engagement | Return visits per week | +20% vs current | DAU/WAU ratio |

### Strategic Alignment
Supports SlideHeroes' goal of becoming the go-to presentation skills platform by making progress visible and next actions clear, increasing user engagement and completion rates.

---

## 4. Target Users

### Primary Persona
**Name**: Sarah the Learner
**Role**: Marketing professional improving presentation skills
**Goals**: Complete the course efficiently, track progress, book coaching when stuck
**Pain Points**: Limited time, forgets where she left off, doesn't know when to book coaching
**Quote**: "I just want to see what I need to do today without clicking through five pages"

### Secondary Personas
1. **Mike the Manager**: Team lead checking on his own progress before a big presentation, needs quick status
2. **New User Nina**: Just signed up, needs to understand what's available and where to start

### Anti-Personas (Who This Is NOT For)
- **Admin users**: They have separate team dashboards at `/home/[account]`
- **Anonymous visitors**: Dashboard requires authentication
- **API consumers**: This is a UI feature, not an API

---

## 5. Solution Overview

### Proposed Solution
Build a 7-component dashboard at `/home/(user)/page.tsx` that consolidates key user data into a responsive grid layout:
- **Row 1** (3 cards): Course Progress | Skills Radar | Kanban Summary
- **Row 2** (3 cards): Activity Feed | Quick Actions | Coaching Sessions
- **Row 3** (full width): Presentation Outlines Table

### Key Capabilities

1. **Course Progress Radial Graph**: Visual completion percentage with lesson counts
2. **Skills Assessment Radar**: Spider diagram from self-assessment survey scores
3. **Kanban Summary Card**: Current "Doing" task and next "To Do" task
4. **Activity Feed**: Timeline of recent presentations, lessons, quizzes, assessments
5. **Quick Actions Panel**: Contextual CTAs based on user state
6. **Coaching Sessions Card**: Upcoming sessions or booking CTA
7. **Presentation Outlines Table**: List of presentations with quick edit access

### Customer Journey

1. **User logs in** → Lands on dashboard with full status visibility
2. **User scans widgets** → Sees 65% course complete, 2 tasks in progress, coaching tomorrow
3. **User clicks Quick Action** → "Continue Course" takes them to next lesson
4. **User returns next day** → Dashboard shows updated progress, new activity
5. **User books coaching** → Click "Book Session" opens modal with Cal.com embed

### Hypothetical Customer Quote
> "I used to spend 5 minutes every morning figuring out where I was. Now I open SlideHeroes and immediately know my course progress, what tasks to focus on, and that I have coaching in 2 days. It's like having a personal assistant for my learning journey."
> — Sarah, Marketing Manager

---

## 6. Scope Definition

### In Scope
- [ ] Course progress radial chart component (reads from `course_progress`, `lesson_progress`)
- [ ] Skills assessment radar chart component (reads from assessment data)
- [ ] Kanban summary card (reads from `tasks` table, shows doing/next)
- [ ] Activity feed component (aggregates from multiple tables)
- [ ] Quick actions panel with contextual CTAs
- [ ] Coaching sessions card (Cal.com API integration or embed)
- [ ] Presentation outlines table (reads from `building_blocks_submissions`)
- [ ] Responsive grid layout (3-3-1 pattern)
- [ ] Server-side data fetching with parallel queries
- [ ] Loading states with skeleton components

### Out of Scope
- [ ] Real-time updates (uses refresh-on-navigate pattern)
- [ ] Widget customization/drag-drop (fixed layout)
- [ ] Team account dashboards (separate feature at `/home/[account]`)
- [ ] Notifications system (separate feature)
- [ ] Analytics tracking implementation (handled separately)
- [ ] Mobile app (web responsive only)

### Future Considerations (v2+)
- Customizable widget arrangement
- Real-time activity feed updates via Supabase subscriptions
- Goal setting and streak tracking
- Personalized recommendations based on learning patterns
- Export progress reports

---

## 7. Technical Context

### System Integration Points

| System | Integration Type | Notes |
|--------|-----------------|-------|
| Supabase `course_progress` | Direct query | User's course completion data |
| Supabase `lesson_progress` | Direct query | Individual lesson completion |
| Supabase `quiz_attempts` | Direct query | Quiz scores for activity feed |
| Supabase `tasks` | Direct query | Kanban task data |
| Supabase `building_blocks_submissions` | Direct query | Presentation outlines |
| Payload CMS | API call | Course/lesson metadata |
| Cal.com | API v2 or embed | Coaching session data |
| Self-assessment system | TBD | Assessment scores for radar |

### Technical Constraints

- **Performance**: Dashboard must load in <2 seconds (use parallel data fetching)
- **Security**: All queries protected by RLS (user can only see own data)
- **Compliance**: No PII in logs or error messages
- **Scalability**: Support 1000+ concurrent users

### Technology Preferences/Mandates

- Server Components for initial data fetch
- `Promise.all()` for parallel queries
- Recharts via `@kit/ui/chart` for visualizations
- shadcn/ui Card, Table, Badge, Progress components
- React Query for any client-side data needs
- Zod schemas for all data boundaries

### Dependencies

| Dependency | Owner | Risk Level | Notes |
|------------|-------|------------|-------|
| Cal.com API token | Infrastructure | Medium | Needs env var setup |
| Self-assessment data | Product | Medium | Data structure TBD |
| Course progress tables | Database | Low | Already exists |
| Recharts/chart component | UI | Low | Already installed |

---

## 8. Assumptions & Risks

### Key Assumptions

1. **Users have course progress data**: Most dashboard visitors have started the course — *Validation: Query user counts with progress records*
2. **Self-assessment exists**: Assessment survey is implemented and stores structured scores — *Validation: Verify assessment table schema*
3. **Cal.com API available**: Can fetch upcoming bookings via API — *Validation: Test API with token*
4. **Activity data is queryable**: Can efficiently aggregate recent activity across tables — *Validation: Test query performance*

### Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|-------------|--------|------------|-------|
| R1 | Cal.com API unavailable | Medium | Medium | Fallback to embed-only mode | Backend |
| R2 | Assessment data structure unknown | Medium | High | Early spike to define schema | Product |
| R3 | Performance issues with aggregated queries | Low | High | Use caching, limit activity feed items | Backend |
| R4 | Radar chart complexity | Low | Low | Use simpler bar chart fallback | Frontend |

### Open Questions

1. [ ] What is the exact schema for self-assessment survey results?
2. [ ] Is Cal.com API token configured? What scopes are needed?
3. [ ] How far back should activity feed show? (7 days? 30 days?)
4. [ ] Should "Quick Actions" include team-related actions for team members?
5. [ ] What happens when a user has no data (new user empty states)?

---

## 9. Success Criteria

### Definition of Done (Project Level)

- [ ] All 7 dashboard components render with real data
- [ ] Dashboard loads in <2 seconds on 3G connection
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Empty states display helpful guidance for new users
- [ ] All data respects RLS policies (tested)
- [ ] TypeScript strict mode passes
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] E2E tests cover critical paths

### Launch Criteria

- [ ] Code review approved
- [ ] Staging deployment successful
- [ ] Performance benchmarks met (<2s load)
- [ ] No P0/P1 bugs in testing
- [ ] Product owner sign-off

### Post-Launch Validation

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Dashboard page views | 0 (new page) | 500/day | 2 weeks |
| Bounce rate from dashboard | N/A | <20% | 1 month |
| Coaching bookings | Current rate | +25% | 1 month |
| Course completion rate | Current rate | +15% | 3 months |

---

## 10. Decomposition Hints

> **Note**: This section provides guidance for the next phase (initiative/feature decomposition).

### Candidate Initiatives

1. **Dashboard Foundation**: Layout grid, page structure, loading states, empty states
2. **Progress Visualization**: Course progress radial chart, skills radar chart
3. **Task & Activity Widgets**: Kanban summary card, activity feed component
4. **Actions & Coaching**: Quick actions panel, coaching sessions card
5. **Presentations Table**: Presentation outlines table with edit links
6. **Data Layer**: Loaders, parallel fetching, caching strategy

### Suggested Priority Order

1. **Dashboard Foundation** (P0) - Required for all other work
2. **Data Layer** (P0) - Required for real data
3. **Progress Visualization** (P1) - High-impact, uses existing data
4. **Presentations Table** (P1) - Uses existing data, high value
5. **Task & Activity Widgets** (P2) - Moderate complexity
6. **Actions & Coaching** (P2) - Requires Cal.com integration

### Complexity Indicators

| Area | Complexity | Rationale |
|------|------------|-----------|
| Dashboard Foundation | Low | Standard Next.js page with grid layout |
| Course Progress Radial | Medium | Recharts RadialBarChart, data aggregation |
| Skills Radar | Medium | Recharts RadarChart, assessment data TBD |
| Kanban Summary | Low | Simple query for tasks by status |
| Activity Feed | Medium | Aggregates from 4+ tables, needs limit/sort |
| Quick Actions | Medium | Conditional logic based on user state |
| Coaching Card | High | Cal.com API integration or embed |
| Presentations Table | Low | Direct query, existing patterns |

---

## 11. Appendices

### A. Glossary

| Term | Definition |
|------|------------|
| **Dashboard** | The main `/home` page showing aggregated user status |
| **Widget** | A self-contained card component on the dashboard |
| **Radial Chart** | Circular progress visualization (donut/ring style) |
| **Radar Chart** | Spider/web diagram showing multi-dimensional data |
| **Kanban** | Task management board with columns (To Do, Doing, Done) |
| **RLS** | Row Level Security - database-level access control |
| **RSC** | React Server Components - server-rendered React |

### B. Research & References

| Document | Location |
|----------|----------|
| shadcn/ui Charts Research | `./research-library/shadcn-charts.md` |
| Dashboard Best Practices | `./research-library/dashboard-best-practices.md` |
| Existing Dashboard Demo | `apps/web/app/home/[account]/_components/dashboard-demo-charts.tsx` |
| Course Progress Schema | `apps/web/supabase/migrations/20250319104726_web_course_system.sql` |
| Kanban Schema | `apps/web/supabase/migrations/20250221144500_web_create_kanban_tables.sql` |
| Presentations Schema | `apps/web/supabase/migrations/20250211000000_web_create_building_blocks_submissions.sql` |

### C. Visual Assets

**Proposed Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page Header                               │
├──────────────────┬──────────────────┬──────────────────────────┤
│                  │                  │                          │
│  Course Progress │  Skills Radar    │  Kanban Summary          │
│  (Radial Chart)  │  (Spider Chart)  │  - Doing: Task X         │
│       65%        │                  │  - Next: Task Y          │
│                  │                  │                          │
├──────────────────┼──────────────────┼──────────────────────────┤
│                  │                  │                          │
│  Activity Feed   │  Quick Actions   │  Coaching Sessions       │
│  - Lesson 12 ✓   │  [Continue]      │  📅 Tomorrow 2pm        │
│  - Quiz: 85%     │  [New Present]   │  [Join] [Reschedule]     │
│  - Outline saved │  [Assessment]    │  or [Book Session]       │
│                  │                  │                          │
├──────────────────┴──────────────────┴──────────────────────────┤
│                                                                 │
│  Presentation Outlines                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Title              │ Updated    │ Type      │ Action     │  │
│  │ Q4 Sales Pitch     │ 2 days ago │ Persuade  │ [Edit]     │  │
│  │ Team Update        │ 1 week ago │ Inform    │ [Edit]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Responsive Breakpoints:**
- Mobile (<768px): Single column, stacked cards
- Tablet (768-1024px): 2 columns for rows 1-2, full width table
- Desktop (>1024px): 3 columns for rows 1-2, full width table

### D. Decision Log

| Date | Decision | Rationale | Decided By |
|------|----------|-----------|------------|
| 2026-01-19 | Use fixed 3-3-1 grid layout | Simpler than drag-drop, faster delivery | Product |
| 2026-01-19 | Cal.com embed as fallback | API integration may be blocked | Engineering |
| 2026-01-19 | Limit activity feed to 10 items | Performance and UX balance | Product |
| 2026-01-19 | Server Components primary | Better performance, SSR benefits | Engineering |
