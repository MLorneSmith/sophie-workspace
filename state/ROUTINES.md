# Bookend Routines

## 🌅 Morning Briefing (first heartbeat after 07:00 local)

1. Read `state/current.md`
2. Check yesterday's `memory/YYYY-MM-DD.md`
3. Scan emails for urgent items (gog gmail list --unread)
4. Fetch calendar events for today and tomorrow (see below)
5. Fetch top AI agent use cases (see below)
6. Fetch EC2 daily cost: `~/clawd/scripts/get-ec2-daily-cost.sh`
7. Send brief to Mike:
   - Top 3 priorities from current.md
   - Any urgent/new emails
   - 📅 Today's Meetings
   - 📅 Tomorrow's Meetings
   - 💰 Yesterday's EC2 cost (from step 6)
   - Weather if relevant
   - 🔍 Top 3-5 AI Agent Use Cases (from Feed Monitor)

### Fetching Calendar Events
```bash
# Today's meetings
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
DAY_AFTER=$(date -d "+2 days" +%Y-%m-%d)

# Today
gog calendar events primary --from "${TODAY}T00:00:00Z" --to "${TOMORROW}T00:00:00Z" --json | \
  jq -r '.events[]? | "• \(.start.dateTime // .start.date | split("T")[1][:5] // "All day") — \(.summary)"'

# Tomorrow
gog calendar events primary --from "${TOMORROW}T00:00:00Z" --to "${DAY_AFTER}T00:00:00Z" --json | \
  jq -r '.events[]? | "• \(.start.dateTime // .start.date | split("T")[1][:5] // "All day") — \(.summary)"'
```
If no events, say "No meetings scheduled."

### Fetching Use Cases
```bash
curl -s http://localhost:3001/api/feed-monitor/use-cases | jq '.useCases[:5] | .[] | {id: .item.id, title: .item.title, score: .useCaseScore, type: .useCaseType, snippet: .useCaseSnippet, link: .item.link}'
```
Include in briefing: title, type, 1-line snippet, and link. Skip if API unavailable.

### Feedback Links (for each article)
Add clickable feedback links so Mike can rate articles directly from Discord:
```
[👍](https://internal.slideheroes.com/api/newsletter/feedback?itemId=ITEM_ID&rating=1) [👎](https://internal.slideheroes.com/api/newsletter/feedback?itemId=ITEM_ID&rating=-1)
```
Replace `ITEM_ID` with the article's `id` field.
Feedback adjusts source feed reputation over time (good sources rise, noisy ones sink).

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
