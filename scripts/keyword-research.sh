#!/bin/bash
# Keyword Research via DataForSEO API
# Usage: keyword-research.sh "seed keyword" [--related] [--serp] [--location 2840]
#
# Examples:
#   keyword-research.sh "business presentation"           # Volume + difficulty
#   keyword-research.sh "business presentation" --related  # + related keywords
#   keyword-research.sh "business presentation" --serp     # + SERP analysis
#   keyword-research.sh "business presentation" --related --serp  # Everything

set -uo pipefail

# Load credentials
source ~/.clawdbot/.env 2>/dev/null
LOGIN=$(echo "$DATAFORSEO_LOGIN" | tr -d '\r\n')
PASS=$(echo "$DATAFORSEO_PASSWORD" | tr -d '\r\n')

if [[ -z "$LOGIN" || -z "$PASS" ]]; then
  echo '{"error": "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be set in ~/.clawdbot/.env"}' >&2
  exit 1
fi

# Parse args
KEYWORD=""
DO_RELATED=false
DO_SERP=false
LOCATION=2840  # US
LANG="en"
TOP_N=20

while [[ $# -gt 0 ]]; do
  case "$1" in
    --related) DO_RELATED=true; shift ;;
    --serp) DO_SERP=true; shift ;;
    --location) LOCATION="$2"; shift 2 ;;
    --lang) LANG="$2"; shift 2 ;;
    --top) TOP_N="$2"; shift 2 ;;
    *) KEYWORD="$1"; shift ;;
  esac
done

if [[ -z "$KEYWORD" ]]; then
  echo "Usage: keyword-research.sh \"seed keyword\" [--related] [--serp] [--location 2840]" >&2
  exit 1
fi

API="https://api.dataforseo.com/v3"
TOTAL_COST=0

echo "{"
echo "  \"seed_keyword\": \"$KEYWORD\","
echo "  \"location_code\": $LOCATION,"
echo "  \"language_code\": \"$LANG\","

# 1. Search volume
VOLUME_RESP=$(curl -s -u "$LOGIN:$PASS" "$API/keywords_data/google_ads/search_volume/live" \
  -H "Content-Type: application/json" \
  -d "[{\"keywords\":[\"$KEYWORD\"],\"language_code\":\"$LANG\",\"location_code\":$LOCATION}]")

COST=$(echo "$VOLUME_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cost',0))" 2>/dev/null)
TOTAL_COST=$(python3 -c "print($TOTAL_COST + ${COST:-0})")

VOL_DATA=$(echo "$VOLUME_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
results = data.get('tasks',[{}])[0].get('result') or []
if results:
    r = results[0]
    print(json.dumps({
        'keyword': r.get('keyword'),
        'search_volume': r.get('search_volume'),
        'competition': r.get('competition'),
        'competition_index': r.get('competition_index'),
        'cpc': r.get('cpc'),
        'monthly_searches': r.get('monthly_searches') or []
    }, indent=4))
else:
    print('null')
" 2>/dev/null || echo "null")
echo "  \"volume_data\": $VOL_DATA,"

# 2. Related keywords (if requested)
if $DO_RELATED; then
  RELATED_RESP=$(curl -s -u "$LOGIN:$PASS" "$API/keywords_data/google_ads/keywords_for_keywords/live" \
    -H "Content-Type: application/json" \
    -d "[{\"keywords\":[\"$KEYWORD\"],\"language_code\":\"$LANG\",\"location_code\":$LOCATION}]")

  COST=$(echo "$RELATED_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cost',0))" 2>/dev/null)
  TOTAL_COST=$(python3 -c "print($TOTAL_COST + ${COST:-0})")

  RELATED_KW=$(echo "$RELATED_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
results = data.get('tasks',[{}])[0].get('result') or []
results.sort(key=lambda x: x.get('search_volume',0) or 0, reverse=True)
top = results[:$TOP_N]
out = []
for r in top:
    out.append({
        'keyword': r.get('keyword'),
        'search_volume': r.get('search_volume'),
        'competition': r.get('competition'),
        'cpc': r.get('cpc')
    })
print(json.dumps(out, indent=4))
" 2>/dev/null || echo "[]")
  RELATED_TOTAL=$(echo "$RELATED_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('tasks',[{}])[0].get('result') or []))
" 2>/dev/null || echo "0")
  echo "  \"related_keywords\": $RELATED_KW,"
  echo "  \"related_total\": $RELATED_TOTAL,"
else
  echo "  \"related_keywords\": null,"
fi

# 3. SERP analysis (if requested)
if $DO_SERP; then
  SERP_RESP=$(curl -s -u "$LOGIN:$PASS" "$API/serp/google/organic/live/regular" \
    -H "Content-Type: application/json" \
    -d "[{\"keyword\":\"$KEYWORD\",\"language_code\":\"$LANG\",\"location_code\":$LOCATION,\"depth\":10}]")

  COST=$(echo "$SERP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cost',0))" 2>/dev/null)
  TOTAL_COST=$(python3 -c "print($TOTAL_COST + ${COST:-0})")

  SERP_DATA=$(echo "$SERP_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
result = data.get('tasks',[{}])[0].get('result') or [{}]
items = (result[0] if result else {}).get('items') or []
out = []
for item in items:
    if item.get('type') == 'organic':
        out.append({
            'position': item.get('rank_absolute'),
            'title': item.get('title'),
            'url': item.get('url'),
            'description': (item.get('description') or '')[:200]
        })
print(json.dumps(out[:10], indent=4))
" 2>/dev/null || echo "[]")
  echo "  \"serp_results\": $SERP_DATA,"
else
  echo "  \"serp_results\": null,"
fi

echo "  \"total_cost\": $TOTAL_COST"
echo "}"
