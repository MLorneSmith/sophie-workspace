# CCProxy Setup (Feb 24 2026)

**Problem:** OpenClaw's `openai-codex` provider blocked by Cloudflare from EC2.

**Solution:** `ccproxy-api` (v0.2.3) bridges ChatGPT OAuth token to OpenAI-compatible API.

**Architecture:**
```
OpenClaw → openai-ccproxy/gpt-5.2 → localhost:8787 → ccproxy → chatgpt.com/backend-api
```

**Components:**
- ccproxy systemd service (`ccproxy.service`)
- Config: `~/.config/ccproxy/config.toml`
- Auth: `~/.codex/auth.json` (via `codex login`)
- OpenClaw provider: `openai-ccproxy` with `baseUrl: http://127.0.0.1:8787/codex/v1/`

**Cost:** $0 extra — uses Mike's ChatGPT Pro subscription

**If broken:**
```bash
sudo systemctl status ccproxy
codex login  # if auth expired
sudo systemctl restart ccproxy
```

**SOP:** `~/clawd/docs/sops/ccproxy-setup.md`
