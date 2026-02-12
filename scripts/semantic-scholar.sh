#!/bin/bash
# Search Semantic Scholar for academic papers
# Usage: semantic-scholar.sh "query" [--limit N] [--year YYYY]
#
# Free API — no key required (rate limit: 100 req/5 min)
# Returns: title, authors, year, abstract, citation count, URL

set -uo pipefail

QUERY=""
LIMIT=10
YEAR=""
FIELDS="title,authors,year,abstract,citationCount,url,externalIds"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --limit) LIMIT="$2"; shift 2 ;;
    --year) YEAR="$2"; shift 2 ;;
    *) QUERY="$1"; shift ;;
  esac
done

if [[ -z "$QUERY" ]]; then
  echo "Usage: semantic-scholar.sh \"query\" [--limit N] [--year YYYY]" >&2
  exit 1
fi

ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")

URL="https://api.semanticscholar.org/graph/v1/paper/search?query=${ENCODED}&limit=${LIMIT}&fields=${FIELDS}"
if [[ -n "$YEAR" ]]; then
  URL="${URL}&year=${YEAR}-"
fi

RESP=$(curl -s "$URL")

echo "$RESP" | python3 -c "
import sys, json

data = json.load(sys.stdin)
total = data.get('total', 0)
papers = data.get('data', [])

print(json.dumps({
    'query': '$QUERY',
    'total_results': total,
    'showing': len(papers),
    'papers': [{
        'title': p.get('title'),
        'authors': ', '.join(a.get('name','') for a in (p.get('authors') or [])[:3]),
        'year': p.get('year'),
        'citations': p.get('citationCount', 0),
        'abstract': (p.get('abstract') or '')[:300],
        'url': p.get('url'),
        'doi': (p.get('externalIds') or {}).get('DOI')
    } for p in papers]
}, indent=2))
"
