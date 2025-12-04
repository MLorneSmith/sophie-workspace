# Bug Fix: NODE_ENV=production in Claude Code causes Payload CMS SSL connection errors

**Related Diagnosis**: #881 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Claude Code shell sets NODE_ENV=production, which propagates to Payload CMS database adapter and forces SSL enablement for local development connections
- **Fix Approach**: Add NODE_ENV override in `.claude/settings.local.json` to force development mode
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When running Payload CMS development server through Claude Code, the database connection fails with "self-signed certificate in certificate chain" error. The root cause is that Claude Code v2.0.58 sets NODE_ENV=production in its shell environment. This environment variable propagates to the Payload CMS database adapter singleton, which has a `shouldEnableSSL()` method that checks `process.env.NODE_ENV` and returns `true` for production. This causes the adapter to enable SSL with `{ rejectUnauthorized: false }`, which attempts SSL negotiation with the local Supabase PostgreSQL database that has `ssl = off`, resulting in a certificate chain error.

For full details, see diagnosis issue #881.

### Solution Approaches Considered

#### Option 1: Override NODE_ENV in Claude Code settings ⭐ RECOMMENDED

**Description**: Add environment variable override in `.claude/settings.local.json` to force NODE_ENV=development for this project. Claude Code's shell initialization respects environment overrides in the settings file, allowing local project configuration to supersede the binary defaults.

**Pros**:
- Simplest fix - single JSON configuration change
- No code modifications needed
- Works immediately without any build/restart complexity
- Respects the "configuration over code" principle
- Non-breaking - doesn't affect production code
- Reusable pattern for other similar Claude Code environment issues

**Cons**:
- Only fixes the issue for Claude Code usage
- Doesn't improve the robustness of the database adapter itself
- Requires every user to have the settings configured

**Risk Assessment**: low - purely configuration, no logic changes
**Complexity**: simple - add 3-4 lines to settings JSON

#### Option 2: Modify database adapter to add explicit SSL disable check

**Description**: Add a `PAYLOAD_DISABLE_SSL` environment variable check to the `shouldEnableSSL()` method that takes precedence over NODE_ENV, allowing local development to explicitly disable SSL even in production mode.

**Pros**:
- Improves adapter robustness for other similar scenarios
- Provides explicit control over SSL behavior
- Could benefit other environments where NODE_ENV doesn't reflect actual SSL need
- Doesn't require external configuration for end users

**Cons**:
- Adds logic to production code for development purposes
- Introduces another environment variable to document and maintain
- Doesn't fix the root cause (NODE_ENV mismatch)
- More complex than Option 1

**Why Not Chosen**: While this approach improves robustness, it treats a symptom rather than the root cause. The real issue is that Claude Code's NODE_ENV doesn't reflect the actual development environment. Adding special cases to code makes it harder to reason about what mode the application is truly in. Option 1 is more correct - it aligns the reported environment with reality.

#### Option 3: Modify Payload dev script to explicitly set NODE_ENV

**Description**: Update the Payload CMS package.json dev script to use `cross-env NODE_ENV=development` to explicitly override any inherited environment variable.

**Pros**:
- Self-contained fix within the Payload package
- Doesn't require Claude Code configuration
- Works in any shell environment

**Cons**:
- Masks the underlying problem (NODE_ENV mismatch)
- Requires script modification in version-controlled code
- If other packages also respect NODE_ENV, this doesn't fix them
- Less general solution

**Why Not Chosen**: This is a band-aid that doesn't address the root NODE_ENV mismatch in Claude Code. Option 1 is more comprehensive and prevents this from affecting other packages or commands.

### Selected Solution: Override NODE_ENV in Claude Code settings

**Justification**: The root cause is that Claude Code's shell has NODE_ENV=production while the user intends to run in development mode. The most direct and correct fix is to configure Claude Code to use the appropriate environment for this project. This aligns the reported environment with reality, prevents the problem at the source, and doesn't introduce workarounds in production code. It's also the simplest to implement and validate.

**Technical Approach**:
- Add `.claude/settings.local.json` file (or update existing) with env override
- Set `NODE_ENV: development` in the env section
- Claude Code's shell initialization respects settings.local.json overrides
- This fix applies to all commands run in the Claude Code shell

**Architecture Changes** (if any):
None - this is purely configuration.

**Migration Strategy** (if needed):
Not applicable - no data migration needed.

## Implementation Plan

### Affected Files

List files that need modification:
- `.claude/settings.local.json` - Add NODE_ENV environment override

### New Files

None needed - we're only creating/modifying an existing configuration file.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Create or update Claude Code settings

Read the current settings file (if it exists) to understand the structure, then add the NODE_ENV override to the env section.

- Check if `.claude/settings.local.json` exists
- If it exists, read the current content and preserve all existing settings
- Add `"env": { "NODE_ENV": "development" }` to the configuration
- If the file has an existing env section, add NODE_ENV to it
- Save the updated file

**Why this step first**: We need to configure the environment before testing. This is the foundation of the fix.

#### Step 2: Verify the fix in Claude Code shell

Test that the environment override is actually being applied.

- Open a new Claude Code shell/terminal
- Run `echo $NODE_ENV` to verify it shows "development"
- If it still shows "production", check that settings.local.json is in the correct location and has valid JSON

#### Step 3: Start Payload dev server and test connection

Start the Payload CMS development server and verify the database connection works.

