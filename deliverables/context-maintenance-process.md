# Context Maintenance & Refresh Process

**Task:** #350
**Status:** Draft
**Last Updated:** 2026-02-10

---

## Problem

We have 23 context files powering the Sophie Loop and content generation. Without a maintenance process, these files will drift from reality — products change, messaging evolves, new competitors appear, Mike's voice shifts. Stale context = stale output.

## Design Principles

1. **Automated where possible** — don't rely on humans remembering to update files
2. **Event-driven over calendar-driven** — update when things change, not on arbitrary schedules
3. **Lightweight** — maintenance shouldn't be a project; it should be a habit
4. **Traceable** — know when each file was last reviewed and by whom

---

## Three Maintenance Modes

### 1. Reactive Updates (event-driven)

**Trigger:** Something changes in the business or Mike gives feedback.

| Event | Files to Update | Who |
|-------|----------------|-----|
| Product feature ships | `company/products.md`, `company/roadmap.md`, `messaging/value-props.md` | Sophie |
| Pricing changes | `company/products.md`, `messaging/positioning.md`, `messaging/objections.md` | Sophie |
| New competitor discovered | `company/differentiators.md`, `messaging/positioning.md` | Sophie |
| Mike corrects content voice/tone | `voice/brand-voice.md`, `voice/mike-style.md`, `voice/vocabulary.md` | Sophie |
| Blog post feedback | `guidelines/blog-guidelines.md` (add to anti-patterns or best practices) | Sophie |
| New persona insight | Relevant `personas/*.md` file | Sophie |
| Customer conversation reveals new pain point | `messaging/pain-points.md`, `messaging/objections.md` | Sophie |
| Strategic pivot | Multiple files — flag for full review | Sophie + Mike |

**Process:**
1. Sophie detects the event (from conversation, task completion, or explicit instruction)
2. Updates the relevant file(s)
3. Adds a changelog entry at the bottom of each modified file
4. Logs the update in `memory/YYYY-MM-DD.md`

### 2. Proactive Reviews (scheduled)

**Frequency:** Monthly, during a heartbeat window (low-activity period).

**Process:**
1. Sophie reads each context file
2. Cross-references against:
   - Recent blog posts (did the voice match? any drift?)
   - Recent product changes (is products.md current?)
   - Recent competitive intel (is positioning.md accurate?)
   - Recent customer feedback (are pain points still right?)
3. Flags files that need updates
4. Makes minor updates directly, flags major changes for Mike's review
5. Updates the freshness tracker (below)

**Freshness Tracker:** `~/clawd/.ai/contexts/freshness.json`
```json
{
  "company/about.md": {
    "lastReviewed": "2026-02-10",
    "lastUpdated": "2026-02-08",
    "reviewedBy": "sophie",
    "status": "current",
    "nextReview": "2026-03-10"
  }
}
```

**Monthly review cron job:** Scheduled for 1st of each month, 2:00 AM ET. Checks freshness tracker, reviews files due, updates tracker.

### 3. Feedback Loop (learning from output)

**Trigger:** Mike reviews a deliverable and provides feedback.

**Process:**
1. When Mike gives feedback on a blog post, email, or other content:
   - Identify which context file(s) would have prevented the issue
   - Update the file with the learning
   - Add to `guidelines/*.md` anti-patterns if applicable
2. When a Sophie Loop reviewer catches an issue:
   - Check if the issue stems from missing/wrong context
   - Update if so
3. Track corrections in `~/clawd/.ai/contexts/corrections-log.md`:
   ```
   ## 2026-02-10
   - **Deliverable:** Blog post on boardroom presentations
   - **Feedback:** Too many framework references, needs more real examples
   - **Context updated:** guidelines/blog-guidelines.md (added "prefer real examples over framework names")
   ```

---

## File-Level Standards

Every context file should have:

```markdown
# Title

**Last Updated:** YYYY-MM-DD
**Owner:** Mike | Sophie | both
**Used By:** [which agent profiles / skills use this file]
**Review Cycle:** monthly | quarterly | event-driven

---

[content]

---

## Changelog
- YYYY-MM-DD: [what changed and why]
```

---

## Implementation Checklist

- [ ] Add `lastUpdated` and `Changelog` section to all 23 context files
- [ ] Create `~/clawd/.ai/contexts/freshness.json` with current dates
- [ ] Create `~/clawd/.ai/contexts/corrections-log.md`
- [ ] Add monthly review cron job (1st of month, 2:00 AM ET)
- [ ] Add reactive update triggers to HEARTBEAT.md (check after product tasks complete)
- [ ] Update Sophie Loop reviewer to flag context gaps in review output
- [ ] Document process in contexts/README.md maintenance section

---

## Operational Notes

- **Don't over-maintain.** If a file hasn't needed changes in 3 months and still reads accurately, that's fine. Mark it "current" and move on.
- **Major rewrites need Mike.** Sophie can make incremental updates, but if a file's core thesis changes, flag it for discussion.
- **Version control is your friend.** All context files are in git. If an update makes things worse, revert.
- **Corrections > Prevention.** It's better to fix a context file after a bad output than to speculatively update files "just in case."
