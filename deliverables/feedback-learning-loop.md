# Feedback Learning Loop — Corrections Improve Future Output

**Task:** #351
**Status:** Draft
**Last Updated:** 2026-02-10

---

## Problem

When Mike corrects Sophie's output, the correction fixes that one deliverable but doesn't prevent the same mistake in future work. We need a system where feedback compounds — each correction makes the next output better.

## How It Works

```
Mike reviews deliverable
        ↓
Gives feedback (approve, correct, reject)
        ↓
Sophie classifies the feedback
        ↓
  ┌─────────────────────────────────────────────┐
  │ Type A: Voice/tone issue                    │
  │   → Update voice/*.md or vocabulary.md      │
  │                                             │
  │ Type B: Factual/product error               │
  │   → Update company/*.md or messaging/*.md   │
  │                                             │
  │ Type C: Structural/format issue             │
  │   → Update guidelines/*.md                  │
  │                                             │
  │ Type D: Persona mismatch                    │
  │   → Update personas/*.md                    │
  │                                             │
  │ Type E: Agent behavior issue                │
  │   → Update agent profile (*.yaml)           │
  │   → Add to review_criteria                  │
  │                                             │
  │ Type F: One-off / not generalizable         │
  │   → Log in corrections-log.md, no file edit │
  └─────────────────────────────────────────────┘
        ↓
Log correction in corrections-log.md
        ↓
Next builder/reviewer run loads updated context
        ↓
Same mistake doesn't recur
```

## Feedback Capture Points

### 1. Mission Control Review Queue
When Mike reviews a deliverable in the "Ready for Review" state:
- **Approve (👍):** Mark task done. No corrections needed.
- **Correct:** Mike provides specific feedback. Sophie classifies and routes to context files.
- **Reject:** Major issues. Sophie logs, updates context, and re-runs the Sophie Loop.

### 2. Conversation Corrections
When Mike says things like:
- "That's not our voice" → Type A
- "We don't offer that anymore" → Type B  
- "Blog posts should always have X" → Type C
- "Solo consultants wouldn't care about that" → Type D
- "The agent should check for X before submitting" → Type E

Sophie should immediately:
1. Acknowledge the correction
2. Identify the context file to update
3. Make the update
4. Confirm: "Updated [file] — this won't happen again"

### 3. Sophie Loop Reviewer Catches
When the reviewer flags an issue during the loop:
- If the issue is a context gap → update the context file
- If the issue is agent non-compliance → update the agent profile's `review_criteria`
- Log in corrections-log.md either way

## Implementation: Learnings Accumulator

Each Sophie Loop run already has a `learnings.md` file per task (in `.ai/runs/<task-id>/`). These capture iteration-level feedback. The new step:

**After a task completes (PASS or approved by Mike):**
1. Read `learnings.md` from the run
2. Extract generalizable lessons
3. Route each lesson to the appropriate context file
4. Archive the run-specific learnings

**Periodic rollup (weekly, during heartbeat):**
1. Read all `corrections-log.md` entries from the past week
2. Look for patterns (same type of correction recurring?)
3. If a pattern exists, the context file update wasn't strong enough — strengthen it
4. Update freshness.json for modified files

## Agent Profile Enhancement

Add a `learned_rules` section to agent profiles that accumulates corrections:

```yaml
# In writer.yaml
learned_rules:
  - "Always include at least 2 internal links to SlideHeroes pages (learned 2026-02-10)"
  - "Prefer real-world examples over framework name-dropping (learned 2026-02-10)"
```

These get loaded into the builder prompt alongside the system prompt, ensuring corrections persist across sessions.

## Metrics

Track to see if the loop is working:
- **Correction frequency:** Are we logging fewer corrections per week over time?
- **First-pass approval rate:** What % of deliverables pass review without iteration?
- **Correction type distribution:** Which types are most common? (indicates which context areas need most attention)
- **Recurrence rate:** How often does the same correction appear twice? (should be ~0%)

Store in `~/clawd/.ai/contexts/feedback-metrics.json`:
```json
{
  "weekOf": "2026-02-10",
  "corrections": 1,
  "firstPassApprovalRate": 0.0,
  "byType": {"E": 1},
  "recurrences": 0
}
```

## Implementation Checklist

- [x] Create `corrections-log.md` (done in #350)
- [ ] Add `learned_rules` section to all agent profiles
- [ ] Add feedback classification logic to Sophie's conversation handling
- [ ] Add post-task-completion step to Sophie Loop: extract learnings → update context
- [ ] Add weekly rollup check to HEARTBEAT.md
- [ ] Create `feedback-metrics.json` and start tracking
- [ ] Update loop-runner.py to include `learned_rules` in builder prompts

---

## Relationship to Context Maintenance (#350)

This is the **feedback-driven** arm of context maintenance. #350 covers the full maintenance process (reactive, proactive, feedback). This task (#351) designs the feedback loop in detail and implements the machinery.

The corrections-log.md and freshness.json from #350 are shared infrastructure used by this process.
