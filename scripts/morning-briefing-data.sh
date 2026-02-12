#!/bin/bash
# morning-briefing-data.sh — Gather all morning briefing data into JSON
# Usage: ./morning-briefing-data.sh > /tmp/briefing-data.json
#
# Collects: dates, weather, quote, calendar, emails, feed items,
#           capture activity, AWS costs, disk space, overnight work

set -uo pipefail
# NOTE: no set -e — individual section failures should not kill the whole script

# ─── Dates ───────────────────────────────────────────────────
TODAY=$(date +%Y-%m-%d)
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
DAY_AFTER=$(date -d "+2 days" +%Y-%m-%d)
DAY_OF_WEEK=$(date +%A)
DATE_LONG=$(date +"%B %-d, %Y")
DATE_TODAY_SHORT=$(date +"%a %b %-d")
DATE_TOMORROW_SHORT=$(date -d "+1 day" +"%a %b %-d")

# ─── Weather (parallel) ───────────────────────────────────────
curl -sf "wttr.in/Toronto?format=%C+%t+%w+%h&m" > /tmp/weather_raw.txt 2>/dev/null &
curl -sf "wttr.in/Toronto?format=%C|%t|%f|%w|%h|%p&m" > /tmp/weather_detail.txt 2>/dev/null &
wait
WEATHER=$(cat /tmp/weather_raw.txt 2>/dev/null || echo "Weather unavailable")
WEATHER_DETAIL=$(cat /tmp/weather_detail.txt 2>/dev/null || echo "|||||||")

# Parse weather components
IFS='|' read -r W_COND W_TEMP W_FEELS W_WIND W_HUMID W_PRECIP <<< "$WEATHER_DETAIL"

# ─── Quote ───────────────────────────────────────────────────
QUOTES_FILE=~/clawd/data/quotes.json
if [ -f "$QUOTES_FILE" ]; then
  LAST_IDX=$(jq -r '.lastUsedIndex // 0' "$QUOTES_FILE")
  TOTAL=$(jq '.quotes | length' "$QUOTES_FILE")
  NEXT_IDX=$(( (LAST_IDX + 1) % TOTAL ))
  QUOTE_TEXT=$(jq -r ".quotes[$NEXT_IDX].text" "$QUOTES_FILE")
  QUOTE_AUTHOR=$(jq -r ".quotes[$NEXT_IDX].author" "$QUOTES_FILE")
  # Update index
  jq ".lastUsedIndex = $NEXT_IDX" "$QUOTES_FILE" > /tmp/quotes_updated.json && mv /tmp/quotes_updated.json "$QUOTES_FILE"
else
  QUOTE_TEXT="The best way to predict the future is to create it."
  QUOTE_AUTHOR="Peter Drucker"
fi

# ─── Calendar ────────────────────────────────────────────────
# Query all relevant calendars (Sophie's, Mike↔Sophie, Mike SlideHeroes, Mike personal)
CALENDARS=(
  "primary"
  "c_8ca5bd26aab60736029ff25bdadca4c72d1302e061a64a5b504d99a659eb2649@group.calendar.google.com"
  "michael@slideheroes.com"
  "michael.lorne.smith@gmail.com"
  "c_10dc7df94029097685011ec009e327370504a62ea79bce9abea83f5b3a934cc4@group.calendar.google.com"
)

# Collect events from all calendars for today and tomorrow
ALL_TODAY="[]"
ALL_TOMORROW="[]"
for CAL_ID in "${CALENDARS[@]}"; do
  CT=$(gog calendar events "$CAL_ID" --from "${TODAY}T05:00:00Z" --to "${TOMORROW}T05:00:00Z" --json 2>/dev/null || echo '{"events":[]}')
  ALL_TODAY=$(echo "$ALL_TODAY" "$CT" | jq -s '.[0] + (.[1].events // [])')
  CTM=$(gog calendar events "$CAL_ID" --from "${TOMORROW}T05:00:00Z" --to "${DAY_AFTER}T05:00:00Z" --json 2>/dev/null || echo '{"events":[]}')
  ALL_TOMORROW=$(echo "$ALL_TOMORROW" "$CTM" | jq -s '.[0] + (.[1].events // [])')
done

# Deduplicate by event ID and sort by start time
ALL_TODAY=$(echo "$ALL_TODAY" | jq '[unique_by(.id) | sort_by(.start.dateTime // .start.date)[]]')
ALL_TOMORROW=$(echo "$ALL_TOMORROW" | jq '[unique_by(.id) | sort_by(.start.dateTime // .start.date)[]]')

