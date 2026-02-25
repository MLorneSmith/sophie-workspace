#!/bin/bash
# get-top-headlines.sh — Fetch top headlines deterministically from feed monitor
# Output: JSON array of [{title, link, source, snippet}]
# Falls back to RSS feed items if feed monitor has nothing fresh

set -uo pipefail

MC_API="http://localhost:3001/api"

# Get top-scored feed items from today/yesterday
FEED_RAW=$(curl -sf "${MC_API}/feed-monitor/candidates?max=5" 2>/dev/null || echo '[]')

# Extract headline data with links
HEADLINES=$(echo "$FEED_RAW" | jq '[.[] | {
  title: (.title // .item.title // "Untitled"),
  link: (.link // .item.link // ""),
  source: (.source // .feedTitle // "Unknown"),
  snippet: (.snippet // .useCaseSnippet // "")
}] | .[0:3]' 2>/dev/null || echo '[]')

COUNT=$(echo "$HEADLINES" | jq 'length')

if [ "$COUNT" -eq 0 ]; then
  # Fallback: get from feed-monitor use cases
  HEADLINES=$(curl -sf "${MC_API}/feed-monitor/use-cases" 2>/dev/null | \
    jq '[.useCases[:3] | .[] | {
      title: .item.title,
      link: .item.link,
      source: .item.feedTitle,
      snippet: .useCaseSnippet
    }]' 2>/dev/null || echo '[]')
fi

echo "$HEADLINES"
