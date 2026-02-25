#!/bin/bash
# Fetch any Genspark page via FlareSolverr (Cloudflare bypass)
# Usage: genspark-fetch.sh <url> [--text|--html]
# Requires FlareSolverr running on :8191

URL="${1:-https://www.genspark.ai}"
MODE="${2:---text}"

# Ensure FlareSolverr is running
if ! curl -s http://localhost:8191/v1 -X POST -H "Content-Type: application/json" \
    -d '{"cmd":"sessions.list"}' | grep -q '"ok"'; then
  echo "Starting FlareSolverr..."
  Xvfb :99 -screen 0 1920x1080x24 &>/dev/null &
  sleep 2
  DISPLAY=:99 python3 /tmp/FlareSolverr/src/flaresolverr.py &>/tmp/flaresolverr.log &
  sleep 4
fi

RESULT=$(curl -s -X POST http://localhost:8191/v1 \
  -H "Content-Type: application/json" \
  -d "{\"cmd\":\"request.get\",\"url\":\"$URL\",\"maxTimeout\":60000}")

if [ "$MODE" = "--html" ]; then
  echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('solution',{}).get('response','ERROR'))"
else
  echo "$RESULT" | python3 -c "
import sys, json, re
r = json.load(sys.stdin)
print('Status:', r.get('status'))
print('URL:', r.get('solution', {}).get('url'))
html = r.get('solution', {}).get('response', '')
text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\s+', ' ', text).strip()
print('Text:', text[:5000])
"
fi
