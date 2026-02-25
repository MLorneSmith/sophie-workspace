---
name: stealth-browser
description: Browse Cloudflare-protected websites from headless EC2/cloud servers. Use when web_fetch or agent-browser fails with Cloudflare "Just a moment..." challenges, Turnstile CAPTCHAs, or 403 errors on target sites. Provides two modes - FlareSolverr HTTP API for simple page fetches, and undetected-chromedriver + Xvfb for interactive sessions (screenshots, form filling, clicking). Triggers on "Cloudflare blocked", "can't access site", "403 from web_fetch", "stealth browse", "bypass Cloudflare", or when any web automation tool returns a Turnstile/challenge page.
---

# Stealth Browser

Bypass Cloudflare Turnstile and bot detection from cloud servers (EC2, VPS) using two complementary approaches.

## Quick Start

### Mode 1: Simple Fetch (FlareSolverr API)

For grabbing page content without interaction:

```bash
# Ensure FlareSolverr is running
bash scripts/ensure-flaresolverr.sh

# Fetch a page
curl -s -X POST http://localhost:8191/v1 \
  -H "Content-Type: application/json" \
  -d '{"cmd":"request.get","url":"https://target-site.com","maxTimeout":60000}' \
  | python3 -c "import sys,json,re; r=json.load(sys.stdin); html=r.get('solution',{}).get('response',''); text=re.sub(r'<script[^>]*>.*?</script>','',html,flags=re.DOTALL); text=re.sub(r'<style[^>]*>.*?</style>','',text,flags=re.DOTALL); text=re.sub(r'<[^>]+>',' ',text); print(re.sub(r'\s+',' ',text).strip()[:5000])"
```

### Mode 2: Interactive Browse (undetected-chromedriver + Xvfb)

For screenshots, form filling, clicking, and JS-heavy pages:

```bash
xvfb-run python3 scripts/stealth-browse.py "https://target-site.com" --screenshot /tmp/page.png
```

## Architecture

**Why standard tools fail on Cloudflare-protected sites from cloud servers:**
1. **IP reputation** — AWS/GCP/Azure IPs are pre-flagged as bot traffic
2. **Browser fingerprinting** — Playwright/Puppeteer set WebDriver flags that Turnstile detects
3. **Headless detection** — Cloudflare checks for missing browser plugins, screen dimensions, etc.

**How stealth-browser solves this:**
- **FlareSolverr** — Runs a real Chrome instance via undetected-chromedriver that patches out automation markers. Operates as an HTTP proxy on port 8191.
- **undetected-chromedriver + Xvfb** — Runs Chrome in "headed" mode on a virtual display (Xvfb), which passes Turnstile's headed-browser checks. The `undetected_chromedriver` library patches the Chrome binary to remove WebDriver detection flags.

## FlareSolverr API Reference

FlareSolverr runs on `http://localhost:8191/v1`. All requests are POST with JSON body.

```bash
# List sessions
curl -s -X POST http://localhost:8191/v1 -H "Content-Type: application/json" \
  -d '{"cmd":"sessions.list"}'

# Create persistent session (cookies persist between requests)
curl -s -X POST http://localhost:8191/v1 -H "Content-Type: application/json" \
  -d '{"cmd":"sessions.create"}'
# Returns: {"session": "<session-id>"}

# GET request (with optional session for cookie persistence)
curl -s -X POST http://localhost:8191/v1 -H "Content-Type: application/json" \
  -d '{"cmd":"request.get","url":"https://example.com","session":"<session-id>","maxTimeout":60000}'

# POST request
curl -s -X POST http://localhost:8191/v1 -H "Content-Type: application/json" \
  -d '{"cmd":"request.post","url":"https://example.com/api","postData":"key=value","session":"<session-id>","maxTimeout":60000}'

# Destroy session
curl -s -X POST http://localhost:8191/v1 -H "Content-Type: application/json" \
  -d '{"cmd":"sessions.destroy","session":"<session-id>"}'
```

Response structure:
```json
{
  "status": "ok",
  "solution": {
    "url": "https://example.com",
    "status": 200,
    "response": "<html>...</html>",
    "cookies": [...],
    "userAgent": "..."
  }
}
```

## Interactive Browse Script

`scripts/stealth-browse.py` — Full interactive browser with Selenium:

```bash
# Basic fetch with text output
xvfb-run python3 scripts/stealth-browse.py "https://example.com"

# Screenshot
xvfb-run python3 scripts/stealth-browse.py "https://example.com" --screenshot /tmp/page.png

# Save full HTML
xvfb-run python3 scripts/stealth-browse.py "https://example.com" --html /tmp/page.html

# Custom wait time (seconds after page load)
xvfb-run python3 scripts/stealth-browse.py "https://example.com" --wait 15
```

For interactive sessions (login flows, form filling), write custom Python using undetected_chromedriver directly. See [references/interactive-patterns.md](references/interactive-patterns.md).

## Setup

Run `scripts/setup.sh` to install all dependencies. Run `scripts/ensure-flaresolverr.sh` to start FlareSolverr.

## Troubleshooting

- **"Xvfb failed to start"** — Kill stale Xvfb: `pkill Xvfb; sleep 1`
- **FlareSolverr returns challenge page** — The site may require interactive solving; switch to Mode 2
- **CAPTCHA on target site** — Screenshot with Mode 2, read with `image` tool, fill with Selenium
- **Session cookies lost** — Use FlareSolverr sessions or pickle cookies in interactive mode
