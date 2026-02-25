# SOP: CCProxy — ChatGPT Pro Subscription via OpenClaw

## Overview

ccproxy bridges Mike's ChatGPT Pro OAuth token to an OpenAI-compatible API on localhost:8787, allowing OpenClaw to use GPT-5.2 via the subscription (zero extra API cost).

## Architecture

```
OpenClaw → openai-ccproxy provider → http://127.0.0.1:8787/codex/v1/ → ccproxy → chatgpt.com/backend-api → GPT-5.2
```

**Why this is needed:** OpenClaw's built-in `openai-codex` provider routes through `chatgpt.com/backend-api` directly, but Cloudflare blocks server-side requests from EC2. ccproxy handles the Cloudflare challenge via the Codex CLI's OAuth mechanism.

## Components

| Component | Location | Port |
|-----------|----------|------|
| ccproxy-api v0.2.3 | `~/.local/bin/ccproxy` (installed via `uv`) | 8787 |
| Config | `~/.config/ccproxy/config.toml` | — |
| Systemd service | `/etc/systemd/system/ccproxy.service` | — |
| Auth token | `~/.codex/auth.json` (managed by `codex` CLI) | — |
| OpenClaw provider | `openai-ccproxy` in `~/.openclaw/openclaw.json` | — |
| Auth profile | `openai-ccproxy:default` in `auth-profiles.json` (dummy key) | — |

## OpenClaw Config

**Provider** (in `models.providers`):
```json
"openai-ccproxy": {
  "baseUrl": "http://127.0.0.1:8787/codex/v1/",
  "api": "openai-completions",
  "models": [{
    "id": "gpt-5.2",
    "name": "GPT 5.2 (ccproxy)",
    "reasoning": true,
    "cost": {"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0},
    "contextWindow": 200000,
    "maxTokens": 16384
  }]
}
```

**Auth profile** (in `auth-profiles.json`):
```json
"openai-ccproxy:default": {
  "type": "api_key",
  "provider": "openai-ccproxy",
  "key": "unused"
}
```

**Model alias:** `codex` → `openai-ccproxy/gpt-5.2`

## Usage

Spawn sub-agents: `sessions_spawn` with `model: "openai-ccproxy/gpt-5.2"`
Cron jobs: set `payload.model: "openai-ccproxy/gpt-5.2"`
Coder agent default model: `openai-ccproxy/gpt-5.2`

## Maintenance

### Check status
```bash
sudo systemctl status ccproxy
lsof -ti:8787  # check port
curl -s http://127.0.0.1:8787/codex/v1/chat/completions \
  -H "Content-Type: application/json" -H "Authorization: Bearer unused" \
  -d '{"model":"gpt-5.2","messages":[{"role":"user","content":"say ok"}],"max_tokens":5}'
```

### Refresh auth token
If requests fail with auth errors, the ChatGPT OAuth token needs refreshing:
```bash
codex login  # re-authenticate with ChatGPT in browser
sudo systemctl restart ccproxy
```
Token is stored in `~/.codex/auth.json`. Check expiry:
```bash
python3 -c "
import json, time
d = json.load(open('$HOME/.codex/auth.json'))
exp = d['tokens'].get('expires_at', 0)
print(f'Expires in: {round((exp - time.time()) / 3600, 1)}h')
print(f'Plan: {d.get(\"auth_mode\")}')"
```

### Reinstall ccproxy
```bash
~/.local/bin/uv tool install 'ccproxy-api[plugins-codex]' --python 3.12
sudo systemctl restart ccproxy
```

### View logs
```bash
sudo journalctl -u ccproxy --since "1 hour ago" --no-pager
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Sub-agent falls back to Opus | ccproxy not running | `sudo systemctl start ccproxy` |
| ccproxy 401 errors | Expired ChatGPT token | `codex login` + restart service |
| "address already in use" | Port 8787 occupied | `kill $(lsof -ti:8787)` + restart |
| OpenClaw ignores the model | Missing auth profile | Add `openai-ccproxy:default` to `auth-profiles.json` |

## History

- **2026-02-24:** Setup created. Solved the `model.request` scope issue — OpenClaw's built-in `openai-codex` provider couldn't reach `chatgpt.com/backend-api` from EC2 due to Cloudflare. ccproxy bridges the gap using the Codex CLI's OAuth mechanism.
- Based on Mike's local setup documented in `2025slideheroes/.ai/tools/claude-code-router/openai-ccr.md`
