# Bug Fix: docs-mcp Server Not Appearing in Claude Code Despite Correct Configuration

**Related Diagnosis**: #603
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Claude Code not detecting `.mcp.json` due to stale cache/state after configuration changes in #602
- **Fix Approach**: Restart Claude Code and clear cache to reload configuration, with optional configuration enhancements
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Despite issue #602 fixing the `.mcp.json` configuration to use the correct SSE format, Claude Code continues to report "No MCP servers configured." The configuration is verified correct, Docker container is healthy, SSE endpoint is responding, and manual `mcp-remote` connection succeeds. However, the manual testing steps from #602 were never completed, suggesting Claude Code was never properly restarted after the configuration change.

For full details, see diagnosis issue #603.

### Solution Approaches Considered

#### Option 1: Claude Code Restart + Cache Clear ⭐ RECOMMENDED

**Description**: Force Claude Code to reload configuration by restarting the application and clearing any cached state. This addresses the most likely root cause: stale cached configuration from before the #602 fix was applied.

**Pros**:
- Simplest solution with no code changes required
- Directly addresses the most likely root cause (stale cache/state)
- Zero risk of breaking other functionality
- Can be tested immediately
- Aligns with standard practice for configuration reloading
- Diagnosis evidence points to this: "the manual testing steps were never completed"

**Cons**:
- Requires manual intervention (not automated)
- If unsuccessful, requires deeper investigation
- Doesn't provide permanent solution if Claude Code lacks hot-reload capability

**Risk Assessment**: low - No code changes, standard operational procedure

**Complexity**: simple - Straightforward restart procedure

#### Option 2: Add `-y` Flag to npx Command

**Description**: Add the `-y` flag to the `npx` command arguments to automatically accept package installation without prompting. This matches the pattern used in `.mcp.example.json` for the Exa server configuration.

**Pros**:
- Eliminates potential prompt-blocking issues if npx tries to interactively install mcp-remote
- Matches one documented pattern in example configuration
- Simple one-line configuration change
- Ensures non-interactive execution in automated contexts

**Cons**:
- Cloudflare example servers don't use `-y` flag, so pattern is inconsistent
- Manual `npx mcp-remote` test already succeeded without `-y` flag
- Doesn't address the primary issue (cache/restart)
- May be unnecessary given successful manual test

**Why Not Chosen as Primary**: While this is a good defensive enhancement, the diagnosis shows manual npx testing already works without `-y`, making this less likely to be the core issue.

#### Option 3: Use 127.0.0.1 Instead of localhost

**Description**: Replace `localhost` with `127.0.0.1` in the SSE endpoint URL to eliminate potential hostname resolution issues in WSL2 environment.

**Pros**:
- Eliminates DNS resolution as a variable
- May work better in WSL2 networking context
- Simple configuration change

**Cons**:
- Docker container is confirmed accessible via `localhost` (curl test succeeded)
- Manual testing with `localhost` URL already worked
- Less likely to be the root cause given successful endpoint tests
- No evidence in diagnosis pointing to hostname resolution issues

**Why Not Chosen**: Diagnosis explicitly shows successful curl and npx tests using localhost, making hostname resolution an unlikely culprit.

### Selected Solution: Claude Code Restart + Cache Clear with Configuration Enhancement

**Justification**: The diagnosis provides strong evidence that Claude Code was never restarted after the #602 configuration fix. Issue #602's completion report explicitly states "Manual Testing Required" with steps including "Restart Claude Code (if currently running)" and verification that docs-mcp appears in configured servers. These manual testing steps were either never completed or showed continued failure. This pattern is typical of configuration caching issues where the application needs to reload settings after file changes.

The secondary enhancement (adding `-y` flag) provides defensive benefits by ensuring non-interactive execution, eliminating one potential failure mode even though manual testing suggests it's not currently blocking.

**Technical Approach**:
1. Document and execute proper Claude Code restart procedure
2. Clear any cached configuration or state
3. Verify configuration is reloaded
4. Add `-y` flag to npx args as defensive enhancement
5. Validate docs-mcp server appears and tools are available
6. Document restart requirement for future configuration changes

**Architecture Changes**: None - configuration-only fix

**Migration Strategy**: Not applicable - operational procedure only

## Implementation Plan

### Affected Files

List files that need modification:
- `.mcp.json` - Add `-y` flag to npx args for defensive non-interactive execution
- `.ai/ai_docs/tool-docs/mcp-configuration.md` - Document Claude Code restart requirement for configuration changes

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Execute Claude Code Restart Procedure

Document and execute the proper restart procedure to reload `.mcp.json` configuration.

- Exit Claude Code completely (not just close conversation)
- Clear any Claude Code cache or state files if located
- Verify `.mcp.json` still contains correct configuration
- Restart Claude Code in the project directory
- Run `/mcp` command to verify docs-mcp server appears

**Why this step first**: This addresses the most likely root cause (stale cached configuration) with zero risk and may immediately resolve the issue without further changes.

#### Step 2: Add `-y` Flag for Non-Interactive Execution

