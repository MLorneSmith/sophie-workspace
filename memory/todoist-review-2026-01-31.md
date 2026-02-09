# Todoist Setup Review (Post-Akiflow Migration)
*Prepared: 2026-01-31 ~11pm ET*

## Executive Summary
Mike's Todoist has solid bones—clear project hierarchy, good use of sections for workflow stages, and a nice mix of personal + SlideHeroes work. After the Akiflow migration, there are some cleanup opportunities and workflow refinements that'll make daily use smoother.

---

## Current State

### Projects (43 total)
✅ **Strengths:**
- Clear top-level categories: **Inbox**, **Eat that frog**, **My work 🎯**, **SlideHeroes**, **Personal**, **Christmas Presents**, **Reading List**
- Good nesting (SlideHeroes → Launch / Build App / Marketing / etc.)
- Board view for kanban-style projects (Networking Funnel, Build App, Launch)

⚠️ **Issues:**
- **Duplicates from migration:**
  - Two "Zach" projects (Personal → Zach AND Family → Zach)
  - Two "Home" projects (Personal → Home AND standalone Home → Home Improvement)
  - "Christmas Presents" appears twice (old + new under Family)
  - Some duplicated sections between old/new hierarchy
- **Stale top-level projects:** "Family", "Home", "Me" appear to be migration artifacts with few/duplicate tasks

### Labels (8)
| Label | Usage | Notes |
|-------|-------|-------|
| `read` | Reading items | Good |
| `frog` | Daily "eat the frog" | Good |
| `board` | Board opportunities | Networking-specific |
| `m&a` | M&A opportunities | Networking-specific |
| `advisory` | Advisory roles | Networking-specific |
| `consulting` | Consulting ops | Networking-specific |
| `job` | Job opportunities | Networking-specific |
| `Milestones` | Key dates/milestones | Good, is_favorite=true |

**Gap:** No labels for:
- Sophie/AI handoff (`@sophie`, `@waiting-sophie`)
- Urgency/energy levels
- Context (calls, computer, errands)

### Sections
Good use of workflow sections:
- **Weekly Review:** "How to use" / "Before my review 🧽" / "The weekly review 🏗" / "After my review 🤔"
- **Build App:** Inspiration → Planning → Doing → Shipped
- **Launch:** Planning → Doing → Done
- **Networking Funnel:** Prospect List → Angle research → Approached → Followed-up → Made the Ask → Finished
- **Content Pipeline:** Content ideas → Ready to be written → In progress → Ready to publish → Posted 📫

### Priorities
- **Most tasks:** P1 (default) — not meaningful signal
- **Few P2:** "Define Todoist task conventions", "Book Cineplex night", "Book date night", birthday reminders
- **Few P3:** Valentine's gift, birthday purchases, Telegram setup
- **Rare P4:** "Eat That Frog" (urgent)

**Observation:** Priorities are underused. Most things are P1 which defeats the purpose.

### Due Dates & Recurring
- Many tasks lack due dates entirely
- Good recurring tasks: "Identify your frog" (every workday), "Weekly Review" (Fri 2pm), "Order Walmart" (every Sunday), "Book Haircut" (1st Monday)
- Some tasks have future dates but unclear if still relevant

---

## Recommendations

### 1. Cleanup Duplicates (Quick Win)
Merge/archive duplicate projects:
- Keep: `Personal → Zach`, archive: `Family → Zach`
- Keep: `Personal → Home`, archive: standalone `Home`
- Keep: original `Christmas Presents`, archive: `Family → Christmas Presents`
- Review `Family`, `Home`, `Me` top-level—likely should merge into Personal

### 2. Add Sophie-Coordination Labels
```
@sophie       → Tasks Sophie can help with
@waiting      → Blocked on someone/something
@delegated    → Assigned to someone else
@quick-win    → <15 min, do when energy low
```

Sophie will scan for `@sophie` during heartbeats and can pick up tasks or offer help.