- Kill any existing Payload processes on port 3020: `fuser -k 3020/tcp`
- Start Payload dev server: `cd apps/payload && pnpm dev`
- Wait for server to start (look for "ready - started server on" message)
- Test the connection with: `curl -s http://localhost:3020/api/users/me`
- Should get either a 401 (unauthenticated but connected) or 200 response, NOT an SSL error
- Check logs for "self-signed certificate in certificate chain" - should not appear

**Why this step third**: After configuration and verification, we test the actual fix.

#### Step 4: Verify existing Payload CMS functionality

Run a few basic operations to ensure nothing is broken.

- Check that the Payload CMS admin panel loads at `http://localhost:3020/admin`
- Verify you can log in with test credentials (if available)
- Test a basic data fetch operation
- Check browser console and server logs for errors

#### Step 5: Run validation commands

Ensure no regressions and everything builds correctly.

- Run `pnpm typecheck` - should pass
- Run `pnpm lint` - should pass
- No changes to code, but verify the build system is clean

## Testing Strategy

### Integration Tests

The fix is configuration-based, so manual testing is the appropriate approach.

**Test scenarios**:
- ✅ Verify NODE_ENV is "development" in Claude Code shell
- ✅ Payload CMS dev server starts without SSL errors
- ✅ Database connection is successful
- ✅ API endpoints respond without certificate errors
- ✅ Admin panel loads and is functional
- ✅ No SSL-related errors in server logs

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Echo $NODE_ENV in Claude Code shell shows "development"
- [ ] Start Payload dev server with no SSL errors
- [ ] Curl to http://localhost:3020/api/users/me succeeds (not SSL error)
- [ ] No "self-signed certificate in certificate chain" in logs
- [ ] Payload admin panel loads without errors
- [ ] Can authenticate and interact with admin panel
- [ ] No certificate-related errors in browser console
- [ ] Verify settings.local.json has valid JSON syntax

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect JSON syntax in settings file**: If `.claude/settings.local.json` has syntax errors, Claude Code may fail to parse it and revert to defaults.
   - **Likelihood**: low
   - **Impact**: medium (entire Claude Code session affected)
   - **Mitigation**: Validate JSON syntax after editing. Use `jq . .claude/settings.local.json` to validate.

2. **Settings file not being read by Claude Code**: If the file isn't in the correct location or the version doesn't support env overrides.
   - **Likelihood**: low
   - **Impact**: medium (fix doesn't work)
   - **Mitigation**: Test immediately after creating file. Check Claude Code documentation for correct settings file location and version requirements.

3. **Other environment-specific logic breaks**: If other parts of the system rely on NODE_ENV=production for specific behavior in Claude Code.
   - **Likelihood**: very low
   - **Impact**: low (would only affect Claude Code usage)
   - **Mitigation**: Run full validation suite. Monitor for unexpected behavior.

**Rollback Plan**:

If this fix causes issues:
1. Delete or rename `.claude/settings.local.json` to revert to Claude Code defaults
2. NODE_ENV will revert to "production"
3. Payload will require workarounds again, but system remains stable

**Monitoring** (if needed):

None - this is a configuration fix for a development tool, not a production change.

## Performance Impact

**Expected Impact**: none

No performance implications - this is purely an environment configuration change for development.

## Security Considerations

**Security Impact**: none

This fix only affects the development environment in Claude Code. Setting NODE_ENV=development in development is the correct security posture.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current NODE_ENV (without the fix)
echo $NODE_ENV
# Should show: production

# Start Payload and observe the SSL error
cd apps/payload && pnpm dev
# Should show: "self-signed certificate in certificate chain"
```

**Expected Result**: NODE_ENV shows "production" and SSL error occurs.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Verify NODE_ENV in Claude Code shell
echo $NODE_ENV
# Should show: development

# Start Payload dev server
cd apps/payload && pnpm dev
# Should start without SSL errors

# Test connection
curl -s http://localhost:3020/api/users/me
# Should not show SSL error (may show 401 but that's OK)
```

**Expected Result**: All commands succeed, NODE_ENV is development, Payload starts without SSL errors, database connection works.

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This is a local development configuration for Claude Code and doesn't affect any deployed systems.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained - this only affects Claude Code development shell

## Success Criteria

The fix is complete when:
- [ ] `.claude/settings.local.json` exists with NODE_ENV=development in env section
- [ ] `echo $NODE_ENV` in Claude Code shell shows "development"
- [ ] Payload CMS dev server starts without SSL errors
- [ ] Database connection is successful
- [ ] No "self-signed certificate in certificate chain" errors in logs
- [ ] API endpoints respond correctly
- [ ] Payload admin panel loads and is functional
- [ ] pnpm typecheck and pnpm lint both pass
- [ ] Manual testing checklist all items verified

## Notes

**Context**: This fix addresses a regression introduced when Claude Code (v2.0.58+) started setting NODE_ENV=production by default. The issue only manifests in Claude Code environments, not in regular terminals. This is why the bug wasn't caught in normal development workflows.

**Why this approach is correct**: Rather than adding special cases to production code or modifying version-controlled scripts, we configure the tool to accurately report the development environment. This is the most maintainable and correct approach.

**References**:
- Diagnosis issue: #881 - NODE_ENV=production in Claude Code causes Payload CMS SSL connection errors
- Related code: `apps/payload/src/lib/database-adapter-singleton.ts` lines 170-183 (shouldEnableSSL method)
- Claude Code documentation: Check for settings.local.json location and env override support

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #881*
