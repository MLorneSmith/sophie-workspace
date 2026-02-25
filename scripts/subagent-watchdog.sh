#!/usr/bin/env bash
# subagent-watchdog.sh — Check for stuck sub-agents
# Called by cron every 5 minutes. Outputs JSON summary for the agent to act on.

set -euo pipefail

THRESHOLD_MS=300000  # 5 minutes

# Get active subagents via gateway API
GATEWAY_TOKEN=$(python3 -c "
import json
with open('$HOME/.openclaw/openclaw.json') as f:
    d = json.load(f)
print(d.get('gateway',{}).get('auth',{}).get('token',''))
" 2>/dev/null)

if [ -z "$GATEWAY_TOKEN" ]; then
    echo '{"error": "no gateway token"}'
    exit 1
fi

# List active sessions
SESSIONS=$(curl -s -H "Authorization: Bearer $GATEWAY_TOKEN" \
    "http://127.0.0.1:18789/api/sessions?kinds=subagent&activeMinutes=60&messageLimit=0" 2>/dev/null)

if [ -z "$SESSIONS" ] || [ "$SESSIONS" = "null" ]; then
    echo '{"stuck": [], "count": 0}'
    exit 0
fi

# Find sessions running longer than threshold
python3 -c "
import json, sys, time

data = json.loads('''$SESSIONS''')
sessions = data.get('sessions', data) if isinstance(data, dict) else data
threshold = $THRESHOLD_MS
now_ms = int(time.time() * 1000)
stuck = []

if isinstance(sessions, list):
    for s in sessions:
        started = s.get('startedAt', s.get('createdAt', 0))
        if isinstance(started, str):
            continue
        runtime = now_ms - started if started else 0
        status = s.get('status', s.get('meta', {}).get('status', ''))
        if runtime > threshold and status in ('running', 'active', ''):
            stuck.append({
                'label': s.get('label', s.get('meta', {}).get('label', '?')),
                'model': s.get('model', s.get('meta', {}).get('model', '?')),
                'runtime_min': round(runtime / 60000, 1),
                'sessionKey': s.get('sessionKey', s.get('key', '?'))
            })

print(json.dumps({'stuck': stuck, 'count': len(stuck)}))
" 2>/dev/null || echo '{"stuck": [], "count": 0, "error": "parse failed"}'