Enhance `.mcp.json` configuration to ensure non-interactive npx execution.

- Update `.mcp.json` to add `-y` flag: `"args": ["-y", "mcp-remote", "http://localhost:6280/sse"]`
- Validate JSON syntax: `jq empty .mcp.json`
- Verify configuration: `jq '.mcpServers["docs-mcp"]' .mcp.json`
- If Claude Code is running, restart again to reload updated config

**Why this step second**: After confirming restart is necessary, add defensive enhancement to prevent potential prompt-blocking issues.

#### Step 3: Validate docs-mcp Server Detection

Verify docs-mcp server is now properly detected by Claude Code.

- Run `/mcp` command in Claude Code
- Verify "docs-mcp" appears in configured servers list
- Verify docs-mcp tools are available (check available tools list)
- Test a docs-mcp tool (e.g., `mcp__docs-mcp__search_docs`) to confirm functionality

#### Step 4: Document Configuration Change Procedure

Update documentation to prevent recurrence of this issue.

- Add "Configuration Reload" section to `.ai/ai_docs/tool-docs/mcp-configuration.md`
- Document that Claude Code must be restarted after `.mcp.json` changes
- Document cache clearing procedure if applicable
- Add troubleshooting section for "configuration not detected" scenarios

#### Step 5: Validate Complete Solution

Run comprehensive validation to ensure bug is resolved and no regressions.

- Verify docs-mcp tools are available: `/mcp` lists docs-mcp
- Test docs-mcp functionality: execute a search or scrape operation
- Verify Docker container remains healthy: `docker ps | grep docs-mcp`
- Verify SSE endpoint still responding: `curl -N http://localhost:6280/sse`
- Check for any error messages or warnings in Claude Code

## Testing Strategy

### Unit Tests

Not applicable - this is an operational/configuration fix, not code changes requiring unit tests.

### Integration Tests

**Manual integration testing required**:

- ✅ Claude Code restart successfully reloads configuration
- ✅ `/mcp` command detects docs-mcp server
- ✅ docs-mcp tools appear in available tools list
- ✅ docs-mcp tools execute successfully
- ✅ Configuration changes persist across restarts
- ✅ Docker container health remains stable

### E2E Tests

Not applicable - MCP server detection is an infrastructure integration, not an application feature requiring E2E tests.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Exit Claude Code completely
- [ ] Verify `.mcp.json` contains correct SSE configuration
- [ ] Restart Claude Code in project directory
- [ ] Run `/mcp` command → docs-mcp should appear in servers list
- [ ] Verify tools available: `mcp__docs-mcp__search_docs`, `mcp__docs-mcp__scrape_docs`, etc.
- [ ] Test search functionality: Try searching for "typescript" or similar
- [ ] Verify Docker container status: `docker ps | grep docs-mcp` shows healthy
- [ ] Verify SSE endpoint: `curl -N http://localhost:6280/sse` returns event stream
- [ ] Test after adding `-y` flag: Restart Claude Code and verify docs-mcp still appears
- [ ] Verify no error messages or warnings in Claude Code
- [ ] Test docs-mcp tool execution: Run actual search and verify results

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Restart procedure may not clear all cached state**: low likelihood
   - **Likelihood**: low
   - **Impact**: medium (would require deeper investigation)
   - **Mitigation**: Document cache file locations if found; escalate to Claude Code support if restart doesn't work

2. **Adding `-y` flag may cause unexpected behavior**: low likelihood
   - **Likelihood**: low
   - **Impact**: low (can easily revert change)
   - **Mitigation**: Test configuration after adding flag; revert if issues arise; manual test already succeeded without flag

3. **Configuration change may affect other MCP servers**: very low likelihood
   - **Likelihood**: very low
   - **Impact**: medium (other servers might break)
   - **Mitigation**: Only docs-mcp is currently configured; changes are isolated to docs-mcp entry; validate full `/mcp` output

**Rollback Plan**:

If this fix causes issues:
1. Revert `.mcp.json` to previous working state (remove `-y` flag if needed)
2. Validate JSON syntax: `jq empty .mcp.json`
3. Restart Claude Code to reload reverted configuration
4. Escalate to Claude Code support with diagnosis details

**Monitoring**:
- Monitor Claude Code startup for errors related to MCP server initialization
- Watch Docker container health: `docker ps | grep docs-mcp` should remain healthy
- Monitor SSE endpoint responsiveness after changes

## Performance Impact

**Expected Impact**: none

No performance implications. Configuration changes and restart procedure do not affect application runtime performance. MCP server connection overhead is minimal and only occurs during tool invocation.

**Performance Testing**: Not applicable - no performance-sensitive changes

## Security Considerations

**Security Impact**: none

This fix involves operational procedures and minor configuration changes. No security implications:

- No changes to authentication or authorization
- No exposure of sensitive data
- `.mcp.json` remains gitignored (contains local endpoint URL only)
- No changes to network security or Docker container configuration
- SSE endpoint remains localhost-only (not exposed externally)

