# Bookend Routines

## 🌅 Morning Briefing (first heartbeat after 07:00 local)

### ⚠️ PRE-FLIGHT CHECKLIST — READ BEFORE GENERATING BRIEFING
Before composing the briefing, verify these MANDATORY items:
- [ ] **NO LOCALHOST LINKS** — Never include `localhost:3001` URLs. They don't work from Discord. Use "React 👍 or 👎" instead.
- [ ] **CALENDAR SECTION EXISTS** — Must include 📅 Today's Meetings AND 📅 Tomorrow's Meetings, even if empty ("No meetings scheduled").
- [ ] **QUOTE IS ROTATED** — Use quotes.json rotation, not a hardcoded quote.
If any of these are missing from your draft, FIX IT before sending.

### Process (Template-Based)
1. **Gather data:** Run `~/clawd/scripts/morning-briefing-data.sh > /tmp/briefing-data.json`
2. **Read template:** `~/clawd/templates/morning-briefing.md`
3. **Read context:** `state/current.md` + yesterday's `memory/YYYY-MM-DD.md`
4. **Compose briefing:** Fill every `{{PLACEHOLDER}}` from the JSON data. Write `[COMPOSE]` sections from context.
5. **Validate:** Pipe your draft through `~/clawd/scripts/validate-briefing.sh` — fix any errors
6. **Send** to Mike

### What the data script collects automatically
- Dates, weather, quote (rotated), calendar (today + tomorrow)
- Unread emails, feed monitor articles, capture activity
- AWS costs, disk space warnings

### What you compose manually
- Top Headlines (curated, relevant to SlideHeroes)
- Sophie Can Do Today (from backlog + priorities)
- Mike's Agenda (review items, decisions needed)
- Overnight Work summary (from state/current.md)

### Legacy Manual Steps (now handled by data script)
All calendar, weather, quotes, feed items, costs, and email data are now gathered
automatically by `~/clawd/scripts/morning-briefing-data.sh`. See above for the new process.

**Reference commands** (if data script fails):
- Calendar: `gog calendar events primary --from "...T00:00:00Z" --to "...T00:00:00Z" --json`
- Weather: `curl -s "wttr.in/Toronto?format=%C+%t&m"`
- Costs: `~/clawd/scripts/get-ec2-daily-cost.sh`
- Feed: `curl -s http://localhost:3001/api/feed-monitor/use-cases`
- Quotes: `~/clawd/data/quotes.json` (rotate lastUsedIndex)

## 🔄 Checkpoint (every ~30 min during active work)

1. Update `state/current.md`:
   - What are we working on right now?
   - What decisions were made?
   - What's the next step?
2. Append significant events to `memory/YYYY-MM-DD.md`
3. **If context is getting long** → checkpoint NOW before compaction

### When to Force Checkpoint
- Before any `/new` or `/reset`
- After completing a major task
- When you sense the conversation is getting long
- Before stepping away or going quiet

## 🌙 End of Day (last heartbeat after 22:00 local, or explicit "goodnight")

1. Finalize `state/current.md`:
   - Clear completed items
   - Set tomorrow's priorities
   - Note any pending threads
2. Review today's memory file
3. Consider if anything belongs in MEMORY.md (long-term)
4. Optional: Add items to `state/nightly-backlog.md`

## 🦉 Nightly Build (optional, cron at 23:00 if enabled)

1. Read `state/nightly-backlog.md`
2. Pick top item that can be done autonomously
3. Work on it quietly (no notifications)
4. Document in `memory/nightly-builds.md`
5. Update `state/current.md` with results

---
*Routines can be customized. This is a starting point.*