### 3. Priority Discipline
Adopt a simple rule:
- **P1 (🔴):** Do today, no excuses
- **P2 (🟠):** Do this week, important
- **P3 (🔵):** Nice to do, not urgent
- **P4 (⚪):** Someday/maybe

Reset most tasks to P3/P4, reserve P1/P2 for truly urgent items.

### 4. Due-Date Hygiene
- **Default:** If no specific deadline, set due = **this Friday** (creates weekly review pressure)
- **No date = Someday/maybe:** Move to a "Someday" section or use P4
- **Recurring review:** Every Friday in Weekly Review, look at overdue tasks and decide: do, defer, or delete

### 5. Task Naming Convention
Keep it short & imperative:
- ❌ "Investigate [Huuman Inc. | Engage. Delight.](http://huuman.com) for Canadian bookkeeping"
- ✅ "Evaluate Huuman for bookkeeping" (link in description)

Links/context go in task description, not title.

### 6. Inbox Processing (GTD-Style)
1. **Capture everything** → Inbox
2. **Process daily** (morning or evening):
   - Is it actionable? No → Trash or Someday/Reading List
   - <2 min? → Do now
   - Delegatable? → Add `@delegated` or `@sophie`, set due date
   - Schedule it → Add due date, put in right project
3. **Inbox should be empty** at end of processing session

### 7. Weekly Review Checklist (Friday 2pm)
Sophie can prompt or even pre-fill:
1. Clear all inboxes (email, Todoist, notes)
2. Review last week's calendar
3. Review next week's calendar
4. Check Waiting/Delegated items
5. Update project status
6. Identify top 3 priorities for next week
7. Set due dates for undated tasks

### 8. Daily Workflow
**Morning (7:00–7:15 AM):**
1. Review today's tasks (filter: `today | overdue`)
2. Pick 1 frog (label `@frog`) — hardest/most important
3. Do the frog first

**End of Day (5:00 PM):**
1. Clear inbox
2. Review tomorrow's calendar
3. Set tomorrow's frog

---

## Minimal Shared Labels/Filters for Mike↔Sophie Coordination

### Labels to Add
| Label | Who Sets | Purpose |
|-------|----------|---------|
| `@sophie` | Mike | "Sophie, please handle or help with this" |
| `@from-sophie` | Sophie | "I created/suggested this task" |
| `@waiting` | Either | Blocked, waiting on external |

### Filters to Create
| Filter Name | Query | Purpose |
|-------------|-------|---------|
| 🐸 Today's Frog | `@frog & today` | Morning frog view |
| 📬 My Inbox | `##Inbox` | Process inbox |
| 🤖 For Sophie | `@sophie` | Tasks Sophie should review |
| ⏳ Waiting | `@waiting` | Blocked items |
| 📅 This Week | `(due before: next Sunday) & !##Inbox` | Weekly planning |
| 🎯 SlideHeroes Active | `##SlideHeroes & (due before: next month)` | Focus on SH |

---

## Next Steps (Proposed)

1. **Mike reviews this report** and decides what to adopt
2. **If approved, Sophie can:**
   - Create the new labels
   - Create the filters
   - Archive duplicate projects
   - Batch-update task names that are too long
3. **Set up chat→Todoist routing:** When Mike says "remind me to X" or "add task: X", Sophie creates in Inbox with `@from-sophie` label

---

## Summary

| Category | Current | Recommended |
|----------|---------|-------------|
| Projects | 43 (some dupes) | Consolidate to ~35 |
| Labels | 8 (networking focus) | Add 3 for coordination |
| Priorities | Mostly P1 | Use full P1–P4 range |
| Due dates | Often missing | Default to Friday |
| Inbox | Unknown processing rhythm | Daily clear |
| Weekly Review | Exists but manual | Sophie-assisted |

**TL;DR:** Good foundation, needs deduplication, label expansion for Sophie coordination, and tighter priority/date discipline. Sophie can help maintain this once conventions are agreed.
