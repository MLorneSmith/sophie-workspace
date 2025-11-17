# Bug Fix: MCP Servers Not Appearing in Claude Code

**Related Diagnosis**: #601

## Bug Description

MCP servers configured in `.mcp.json` are not appearing in Claude Code. When running the `/mcp` command, Claude Code reports "No MCP servers configured" despite having multiple servers configured in `.mcp.json`, including the desired `docs-mcp` server. The docs-mcp Docker container is running and healthy on localhost:6280, but Claude Code fails to detect it.

**Symptoms:**

- `/mcp` command shows "No MCP servers configured"
- No MCP servers appear in available tools list
- docs-mcp container is healthy but not detected by Claude Code
- SSE endpoint at `http://localhost:6280/sse` responds correctly
- HTTP endpoint at `http://localhost:6280/mcp` returns 404

**Expected Behavior:**

- Claude Code should detect and load the docs-mcp server from `.mcp.json`
- docs-mcp tools should be available in Claude Code
- Only docs-mcp should be active (user's stated preference)

## Problem Statement

Claude Code does not support the `"type": "http"` configuration format used in `.mcp.json` for the docs-mcp server. Additionally, the configuration points to the wrong endpoint (`/mcp` instead of `/sse`) and contains exposed API keys for multiple servers the user doesn't want active.

## Solution Statement

Update `.mcp.json` to use the correct Claude Code-compatible format for SSE-based MCP servers by using the `npx mcp-remote` wrapper with the `/sse` endpoint. Remove unwanted MCP servers to match user preference (only docs-mcp). Move exposed API keys to environment variables to prevent security vulnerabilities.

## Steps to Reproduce

1. Configure `.mcp.json` with `docs-mcp` using `"type": "http"` and `"url": "http://localhost:6280/mcp"`
2. Start docs-mcp container: `docker compose -f .mcp-servers/docs-mcp/docker-compose.yml up -d`
3. Verify container is healthy: `docker ps | grep docs-mcp`
4. Launch Claude Code
5. Run `/mcp` command to check connected servers
6. Observe: "No MCP servers configured"

## Root Cause Analysis

**Primary Cause:**
Claude Code's MCP client does not support direct HTTP server connections using the `"type": "http"` format. Based on `.mcp.example.json`, remote SSE-based MCP servers must use the `npx mcp-remote` wrapper command.

**Evidence:**

- `.mcp.json` line 63-64 uses unsupported format: `"type": "http", "url": "http://localhost:6280/mcp"`
- `.mcp.example.json` lines 36, 40 show correct format: `"command": "npx", "args": ["mcp-remote", "https://...sse"]`
- Test shows `/mcp` endpoint returns 404 while `/sse` endpoint works correctly
- Previous fix in issue #599 addressed this same problem but configuration has regressed

**Secondary Issues:**

1. **Wrong Endpoint**: Configuration points to `/mcp` (404) instead of `/sse` (working)
2. **Exposed API Keys**: Lines 10, 20, 58 contain hardcoded API keys
3. **Unwanted Servers**: User wants only docs-mcp but 7 servers are configured

**This is a regression** - Issues #598 and #599 (closed 2025-11-14) fixed this exact problem, but the configuration has reverted to the broken state.

## Relevant Files

Use these files to fix the bug:

### `.mcp.json` (lines 62-65)

- Contains the broken docs-mcp configuration using unsupported `"type": "http"` format
- Points to wrong endpoint (`/mcp` instead of `/sse`)
- Contains 6 other MCP server configurations the user doesn't want
- Contains exposed API keys on lines 10, 20, 58

### `.mcp.example.json` (lines 34-40)

- Reference for correct SSE server configuration format
- Shows how to use `npx mcp-remote` with SSE endpoints
- Example: Cloudflare servers use `"command": "npx", "args": ["mcp-remote", "https://...sse"]`

### `.env.local` or `.env` (to be created/updated)

- Will store API keys securely instead of hardcoding in `.mcp.json`
- Prevents accidental exposure in version control

### New Files

#### `.mcp-servers/docs-mcp/.env.example`

- Template for required environment variables for docs-mcp (if any)
- Documents the configuration for future reference

#### `.ai/ai_docs/tool-docs/mcp-configuration.md`

- Documentation on correct MCP server configuration format
- Prevents future regressions
- Reference for maintaining MCP servers

## Step by Step Tasks

### 1. Back Up Current Configuration

- Create backup of current `.mcp.json` as `.mcp.json.backup`
- This allows rollback if needed

### 2. Update docs-mcp Configuration to Use SSE with mcp-remote

- Replace the docs-mcp server configuration (lines 62-65) with the correct format
- Change from `"type": "http", "url": "http://localhost:6280/mcp"` to use `npx mcp-remote`
- Point to the working SSE endpoint: `http://localhost:6280/sse`
- Use the format: `"command": "npx", "args": ["mcp-remote", "http://localhost:6280/sse"]`

### 3. Remove Unwanted MCP Servers

- Remove all server configurations except `docs-mcp` from `.mcp.json`
- Servers to remove: `exa`, `perplexity-ask`, `context7`, `postgres`, `code-reasoning`, `newrelic`
- This matches user's stated preference for only docs-mcp

### 4. Create Environment Variables File for Sensitive Keys

- Create `.env.local` file in project root (if it doesn't exist)
- Add entries for the API keys currently exposed in `.mcp.json`:
  - `EXA_API_KEY` (from line 10)
  - `PERPLEXITY_API_KEY` (from line 20)
  - `NEW_RELIC_API_KEY` (from line 58)
  - `NEW_RELIC_ACCOUNT_ID` (from line 59)
- Document these in `.env.example` for future reference
- Ensure `.env.local` is in `.gitignore`

### 5. Verify docs-mcp Container is Running

- Check container status: `docker ps | grep docs-mcp`
- Verify SSE endpoint responds: `curl -N http://localhost:6280/sse`
- If not running, start with: `docker compose -f .mcp-servers/docs-mcp/docker-compose.yml up -d`

### 6. Test Claude Code MCP Detection

- Restart Claude Code (if currently running)
- Run `/mcp` command to list configured servers
- Verify docs-mcp appears in the list
- Test that docs-mcp tools are available (e.g., search_docs, scrape_docs)

### 7. Create Documentation to Prevent Regression

- Create `.ai/ai_docs/tool-docs/mcp-configuration.md` documenting:
  - Correct format for SSE-based MCP servers
  - How to add/remove MCP servers
  - Security best practices (environment variables)
  - Link to this bug fix for historical context
- Update `.mcp.example.json` to include a docs-mcp example if not already present

### 8. Run Validation Commands

- Execute all validation commands to confirm the bug is fixed with zero regressions
- Verify no exposed secrets remain in `.mcp.json`

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

```bash
# 1. Verify docs-mcp container is running and healthy
docker ps | grep docs-mcp
# Expected: Container shows "Up" status with "(healthy)"

# 2. Verify SSE endpoint is responding
timeout 3 curl -N http://localhost:6280/sse 2>&1 | head -3
# Expected: Should show "event: endpoint" and "data: /messages?sessionId=..."

# 3. Verify .mcp.json has correct format (no "type": "http")
grep -n '"type".*"http"' .mcp.json
# Expected: No output (no matches found)

# 4. Verify .mcp.json uses mcp-remote for docs-mcp
grep -A 3 '"docs-mcp"' .mcp.json
# Expected: Shows "command": "npx" and "mcp-remote" in args

# 5. Verify only docs-mcp is configured (no other servers)
jq '.mcpServers | keys' .mcp.json
# Expected: ["docs-mcp"]

# 6. Verify no exposed API keys in .mcp.json
grep -E '(pplx-|NRAK-|9c7c0675)' .mcp.json
# Expected: No output (no exposed keys found)

# 7. Verify .env.local or .env exists with required keys
test -f .env.local && echo "✓ .env.local exists" || echo "✗ .env.local missing"
# Expected: "✓ .env.local exists"

# 8. Verify .env.local is in .gitignore
grep -q "^\.env\.local$" .gitignore && echo "✓ .env.local in .gitignore" || echo "✗ Add .env.local to .gitignore"
# Expected: "✓ .env.local in .gitignore"

# 9. Test MCP server detection in Claude Code
# MANUAL: Restart Claude Code and run `/mcp` command
# Expected: docs-mcp appears in the configured servers list

# 10. Test docs-mcp tools are available in Claude Code
# MANUAL: In Claude Code, verify mcp__docs-mcp__* tools appear in available tools
# Expected: Tools like mcp__docs-mcp__search_docs are available

# 11. Verify JSON syntax is valid
jq empty .mcp.json && echo "✓ .mcp.json valid JSON" || echo "✗ .mcp.json syntax error"
# Expected: "✓ .mcp.json valid JSON"

# 12. Check for backup file exists
test -f .mcp.json.backup && echo "✓ Backup created" || echo "✗ No backup found"
# Expected: "✓ Backup created"
```

## Notes

### Security Considerations

- **CRITICAL**: The current `.mcp.json` contains exposed API keys that should be rotated:
  - Exa API key: `9c7c0675-4d56-4aae-a039-f93cf72a6cbb`
  - Perplexity API key: `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`
  - New Relic API key: `NRAK-43D25BM1YBGU5L3KJO33067BW75`
- Consider rotating these keys after moving them to environment variables
- Ensure `.env.local` and `.env` are in `.gitignore`

### Regression Prevention

- This is the **third occurrence** of docs-mcp integration issues (#439, #598/#599, current)
- The fix from #599 (2025-11-14) has regressed
- Documentation in `.ai/ai_docs/tool-docs/mcp-configuration.md` will serve as reference
- Add comment in `.mcp.json` linking to this bug fix for future maintainers

### Configuration Format Reference

Claude Code supports these MCP server types:

1. **stdio** (standard input/output): Local servers with `command` and `args`
2. **SSE via mcp-remote**: Remote SSE servers using `npx mcp-remote <sse-url>`
3. **NOT SUPPORTED**: Direct HTTP with `"type": "http"` (the current broken configuration)

### Dependencies

- No new packages required
- Uses existing `npx` (comes with Node.js)
- Uses `mcp-remote` package (installed automatically by npx)

### User Preference

- User wants **only docs-mcp** active
- All other servers (exa, perplexity, context7, postgres, code-reasoning, newrelic) should be removed
- If needed in the future, they can be re-added from `.mcp.json.backup`

### Testing Notes

- Manual testing in Claude Code required to verify full functionality
- Automated validation commands cover configuration correctness
- SSE endpoint must be actively responding for server to connect
