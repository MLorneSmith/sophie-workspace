# HEARTBEAT.md

## Bookend Routines
- **Morning (first heartbeat after 07:00 EST):** Run morning briefing from `state/ROUTINES.md`
  - ⚠️ **MANDATORY:** Read the PRE-FLIGHT CHECKLIST in ROUTINES.md before generating! No localhost links. Calendar section required.
- **During day:** Update `state/current.md` if anything significant happened
- **Evening (after 22:00 EST):** Run EOD routine if not done yet

## Periodic Checks
*(rotate through these, 2-4x daily)*
- [ ] Emails — urgent unread?
- [ ] Calendar — events in next 24h?

## #capture Channel Monitoring
**Check every heartbeat:** Look for new links in #capture (id: `1468019433854210259`)

When a link appears:
1. Identify source type (Substack/article, YouTube, Reddit)
2. Fetch content:
   - Articles: `web_fetch`
   - YouTube: `python3 ~/clawd/scripts/get-youtube-transcript.py <url>`
   - Reddit: `web_fetch` on post
3. **ALWAYS create Resource entry first** (source info: title, URL, author, date)
4. Extract 3-7 best practices using LLM
5. **Handle results:**
   - **If actionable practices found:** Create Best Practice entries, each linked to Resource
   - **If nothing actionable:** Reply in #capture: "Reviewed [title] — no specific best practices extracted, but saved as resource for reference" and note this in Resource
6. Reply in #capture confirming extraction with summary of what was captured

**Source Attribution Rules:**
- Every Best Practice MUST link back to its Resource entry
- Resource entry MUST include: title, URL, author (if known), source type, capture date
- Best Practices MUST include: the practice, why it matters, source attribution

**Activity Logging:**
After each capture, log the activity for Morning Brief summary:
```bash
# If practices extracted:
~/clawd/scripts/capture-log.sh "Article Title" "https://url" "5"

# If nothing actionable:
~/clawd/scripts/capture-log.sh "Article Title" "https://url" "0" "nothing_actionable"
```

**Save to Mission Control:**
```bash
curl -X POST http://localhost:3001/api/v1/practices \
  -H "Content-Type: application/json" \
  -d '{
    "resource": {
      "url": "https://...",
      "title": "Article Title",
      "sourceType": "article|youtube|reddit",
      "author": "Author Name (optional)"
    },
    "practices": [
      {
        "practice": "The practice statement",
        "domain": "Sales|Marketing|Product|Operations|Leadership|Technical|Personal|Other",
        "context": "When to apply (optional)",
        "implementation": "How to do it (optional)"
      }
    ]
  }'
```

**Notion IDs (backup/reference):**
- Resources: `c81f483f-1f70-4b10-9b38-0eca92924929`
- Best Practices: `18d2323e-f8ce-458e-9231-0097b4785dce`

## Nighttime Backlog Work
**After 22:00 EST**, if no recent conversation with Mike (>1 hour since last message):

1. Check Mission Control for assigned backlog tasks:
   ```bash
   curl -s 'http://localhost:3001/api/v1/tasks?status=backlog&assigned=true' | jq -r 'sort_by(.priority) | .[0]'
   ```
2. Pick the highest priority assigned task
3. Update `state/current.md` with what you're working on
4. Work on it (spawn sub-agent if complex)
5. When done or blocked, update the task status and pick another

**After context compression or fresh session at night:** Re-read `state/current.md` to see if there's work in progress, then check the backlog.

## One-off Items
*(No active one-off items)*
