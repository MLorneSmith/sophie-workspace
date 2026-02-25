# SOP: Task Scheduling with Todoist + Mission Control

## Overview

This SOP defines how we use Todoist and Mission Control together to manage **deadlines** and **scheduled work dates**.

## Core Principle

Todoist has two native date fields. We use both:

- **Deadline** (`deadline`) = when the task **must be done** — the hard deadline
- **Due date** (`due`) = when you plan to **start working** on it — shows in Today view

Mission Control stores the **deadline**. Todoist stores **both**.

## Field Mapping

| Field | MC | Todoist | Purpose |
|-------|-----|---------|---------|
| `deadline` | ✅ Source of truth | `deadline` field | Hard deadline — when it must be done |
| Due date | ❌ Not tracked | `due` field | When to start working — shows in Today view |
| Sub-tasks | ❌ Not tracked | Only when needed | Multi-session work breakdown for large tasks |

## Sync Direction

| Data | Direction | Notes |
|------|-----------|-------|
| `deadline` | MC → Todoist `deadline` | MC is source of truth |
| `due` date | Sophie → Todoist | Set to first planned work day |
| Sub-tasks | Sophie → Todoist | Only for large/phased tasks |
| Task completion | Bidirectional | Completing in either system syncs |
| Mike moves `due` date | Todoist only | Doesn't affect MC or deadline |

## When to Use Sub-Tasks

**Sub-tasks are NOT the default.** Only create them when:

1. Work spans **3+ days** with **distinct phases** (research → build → test)
2. The task involves **handoffs** (Sophie researches → Mike reviews → Sophie implements)
3. Mike **explicitly asks** for work breakdown

| Task Size | Effort | Sub-tasks? | Setup |
|-----------|--------|------------|-------|
| **Small** (< 2h) | 1 session | **No** | `due` = work day, `deadline` = deadline |
| **Medium** (2-6h) | 2-3 sessions | **Usually no** | `due` = start day. Just work on it across days. |
| **Large** (6h+, multi-day) | 4+ sessions | **Yes, if distinct phases** | Sub-tasks for each phase |

**The test:** Would checking off sub-tasks actually help track progress? If the answer is "I'd just work on it until it's done" → no sub-tasks.

## Sub-Task Naming Convention

When sub-tasks ARE used:

```
[#NNN Task name] - Phase X/Y
```

**Examples:**
- `[#327 Storyboard Build] - Plan 1/3`
- `[#327 Storyboard Build] - Build 2/3`
- `[#327 Storyboard Build] - Polish 3/3`

## Scheduling Rules

1. **Set `due` date** = first planned work day (task appears in Today view)
2. **Set `deadline`** = hard deadline from MC
3. **Buffer:** `due` should be early enough to finish before deadline
4. **Weekdays only** — no weekend work tasks
5. **8 hours/day cap** — don't overload any single day

### How Sophie Sets Dates

When a task gets a deadline in MC:
- **Small tasks:** `due` = 2 days before deadline (or next weekday)
- **Medium tasks:** `due` = 3-5 days before deadline
- **Large tasks:** `due` = 1+ week before deadline, with sub-tasks if phased

## Workflow

### New task gets a deadline in MC:
1. MC `deadline` syncs to Todoist `deadline` field
2. Sophie sets Todoist `due` date based on effort estimate
3. Sophie creates sub-tasks only if the task is large + phased
4. Task appears in Mike's Today view on the `due` date

### Mike reschedules in Todoist:
- Moving the `due` date is fine — it's Mike's schedule
- Deadline stays fixed unless explicitly changed in MC
- No sync back to MC needed

### Deadline changes in MC:
1. Updated deadline syncs to Todoist `deadline`
2. Sophie re-evaluates `due` date if needed

## Example

### Small task (no sub-tasks):
```
📋 [#109] Fix email redirect links
   due: Mar 2 (Mon) ← shows in Today view
   deadline: Mar 4   ← countdown badge, hard deadline
```

### Large task (with sub-tasks):
```
📋 [#327] Storyboard Build
   due: Feb 17 (Mon) ← first work day
   deadline: Feb 21  ← hard deadline, countdown
   └── [#327 Storyboard Build] - Plan 1/3     due: Feb 17
   └── [#327 Storyboard Build] - Build 2/3    due: Feb 18
   └── [#327 Storyboard Build] - Polish 3/3   due: Feb 19
```

## API Notes

**Todoist API v1:**
- Create: `{"due": {"date": "2026-02-17"}, "deadline": {"date": "2026-02-21"}}`
- Update: `{"due_date": "2026-02-17", "deadline_date": "2026-02-21"}` (flat fields for updates)
- Deadline is paid-plan only