# Format calendar events
CAL_TODAY_FMT=$(echo "$ALL_TODAY" | jq -r '
  if length == 0 then "No meetings scheduled."
  else .[] | "• \(.start.dateTime // .start.date | split("T")[1][:5] // "All day") — \(.summary)"
  end' 2>/dev/null || echo "Calendar unavailable")

CAL_TOMORROW_FMT=$(echo "$ALL_TOMORROW" | jq -r '
  if length == 0 then "No meetings scheduled."
  else .[] | "• \(.start.dateTime // .start.date | split("T")[1][:5] // "All day") — \(.summary)"
  end' 2>/dev/null || echo "Calendar unavailable")

# ─── Emails ──────────────────────────────────────────────────
EMAILS=$(gog gmail search "is:unread" --max 10 --json 2>/dev/null || echo '[]')
EMAIL_COUNT=$(echo "$EMAILS" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")

# ─── Feed Monitor ────────────────────────────────────────────
FEED_RAW=$(curl -sf http://localhost:3001/api/feed-monitor/use-cases 2>/dev/null || echo '{"useCases":[]}')

# ─── Generate Feedback URLs ──────────────────────────────────
FEEDBACK_SECRET=$(grep '^FEEDBACK_SECRET=' ~/.clawdbot/.env 2>/dev/null | cut -d '=' -f2- | tr -d '\r\n')
FEEDBACK_BASE_URL="https://slideheroes-feedback.slideheroes.workers.dev"

generate_sig() {
  echo -n "$1" | openssl dgst -sha256 -hmac "$FEEDBACK_SECRET" -binary | base64 | tr '+/' '-_' | tr -d '='
}

# Build feed items with feedback URLs
FEED_ITEMS=$(echo "$FEED_RAW" | jq '[.useCases[:7] | .[] | {
    id: .item.id,
    title: .item.title,
    link: .item.link,
    score: .useCaseScore,
    type: .useCaseType,
    snippet: .useCaseSnippet
  }]' 2>/dev/null || echo '[]')

# Add signed feedback URLs to each feed item
if [ -n "$FEEDBACK_SECRET" ]; then
  ENRICHED_ITEMS="[]"
  for i in $(echo "$FEED_ITEMS" | jq -r 'range(length)'); do
    ITEM_ID=$(echo "$FEED_ITEMS" | jq -r ".[$i].id")
    UP_SIG=$(generate_sig "${ITEM_ID}:1")
    DOWN_SIG=$(generate_sig "${ITEM_ID}:-1")
    UP_URL="${FEEDBACK_BASE_URL}/rate?item=${ITEM_ID}&r=1&sig=${UP_SIG}"
    DOWN_URL="${FEEDBACK_BASE_URL}/rate?item=${ITEM_ID}&r=-1&sig=${DOWN_SIG}"
    ENRICHED_ITEMS=$(echo "$ENRICHED_ITEMS" | jq --argjson item "$(echo "$FEED_ITEMS" | jq ".[$i]")" \
      --arg up "$UP_URL" --arg down "$DOWN_URL" \
      '. + [$item + {upvoteUrl: $up, downvoteUrl: $down}]')
  done
  FEED_ITEMS="$ENRICHED_ITEMS"
fi

# ─── Capture Activity ────────────────────────────────────────
CAPTURE_LOG=~/clawd/data/capture-activity.log
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
if [ -f "$CAPTURE_LOG" ]; then
  CAPTURES=$(grep "^$YESTERDAY" "$CAPTURE_LOG" 2>/dev/null || echo "")
  CAPTURE_COUNT=$(echo "$CAPTURES" | grep -c . 2>/dev/null || echo "0")
else
  CAPTURES=""
  CAPTURE_COUNT="0"
fi

# ─── AWS Costs ───────────────────────────────────────────────
AWS_COSTS=$(~/clawd/scripts/get-ec2-daily-cost.sh 2>/dev/null || echo "Cost data unavailable")

# ─── Disk Space ──────────────────────────────────────────────
DISK_WARNING=$(~/clawd/scripts/check-disk-space.sh 2>/dev/null || true)
DISK_OK=$?

# ─── Model Usage (Yesterday) ─────────────────────────────────
MODEL_USAGE=$(~/clawd/scripts/get-model-usage.sh 2>/dev/null || echo '[]')

# ─── Task Progress (Mission Control) ─────────────────────────
TASK_STATS=$(curl -sf 'http://localhost:3001/api/v1/insights?weeks=1' 2>/dev/null || echo '{}')
TASKS_TOTAL=$(echo "$TASK_STATS" | jq -r '.summary.totalTasks // 0')
TASKS_DONE=$(echo "$TASK_STATS" | jq -r '.summary.completedTasks // 0')
TASKS_IN_PROGRESS=$(echo "$TASK_STATS" | jq -r '.summary.openTasks // 0')
TASKS_BACKLOG=$(echo "$TASK_STATS" | jq -r '.summary.blockedTasks // 0')
PRACTICES_COUNT=$(echo "$TASK_STATS" | jq -r '.summary.totalPractices // 0')
CAPTURES_TOTAL=$(echo "$TASK_STATS" | jq -r '.summary.totalActivities // 0')

# ─── Review Queue (Mission Control) ──────────────────────────
REVIEW_QUEUE_RAW=$(curl -sf 'http://localhost:3001/api/v1/tasks?status=mike_review' 2>/dev/null || echo '[]')
REVIEW_QUEUE=$(echo "$REVIEW_QUEUE_RAW" | jq '[.[] | {id, name, reviewSummary, updatedAt}]' 2>/dev/null || echo '[]')

# ─── Overnight Work ──────────────────────────────────────────
# Read current.md for overnight work summary
CURRENT_STATE=""
if [ -f ~/clawd/state/current.md ]; then
  CURRENT_STATE=$(cat ~/clawd/state/current.md)
fi

# ─── Output JSON ─────────────────────────────────────────────
jq -n \
  --arg day_of_week "$DAY_OF_WEEK" \
  --arg date_long "$DATE_LONG" \
  --arg date_today "$TODAY" \
  --arg date_tomorrow "$TOMORROW" \
  --arg date_today_short "$DATE_TODAY_SHORT" \
  --arg date_tomorrow_short "$DATE_TOMORROW_SHORT" \
  --arg weather_raw "$WEATHER" \
  --arg weather_condition "${W_COND:-unknown}" \
  --arg weather_temp "${W_TEMP:-N/A}" \
  --arg weather_feels "${W_FEELS:-N/A}" \
  --arg weather_wind "${W_WIND:-N/A}" \
  --arg weather_humid "${W_HUMID:-N/A}" \
  --arg quote_text "$QUOTE_TEXT" \
  --arg quote_author "$QUOTE_AUTHOR" \
  --arg cal_today "$CAL_TODAY_FMT" \
  --arg cal_tomorrow "$CAL_TOMORROW_FMT" \
  --arg email_count "$EMAIL_COUNT" \
  --argjson emails "$EMAILS" \
  --argjson feed_items "$FEED_ITEMS" \
  --arg capture_count "$CAPTURE_COUNT" \
  --arg captures "$CAPTURES" \
  --arg aws_costs "$AWS_COSTS" \
  --arg disk_warning "$DISK_WARNING" \
  --argjson model_usage "$MODEL_USAGE" \
  --arg current_state "$CURRENT_STATE" \
  --arg tasks_total "$TASKS_TOTAL" \
  --arg tasks_done "$TASKS_DONE" \
  --arg tasks_in_progress "$TASKS_IN_PROGRESS" \
  --arg tasks_backlog "$TASKS_BACKLOG" \
  --arg practices_count "$PRACTICES_COUNT" \
  --arg captures_total "$CAPTURES_TOTAL" \
  --argjson review_queue "$REVIEW_QUEUE" \
  '{
    dates: {
      day_of_week: $day_of_week,
      date_long: $date_long,
      date_today: $date_today,
      date_tomorrow: $date_tomorrow,
      date_today_short: $date_today_short,
      date_tomorrow_short: $date_tomorrow_short
    },
    weather: {
      raw: $weather_raw,
      condition: $weather_condition,
      temp: $weather_temp,
      feels_like: $weather_feels,
      wind: $weather_wind,
      humidity: $weather_humid
    },
    quote: {
      text: $quote_text,
      author: $quote_author
    },
    calendar: {
      today: $cal_today,
      tomorrow: $cal_tomorrow
    },
    emails: {
      count: ($email_count | tonumber),
      items: $emails
    },
    feed: $feed_items,
    captures: {
      count: ($capture_count | tonumber),
      raw: $captures
    },
    aws_costs: $aws_costs,
    disk_warning: $disk_warning,
    model_usage: $model_usage,
    task_progress: {
      total: ($tasks_total | tonumber),
      done: ($tasks_done | tonumber),
      in_progress: ($tasks_in_progress | tonumber),
      backlog: ($tasks_backlog | tonumber),
      practices: ($practices_count | tonumber),
      captures: ($captures_total | tonumber)
    },
    reviewQueue: $review_queue,
    current_state: $current_state
  }'
