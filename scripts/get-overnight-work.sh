#!/bin/bash
# get-overnight-work.sh — Get overnight work summary from Mission Control activity log
# Output: JSON with backlog_progress and new_initiatives sections
# Deterministic: queries MC API for tasks completed/created overnight

set -uo pipefail

# Overnight = 10pm yesterday to 7am today (ET)
# Convert to UTC for API queries
TODAY=$(date -u +%Y-%m-%d)
YESTERDAY=$(date -u -d "yesterday" +%Y-%m-%d)

# Get tasks completed since yesterday 10pm ET (3am UTC today or 3am UTC yesterday depending on time)
# Simplify: look at tasks updated in the last 12 hours with status=done
TWELVE_HOURS_AGO=$(date -u -d "12 hours ago" +%Y-%m-%dT%H:%M:%SZ)

MC_API="http://localhost:3001/api/v1"

# ─── Backlog Progress: tasks completed overnight ──────────────
# Get all done tasks, filter by updatedAt > 12 hours ago
COMPLETED_RAW=$(curl -sf "${MC_API}/tasks?status=done" 2>/dev/null || echo '[]')
COMPLETED=$(echo "$COMPLETED_RAW" | jq --arg since "$TWELVE_HOURS_AGO" \
  '[.[] | select(.updatedAt > $since) | {id, name, initiativeId, priority}]' 2>/dev/null || echo '[]')
COMPLETED_COUNT=$(echo "$COMPLETED" | jq 'length')

# ─── New Initiatives: tasks created overnight ─────────────────
# Get all non-done tasks, filter by createdAt > 12 hours ago  
ALL_TASKS_RAW=$(curl -sf "${MC_API}/tasks" 2>/dev/null || echo '[]')
NEW_TASKS=$(echo "$ALL_TASKS_RAW" | jq --arg since "$TWELVE_HOURS_AGO" \
  '[.[] | select(.createdAt > $since) | {id, name, status, initiativeId, priority}]' 2>/dev/null || echo '[]')
NEW_COUNT=$(echo "$NEW_TASKS" | jq 'length')

# ─── Activity log entries ─────────────────────────────────────
ACTIVITY_RAW=$(curl -sf "${MC_API}/activity?limit=20" 2>/dev/null || echo '[]')
OVERNIGHT_ACTIVITY=$(echo "$ACTIVITY_RAW" | jq --arg since "$TWELVE_HOURS_AGO" \
  '[.[] | select(.createdAt > $since) | {action, summary, details, createdAt}]' 2>/dev/null || echo '[]')

# ─── Git commits overnight (internal-tools) ──────────────────
GIT_COMMITS="[]"
if [ -d ~/clawd/slideheroes-internal-tools/.git ]; then
  GIT_COMMITS=$(cd ~/clawd/slideheroes-internal-tools && \
    git log --since="12 hours ago" --format='{"hash":"%h","subject":"%s","date":"%ci"}' 2>/dev/null | \
    jq -s '.' 2>/dev/null || echo '[]')
fi

# ─── Cron job results (from OpenClaw cron state) ─────────────
# Check which cron jobs ran overnight and their status
NIGHTLY_BACKLOG_STATUS=$(curl -sf "http://127.0.0.1:18789/api/cron" \
  -H "Content-Type: application/json" 2>/dev/null | \
  jq '[.jobs[] | select(.name | test("Nightly|nightly")) | {
    name,
    lastStatus: .state.lastStatus,
    lastRunAt: (if .state.lastRunAtMs then (.state.lastRunAtMs / 1000 | todate) else null end),
    lastDurationMin: (if .state.lastDurationMs then (.state.lastDurationMs / 60000 | floor) else null end)
  }]' 2>/dev/null || echo '[]')

# ─── Output ───────────────────────────────────────────────────
jq -n \
  --argjson completed "$COMPLETED" \
  --argjson completed_count "$COMPLETED_COUNT" \
  --argjson new_tasks "$NEW_TASKS" \
  --argjson new_count "$NEW_COUNT" \
  --argjson activity "$OVERNIGHT_ACTIVITY" \
  --argjson git_commits "$GIT_COMMITS" \
  --argjson cron_results "$NIGHTLY_BACKLOG_STATUS" \
  '{
    backlog_progress: {
      tasks_completed: $completed_count,
      tasks: $completed
    },
    new_initiatives: {
      tasks_created: $new_count,
      tasks: $new_tasks
    },
    activity: $activity,
    git_commits: $git_commits,
    cron_results: $cron_results
  }'
