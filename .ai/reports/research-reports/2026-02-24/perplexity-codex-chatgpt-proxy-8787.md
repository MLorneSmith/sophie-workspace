# Perplexity Research: ChatGPT Subscription Codex Proxy for OpenAI-Compatible API (Port 8787)

**Date**: 2026-02-24
**Agent**: perplexity-expert
**Search Type**: Search API + Chat API

## Query Summary

Searched for a proxy tool that:
- Listens on port 8787
- Exposes `/codex/v1/chat/completions` path (not `/v1/chat/completions`)
- Uses `CODEX_ACCESS_TOKEN` env var (ChatGPT OAuth token from `~/.codex/auth.json`)
- Works with `@openai/codex` v0.98.0 CLI authenticated via ChatGPT subscription
- Integrates with `@musistudio/claude-code-router` to route Claude Code requests to GPT models

## Findings

### Definitive Conclusion

No publicly documented, standalone, maintained project was found with the exact combination of:
- Port 8787
- Path `/codex/v1/chat/completions` (the `/codex/` prefix is the distinguishing clue)
- CODEX_ACCESS_TOKEN env var
- Bridges `@openai/codex` ChatGPT OAuth token to OpenAI-compatible HTTP API

This strongly suggests the proxy is either:
1. A private/internal script not publicly indexed
2. A Cloudflare Worker (port 8787 is Wrangler's default local dev port - `wrangler dev` runs at `http://localhost:8787`)
3. A very recent project (post-August 2025 knowledge cutoff) that emerged alongside `@openai/codex` v0.98.0

### What Port 8787 Means

Port 8787 is the default local development port for **Cloudflare Wrangler** (`wrangler dev`). Any Cloudflare Worker proxy would naturally run on this port during local development. This is the most likely explanation for port 8787.

The path prefix `/codex/v1/` (vs the standard `/v1/`) is a deliberate namespace to distinguish this proxy's endpoint from a standard OpenAI API endpoint.

### Confirmed Related Projects

#### 1. luohy15/y-router (github.com/luohy15/y-router)
- What it does: Cloudflare Worker that translates Anthropic Claude API format to OpenAI-compatible format (opposite direction from what you need)
- Port: Runs at http://localhost:8787 via Docker or wrangler dev
- Not a match: Bridges Anthropic to OpenAI, not ChatGPT subscription to OpenAI API. No CODEX_ACCESS_TOKEN concept.
- Install: `git clone && docker-compose up -d` or `wrangler deploy`

#### 2. musistudio/claude-code-router (github.com/musistudio/claude-code-router)
- What it does: Routes Claude Code requests to arbitrary OpenAI-compatible providers. Runs locally at http://127.0.0.1:3456 by default.
- Relevance: The target tool you are looking for plugs INTO this as a provider. claude-code-router's config.json would point its api_base_url to http://localhost:8787/codex/v1/chat/completions.
- Config pattern example:
  Provider name "codex-chatgpt", api_base_url "http://localhost:8787/codex/v1/chat/completions"

#### 3. jimmc414/claude_n_codex_api_proxy (github.com/jimmc414/claude_n_codex_api_proxy)
- What it does: Python HTTP proxy that routes to local `codex` CLI when API key is "all 9s". Intercepts OpenAI API calls and forwards them through the codex CLI process.
- Port: 8080 (not 8787)
- Close but not the same: Uses CLI subprocess, not a direct OAuth token HTTP proxy. Does not use CODEX_ACCESS_TOKEN.

### The Most Likely Candidate Architecture

Given the clues, the tool is almost certainly a lightweight Cloudflare Worker or Node.js/Bun HTTP server that:

1. Reads CODEX_ACCESS_TOKEN (the JWT from ~/.codex/auth.json)
2. Accepts POST /codex/v1/chat/completions in OpenAI format
3. Translates and forwards to OpenAI's internal Codex API endpoint with the OAuth bearer token
4. Translates the response back to OpenAI chat completions format
5. Runs locally via wrangler dev on port 8787

### How @openai/codex Auth Works

From official OpenAI docs:
- The @openai/codex CLI stores ChatGPT OAuth tokens in ~/.codex/auth.json
- The token is a standard OAuth access token obtained via browser OAuth flow
- CODEX_ACCESS_TOKEN would be extracted from this file's accessToken field
- These tokens are used as `Authorization: Bearer <token>` headers against OpenAI's API

### Compatibility Note on @openai/codex v0.98.0

The openai/codex CLI moved from TypeScript (early versions) to Rust (recent versions, now at v0.104.0 as of Feb 2026). Version 0.98.0 would be a fairly recent Rust-based version. The ~/.codex/auth.json path and format has been consistent across versions.

## What To Try

### Option A: Search for it as a Cloudflare Worker

Look for GitHub repos with Wrangler config files (wrangler.toml) that:
- Have a route handler for /codex/v1/chat/completions
- Read CODEX_ACCESS_TOKEN from environment
- Were created in 2025

Search terms to try directly on GitHub:
- CODEX_ACCESS_TOKEN wrangler
- codex/v1/chat/completions wrangler.toml
- codex proxy chatgpt openai-compatible worker

### Option B: Build it yourself (minimal Bun proxy)

A ~30-line Bun/Node.js server on port 8787 that reads CODEX_ACCESS_TOKEN,
accepts POST /codex/v1/chat/completions, and proxies to https://api.openai.com/v1/chat/completions
with the OAuth bearer token would fully replicate this behavior.

### Option C: Use claude-code-router directly with OpenAI API key

If the goal is just to use GPT models with Claude Code, musistudio/claude-code-router
supports OpenAI directly by setting api_base_url to https://api.openai.com/v1/chat/completions
and api_key to a standard OpenAI API key.

## Sources & Citations

- [musistudio/claude-code-router](https://github.com/musistudio/claude-code-router)
- [luohy15/y-router](https://github.com/luohy15/y-router) - Cloudflare Worker, port 8787, Anthropic-to-OpenAI bridge
- [jimmc414/claude_n_codex_api_proxy](https://github.com/jimmc414/claude_n_codex_api_proxy) - Python proxy routing to codex CLI
- [OpenAI Codex Auth Documentation](https://developers.openai.com/codex/auth/) - Official auth.json details
- [openai/codex GitHub](https://github.com/openai/codex) - The CLI (v0.104.0 as of Feb 2026)

## Key Takeaways

- Port 8787 = almost certainly a Cloudflare Worker running locally via wrangler dev
- Path /codex/v1/chat/completions = custom namespace invented by the proxy, not a standard OpenAI endpoint
- CODEX_ACCESS_TOKEN = the OAuth access token extracted from ~/.codex/auth.json (confirmed by official docs)
- The specific tool was NOT found in public indexes - it may be private, very new, or unlisted
- The closest functional equivalent is jimmc414/claude_n_codex_api_proxy but different port and mechanism
- A minimal Bun/Node.js version can be built in ~30 lines

## Related Searches

- Search GitHub directly: CODEX_ACCESS_TOKEN wrangler.toml
- Check musistudio/claude-code-router issues/discussions for community codex integrations
- Check Discord servers for claude-code-router community
