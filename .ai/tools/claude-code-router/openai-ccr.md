# CCProxy + Claude Code Router Setup

## Overview

Two services work together to route Claude Code requests to multiple AI providers including ChatGPT Pro subscription:

1. **ccproxy** (`ccproxy-api` v0.2.3) — bridges ChatGPT subscription to OpenAI-compatible HTTP API on port 8787
2. **claude-code-router** (`@musistudio/claude-code-router` v2.0.0) — routes Claude Code requests to different providers

## Architecture

```
Claude Code → CCR (port 3456) → z.ai GLM (api.z.ai)        [default/main]
                              → ccproxy (port 8787) → ChatGPT Pro [openai provider]
```

## Components

### ccproxy-api
- **Package**: `ccproxy-api[plugins-codex]`
- **Install manager**: `uv` (requires Python 3.12)
- **Config**: `~/.config/ccproxy/config.toml`
- **Auth**: Uses ChatGPT OAuth token from `~/.codex/auth.json` (managed by `@openai/codex` CLI)
- **Plugins**: `codex` + `oauth_codex`
- **Port**: 8787
- **API path**: `http://127.0.0.1:8787/codex/v1/chat/completions`

### claude-code-router (CCR)
- **Package**: `@musistudio/claude-code-router` v2.0.0
- **Install manager**: pnpm global
- **Config**: `~/.claude-code-router/config.json`
- **Port**: 3456

## Config Files

### `~/.config/ccproxy/config.toml`
```toml
# CCProxy API Configuration
# Codex OAuth proxy for claude-code-router

enabled_plugins = ["codex", "oauth_codex"]

[server]
host = "127.0.0.1"
port = 8787

[logging]
level = "INFO"
```

### `~/.claude-code-router/config.json`
```json
{
  "PORT": 3456,
  "LOG": true,
  "STATUSLINE": true,
  "API_TIMEOUT_MS": 600000,
  "Providers": [
    {
      "name": "zai",
      "api_base_url": "https://api.z.ai/api/coding/paas/v4/chat/completions",
      "api_key": "<z.ai key>",
      "models": ["glm-5", "glm-4.7-FlashX", "glm-4.7-Flash", "GLM-5"]
    },
    {
      "name": "openai",
      "api_base_url": "http://127.0.0.1:8787/codex/v1/chat/completions",
      "api_key": "unused",
      "models": ["gpt-5.2", "gpt-5-mini", "gpt-5-nano", "o3", "o4-mini"]
    }
  ],
  "Router": {
    "default": "zai,glm-5",
    "background": "zai,glm-5",
    "think": "zai,glm-5",
    "longContext": "zai,glm-5"
  }
}
```

## Starting Services

### Start ccproxy (must be running before CCR)
```bash
ccproxy serve --config ~/.config/ccproxy/config.toml --log-level WARNING &
```

### Start Claude Code via CCR
```bash
ccr code
```

### Check if ccproxy is running
```bash
lsof -ti:8787 && echo "running" || echo "not running"
```

### Stop ccproxy
```bash
kill $(lsof -ti:8787)
```

## Auto-start ccproxy on shell login

Add to `~/.zshrc`:
```bash
# Auto-start ccproxy if not already running
if ! lsof -ti:8787 > /dev/null 2>&1; then
  ccproxy serve --config ~/.config/ccproxy/config.toml --log-level WARNING &>/tmp/ccproxy.log &
fi
```

## Reinstalling ccproxy

The binary is installed via `uv`. If missing (e.g. after a system change):
```bash
~/.local/bin/uv tool install 'ccproxy-api[plugins-codex]' --python 3.12
```

## Refreshing ChatGPT Auth

The codex CLI manages auth. If requests start failing with auth errors:
```bash
codex login   # re-authenticate with ChatGPT
```

Token info is stored in `~/.codex/auth.json`. The `~/.claude-code-router/codex-token.sh`
script can extract the token for debugging.

## Troubleshooting

### CCR returns 500 "fetch failed ECONNREFUSED 127.0.0.1:8787"
ccproxy is not running. Start it:
```bash
ccproxy serve --config ~/.config/ccproxy/config.toml --log-level WARNING &
```

### ccproxy fails to start: "address already in use"
Port 8787 is already occupied (ccproxy may already be running):
```bash
lsof -ti:8787   # check what's on 8787
```

### ccproxy starts but requests fail
Check if the codex auth token is still valid:
```bash
~/.claude-code-router/codex-token.sh --check
# Or inspect auth.json directly:
python3 -c "
import json, base64, time
d = json.load(open('$HOME/.codex/auth.json'))
at = d['tokens']['id_token']
parts = at.split('.')
import base64
pad = 4 - len(parts[1]) % 4
p = json.loads(base64.b64decode(parts[1] + '=' * (pad % 4)))
print('expires in:', round((p['exp'] - time.time()) / 3600, 1), 'hours')
print('plan:', p.get('https://api.openai.com/auth', {}).get('chatgpt_plan_type'))
"
```

### How ccproxy actually works
Unlike `api.openai.com` (which requires a developer API key), ccproxy uses the
`@openai/codex` CLI's ChatGPT OAuth token. It spawns codex CLI requests internally
and exposes the results as an OpenAI-compatible chat completions endpoint.
The ChatGPT OAuth token **cannot** be used directly with `api.openai.com` — it lacks
the `model.request` scope. ccproxy handles the bridging via the codex plugin.
