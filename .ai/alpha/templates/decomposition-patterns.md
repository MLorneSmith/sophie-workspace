# Decomposition Patterns Reference

This document contains reusable decomposition patterns for breaking features into MAKER-compliant atomic tasks.

## Pattern 1: CRUD Decomposition

For features involving data operations:

```markdown
Feature: "Task Management CRUD"

Tasks:
1. Create - CreateTaskForm component skeleton
2. Create - Add form fields (title, description, status)
3. Create - Add Zod validation schema for task
4. Create - Wire form to server action
5. Create - Implement createTask server action
6. Read   - Create TaskList component skeleton
7. Read   - Add TaskCard sub-component
8. Read   - Implement loadTasks loader function
9. Read   - Wire TaskList to page with loader data
10. Update - Add edit mode toggle to TaskCard
11. Update - Implement updateTask server action
12. Update - Wire edit form to update action
13. Delete - Add delete button to TaskCard
14. Delete - Implement deleteTask server action
15. Delete - Add confirmation dialog before delete
16. Test   - Add E2E test for task CRUD operations
```

## Pattern 2: Layer Decomposition

For features spanning multiple architectural layers:

```markdown
Feature: "User Dashboard Card"

Tasks by Layer:
## Database Layer
1. Create RPC function get_user_stats in Supabase

## Data Layer
2. Create loadUserStats loader function
3. Add TypeScript types for UserStats

## Logic Layer
4. Create calculateProgressPercentage utility
5. Add unit test for progress calculation

## Component Layer
6. Create UserStatsCard component skeleton
7. Add progress bar sub-component
8. Add stats grid sub-component
9. Style card with Tailwind responsive classes

## Integration Layer
10. Wire UserStatsCard to dashboard page
11. Add loading skeleton for UserStatsCard
12. Add error boundary for stats loading failure

## Testing Layer
13. Add E2E test for dashboard with stats card
```

## Pattern 3: State-Based Decomposition

For features with multiple UI states:

```markdown
Feature: "Coaching Sessions Card"

Tasks by State:
## Empty State
1. Create CoachingCard component skeleton
2. Add empty state with booking CTA
3. Wire booking CTA to Cal.com link

## Loading State
4. Add loading skeleton variant
5. Create Suspense boundary wrapper

## Populated State
6. Add session display with date/time
7. Add join meeting button
8. Add reschedule link

## Error State
9. Add error message display
10. Add retry button for failed loads

## Integration
11. Wire to dashboard with conditional rendering
12. Add E2E test covering all states
```

## Pattern 4: Workflow Step Decomposition

For features with sequential user flows:

```markdown
Feature: "Assessment Submission Flow"

Tasks by Step:
## Step 1: Entry
1. Create AssessmentStart component
2. Add intro text and start button
3. Wire start button to first question

## Step 2: Questions
4. Create QuestionCard component
5. Add radio button answer options
6. Add next/previous navigation
7. Create progress indicator

## Step 3: Submission
8. Create SubmitConfirmation component
9. Add review answers summary
10. Implement submitAssessment server action

## Step 4: Results
11. Create ResultsDisplay component
12. Add score visualization
13. Add retake/continue CTAs
```

## Pattern 5: Spike-Then-Implement

When unknowns block estimation, use spikes to resolve them first:

```markdown
Feature: "Coaching Sessions Integration"

## Unknowns Identified
- Unknown: Can Cal.com be embedded or must we redirect?
- Unknown: What webhook events does Cal.com provide?

## Spike Tasks (Priority 0 - Run First)
S1. Spike: Evaluate Cal.com embedding options (4h timebox)
S2. Spike: Document Cal.com webhook capabilities (2h timebox)

## Implementation Tasks (Created AFTER Spikes Complete)
[Tasks extracted from spike reports - cannot be created until spikes finish]

## Post-Spike Task Example
After S1 completes with "use embed SDK" recommendation:
1. Add @calcom/embed-react package (1h)
2. Create BookingModal component skeleton (2h)
3. Add Cal.com embed configuration (2h)
4. Wire modal trigger to CoachingCard CTA (2h)
5. Add booking confirmation handler (3h)
```

**Key Principles:**
- Spikes have **Priority 0** - they ALWAYS run before implementation tasks
- Spikes are **timeboxed** - stop at limit even if incomplete
- Spikes produce **decision documents** - not production code
- Implementation tasks are **extracted from spike reports** - not guessed upfront
- If spike reveals more unknowns → create additional spikes

## Pattern Selection Guide

| Feature Type | Pattern | Indicator |
|--------------|---------|-----------|
| Data operations | CRUD | "Create/Read/Update/Delete" in acceptance criteria |
| New component | Layer | "UI + logic + data" in vertical slice |
| Multi-state UI | State-Based | "Empty/loading/error states" required |
| User flow | Workflow Step | Sequential actions in user story |
| Unknown technology | Spike-Then-Implement | Questions about feasibility or approach |
| Mixed | Combine patterns | Use multiple patterns for complex features |

## Combining Patterns

Complex features often require combining patterns:

```markdown
Feature: "Team Member Management"

## Spike Phase (Pattern 5)
S1. Spike: Evaluate permission model options (4h)

## Database Layer (Pattern 2)
T1. Create team_members table migration
T2. Add RLS policies for team access

## CRUD Operations (Pattern 1)
T3-T8. [Follow CRUD pattern for member operations]

## State Handling (Pattern 3)
T9-T12. [Follow State pattern for UI states]
```