**Security Note**: The `.mcp.json.backup` file mentioned in diagnosis contains exposed API keys. This backup file should be deleted or secured, but is outside the scope of this immediate fix.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify configuration exists and is correct
jq '.mcpServers["docs-mcp"]' .mcp.json

# Verify Docker container is healthy
docker ps | grep docs-mcp

# Verify SSE endpoint responds
timeout 3 curl -N http://localhost:6280/sse

# In Claude Code: Run /mcp command
# Expected Result: "No MCP servers configured" (bug exists)
```

**Expected Result**: Docker and SSE are healthy, but `/mcp` reports no servers configured

### After Fix (Bug Should Be Resolved)

```bash
# Verify configuration (after adding -y flag)
jq '.mcpServers["docs-mcp"].args' .mcp.json
# Expected: ["-y", "mcp-remote", "http://localhost:6280/sse"]

# Validate JSON syntax
jq empty .mcp.json && echo "✓ Valid JSON"

# Verify Docker container still healthy
docker ps | grep docs-mcp | grep "healthy"

# Verify SSE endpoint still responding
timeout 3 curl -N http://localhost:6280/sse 2>&1 | head -3

# In Claude Code after restart:
# 1. Run /mcp command → docs-mcp should appear
# 2. Check available tools → mcp__docs-mcp__* tools should be listed
# 3. Test a tool → Try mcp__docs-mcp__search_docs query:"test"
```

**Expected Result**: All commands succeed, `/mcp` shows docs-mcp server, tools are available and functional

### Regression Prevention

```bash
# Verify configuration persists
jq '.mcpServers | keys' .mcp.json
# Expected: ["docs-mcp"]

# Verify Docker container remains stable
docker ps --format "{{.Names}}: {{.Status}}" | grep docs-mcp
# Expected: docs-mcp-server: Up X minutes (healthy)

# Test manual mcp-remote connection still works
timeout 5 npx -y mcp-remote http://localhost:6280/sse 2>&1 | head -15
# Expected: "Connected to remote server" and "Proxy established successfully"

# Verify no breaking changes to .mcp.json structure
jq 'has("mcpServers")' .mcp.json
# Expected: true
```

## Dependencies

**No new dependencies required**

All required tools are already present:
- `npx` (v10.9.2) - Node package runner
- `mcp-remote` - Installed on-demand by npx
- `jq` - JSON processor (for validation)
- `curl` - HTTP client (for endpoint testing)
- `docker` - Container management

## Database Changes

**No database changes required**

This is an infrastructure integration fix affecting Claude Code configuration only. No database schema changes, migrations, or data modifications needed.

## Deployment Considerations

**Deployment Risk**: low

This is a local development configuration fix affecting individual developer machines. Not applicable to production deployment.

**Special deployment steps**: None - changes are local to development environment

**Feature flags needed**: no

**Backwards compatibility**: maintained - no breaking changes to configuration format or application behavior

## Success Criteria

The fix is complete when:
- [ ] Claude Code restart procedure documented and executed
- [ ] `/mcp` command lists docs-mcp in configured servers
- [ ] docs-mcp tools appear in available tools list (mcp__docs-mcp__search_docs, mcp__docs-mcp__scrape_docs, etc.)
- [ ] At least one docs-mcp tool successfully executes (e.g., search operation)
- [ ] Configuration change procedure documented in mcp-configuration.md
- [ ] Manual testing checklist 100% complete
- [ ] Docker container remains healthy after changes
- [ ] SSE endpoint remains responsive after changes
- [ ] No error messages or warnings in Claude Code
- [ ] Configuration persists across Claude Code restarts

## Notes

### Key Learnings

1. **Configuration reload is not automatic**: Claude Code requires restart to detect `.mcp.json` changes
2. **Validation must be complete**: Issue #602 was closed without completing manual validation steps
3. **Caching behavior**: Claude Code likely caches MCP server configuration on startup
4. **Pattern inconsistency**: `.mcp.example.json` shows inconsistent use of `-y` flag (Cloudflare omits, Exa includes)

### Historical Context

This is the **4th occurrence** of docs-mcp integration issues (#439, #598/#599, #601/#602, #603). The pattern shows:
- Issues #598, #599, #601, #602: Configuration format problems (fixed)
- Issue #603 (current): Configuration reload/cache problem (being fixed)

### Prevention Strategy

To prevent future occurrences:
1. Always restart Claude Code after modifying `.mcp.json`
2. Complete all manual validation steps before closing issues
3. Document operational procedures alongside technical fixes
4. Consider automation for configuration validation and reload

### Related Documentation

- `.ai/ai_docs/tool-docs/mcp-configuration.md` - MCP configuration guide (created in #602)
- `.mcp.example.json` - Example MCP server configurations
- Diagnosis #603 - Comprehensive diagnosis with all evidence

### Cleanup Task

**Security Note**: The `.mcp.json.backup` file mentioned in diagnosis contains exposed API keys that were properly moved to `.env.local` during #602 fix. **Action Required**: Delete `.mcp.json.backup` to prevent accidental exposure:

```bash
rm .mcp.json.backup
```

This cleanup is recommended but not critical to fixing the immediate issue.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #603*
