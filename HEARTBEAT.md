# HEARTBEAT.md

## Bookend Checkpoints

**Always keep `state/current.md` up to date.** This file survives context compaction.

Checkpoint when:
- Every ~30 min during active work
- After completing a major task
- Before any `/new` or `/reset`
- When conversation is getting long
- Before going quiet for a while

See `state/ROUTINES.md` for full morning/checkpoint/EOD procedures.

## Memory Maintenance (During Heartbeats)

Periodically (every few days), use a heartbeat to:
1. Read through recent `memory/YYYY-MM-DD.md` files
2. Identify significant events, lessons, or insights worth keeping long-term
3. Update `MEMORY.md` with distilled learnings
4. Remove outdated info from MEMORY.md that's no longer relevant

Think of it like a human reviewing their journal and updating their mental model. Daily files are raw notes; MEMORY.md is curated wisdom.

## Tasks Moved to Cron Jobs

The following tasks are now handled by dedicated cron jobs instead of heartbeats:

| Task | Schedule | Script |
|------|----------|--------|
| **Email check** | Hourly (07:00-22:00) | `check-email.py` |
| **Calendar check** | Every 4h (07:00-19:00) | `check-calendar.py` |
| **#capture monitoring** | Every 30 min | `capture-monitor.py` |
| **Todoist sync** | 7am, 12pm, 6pm | `sync-mc-todoist-wrapper.py` |
| **Weather** | In morning brief | `morning-briefing-data.sh` |

## Sub-Agent Notifications

**Every heartbeat, check for sub-agent completion notifications:**

```bash
# Check for new notifications
if [ -f ~/clawd/state/notifications.jsonl ] && [ -s ~/clawd/state/notifications.jsonl ]; then
    echo "📢 Sub-agent notifications:"
    cat ~/clawd/state/notifications.jsonl
    # Clear after reading
    > ~/clawd/state/notifications.jsonl
fi
```

If there are notifications, report them to Mike. Then clear the file.

## Nighttime Backlog Work

**After 22:00 EST**, if no recent conversation with Mike (>1 hour since last message):

1. Check Mission Control for assigned backlog tasks
2. Pick the highest priority assigned task
3. Update `state/current.md` with what you're working on
4. Work on it (spawn sub-agent if complex)
5. When done or blocked, update the task status and pick another

**After context compression or fresh session at night:** Re-read `state/current.md` to see if there's work in progress, then check the backlog.
