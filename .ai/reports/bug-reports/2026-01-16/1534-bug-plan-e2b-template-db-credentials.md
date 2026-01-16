# Bug Fix: E2B Template Database Misconfiguration

**Related Diagnosis**: #1533
**Severity**: high
**Bug Type**: configuration
**Risk Level**: medium
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2B template `.env` contains hardcoded production Supabase credentials that override sandbox credentials injected by the orchestrator
- **Fix Approach**: Remove/comment out hardcoded DATABASE_URL and DATABASE_URI variables, rebuild E2B template
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2B sandbox template (`packages/e2b/e2b-template/.env`) contains hardcoded credentials for the production Supabase instance (`ldebzombxtszzcgnylgq`). When the Alpha Orchestrator attempts to inject sandbox Supabase credentials via environment variables during command execution, the template's `.env` file takes precedence, causing:

1. **Payload seeding runs on production** instead of sandbox (polluting production database)
2. **Database events don't appear in UI** because they're captured from the wrong database
3. **Sandbox database remains unseeded** with no `payload.users` table

The orchestrator's `seedSandboxDatabase()` function expects to connect to sandbox Supabase (`kdjbbhjgogqywtlctlzq`) via environment variables, but the E2B template's hardcoded `.env` overrides this.

For full details, see diagnosis issue #1533.

### Solution Approaches Considered

#### Option 1: Remove hardcoded credentials from template ⭐ RECOMMENDED

**Description**: Delete or comment out the `DATABASE_URL` and `DATABASE_URI` lines from `packages/e2b/e2b-template/.env`, allowing environment variables injected during command execution to take precedence.

**Pros**:
- Simplest fix with minimal code changes
- Allows orchestrator's injected environment variables to work correctly
- No additional dependencies or configuration needed
- Clear separation: template provides defaults, orchestrator provides overrides
- Directly addresses the root cause

**Cons**:
- Template `.env` becomes less complete (but this is appropriate for a template)
- Requires rebuilding E2B template

**Risk Assessment**: low - changes only configuration, no code logic affected

**Complexity**: simple - one file, straightforward deletion

#### Option 2: Use environment variable substitution in template

**Description**: Keep `DATABASE_URL` in template but make it reference an environment variable with a fallback: `DATABASE_URL=${SUPABASE_SANDBOX_DB_URL:-postgresql://...}`.

**Pros**:
- Template remains "complete" with default values
- Explicit about what can be overridden

**Cons**:
- More complex to maintain
- Requires understanding shell variable substitution
- Still requires careful ordering of variable definitions
- Adds unnecessary complexity for a template

**Why Not Chosen**: Option 1 is cleaner. Templates are meant to provide baselines; orchestrator provides specific values.

#### Option 3: Move secrets to external file

**Description**: Create separate `.env.production` and `.env.sandbox` files, load the appropriate one based on E2B_ENVIRONMENT variable.

**Pros**:
- Keeps different environments completely separate
- Easy to manage multiple environments

**Cons**:
- Requires additional file management
- More complex orchestrator integration
- Overkill for this use case (template should be generic)
- Hard to maintain multiple credential files

**Why Not Chosen**: Violates the principle that templates should be generic. The orchestrator is responsible for providing environment-specific values.

### Selected Solution: Remove hardcoded credentials from template

**Justification**: This is the correct separation of concerns. The E2B template should provide generic, reusable configuration. The orchestrator provides environment-specific values at runtime via `sandbox.commands.run({ envs: getAllEnvVars() })`. By removing the hardcoded credentials, the template becomes truly generic and allows orchestrators (or any other controller) to inject their own credentials.

**Technical Approach**:
1. Open `packages/e2b/e2b-template/.env`
2. Comment out or remove lines containing production database credentials:
   - `DATABASE_URL=postgresql://postgres.ldebzombxtszzcgnylgq:...`
   - `DATABASE_URI=postgresql://postgres.ldebzombxtszzcgnylgq:...`
3. Keep all other configuration (API keys, Supabase URL for client-side, etc.) as needed
4. Rebuild E2B template with `e2b template build`
5. Update E2B CLI to use new template version

**Architecture Changes**: None. This is purely a configuration fix that makes the orchestrator's environment variable injection work as intended.

**Migration Strategy**: No data migration needed. After rebuilding the template and running new sandboxes:
1. Old sandboxes continue to use old template (no change in behavior)
2. New sandboxes will use new template (correct credentials)
3. Future orchestrator runs will correctly seed sandbox database

## Implementation Plan

### Affected Files

- `packages/e2b/e2b-template/.env` - Remove hardcoded production database credentials

### Step-by-Step Tasks

#### Step 1: Review current template configuration

Read the template `.env` file and identify which lines need to be removed/commented.

**Why this step first**: Need to understand exactly what's configured before making changes. The template may have other variables we want to keep.

#### Step 2: Remove hardcoded production database credentials

Remove or comment out the following lines from `packages/e2b/e2b-template/.env`:
```
DATABASE_URL=postgresql://postgres.ldebzombxtszzcgnylgq:...
DATABASE_URI=postgresql://postgres.ldebzombxtszzcgnylgq:...
```

Keep all other configuration intact. These lines are specifically for the old hardcoded production credentials.

**Specific changes**:
- Delete or comment lines 20 and 47 from `.env` (the DATABASE_URL and DATABASE_URI lines with production project ID `ldebzombxtszzcgnylgq`)

#### Step 3: Rebuild E2B template

Run the E2B CLI build command to rebuild the template with the updated configuration.

```bash
cd packages/e2b
e2b template build
```

This creates a new version of the `slideheroes-claude-agent` template with the corrected `.env` configuration.

#### Step 4: Update E2B orchestrator reference

If the orchestrator hardcodes a template version, update it to reference the new template version (or leave it as `latest` to automatically use the newest build).

Check `.ai/alpha/e2b-orchestrator.ts` or similar for template version references.

#### Step 5: Test with sandbox database creation

Create a new test sandbox to verify the corrected credentials work:

```bash
# This should now use sandbox credentials correctly
pnpm --filter @kit/sandbox run sandbox create --test
```

Verify that environment variables injected by orchestrator are respected.

#### Step 6: Validation

Run all validation commands to ensure no regressions:

- [ ] TypeScript compiles without errors
- [ ] No lint errors in template files
- [ ] E2B template builds successfully
- [ ] Sandbox can be created with new template
- [ ] Environment variables are properly inherited/overridden

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Build E2B template successfully
- [ ] Create new sandbox from updated template
- [ ] Verify sandbox connects to **sandbox** Supabase (kdjbbhjgogqywtlctlzq) not production
- [ ] Run Payload migrations inside sandbox - verify data appears in sandbox DB, not production
- [ ] Database events are captured from sandbox database
- [ ] No errors in orchestrator logs related to database connection
- [ ] Verify production database has not been modified (no new payload.users table)
- [ ] Verify sandbox database now has complete Payload schema after seeding

### Verification Steps

1. **Before fix**:
   ```bash
   # Template should show production credentials
   cat packages/e2b/e2b-template/.env | grep DATABASE_URL
   # Should output: DATABASE_URL=postgresql://postgres.ldebzombxtszzcgnylgq:...
   ```

2. **After fix**:
   ```bash
   # Template should NOT have hardcoded production database URL
   cat packages/e2b/e2b-template/.env | grep DATABASE_URL
   # Should output: nothing (or commented out)
   ```

3. **Integration test**:
   ```bash
   # Create sandbox and verify it uses sandbox credentials
   pnpm --filter @kit/sandbox run sandbox create --test
   # Check: E2B_CONTAINER_DEBUG should show sandbox credentials being used
   ```

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Old sandboxes still use old template**:
   - Likelihood: high (expected behavior)
   - Impact: low (old sandboxes continue working with old credentials)
   - Mitigation: This is normal. New sandboxes will use new template. Old sandboxes can be torn down.

2. **E2B template build fails**:
   - Likelihood: low (simple configuration change)
   - Impact: medium (blocks sandbox creation)
   - Mitigation: Test locally before merging. Revert if build fails.

3. **Environment variables not propagated correctly**:
   - Likelihood: low (orchestrator mechanism is proven)
   - Impact: high (sandbox still connects to production)
   - Mitigation: Thoroughly test sandbox creation with database operations. Verify sandbox Supabase credentials are being used.

4. **Breaking change for other E2B users**:
   - Likelihood: low (only used internally)
   - Impact: medium (if external users depend on hardcoded credentials)
   - Mitigation: Check if template is shared externally. If so, document breaking change.

**Rollback Plan**:

If this fix causes issues:
1. Restore previous E2B template version: `e2b template revert --version <previous>`
2. Delete or disable new template version
3. Verify sandboxes revert to old behavior
4. Investigate what went wrong with environment variable injection
5. Re-examine orchestrator's `sandbox.commands.run({ envs: getAllEnvVars() })` implementation

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Rebuild E2B template after merging changes: `cd packages/e2b && e2b template build`
- Wait for template build to complete (usually 2-5 minutes)
- Verify new template version is available in E2B dashboard
- Update any hardcoded template version references in code to point to new version (or use `latest`)

**Feature flags needed**: no

**Backwards compatibility**: maintained (old sandboxes unaffected, new sandboxes get correct behavior)

## Success Criteria

The fix is complete when:
- [ ] E2B template builds successfully with updated `.env`
- [ ] New sandboxes created from template use correct (sandbox) Supabase credentials
- [ ] Payload seeding runs against sandbox database, not production
- [ ] Database events from sandbox appear in Alpha Orchestrator UI
- [ ] Sandbox database is properly seeded with all Payload tables
- [ ] Production database has not been modified
- [ ] All validation commands pass
- [ ] No new errors in logs

## Notes

**Security Note**: The template `.env` file contains (or contained) production API keys. Ensure that:
1. These credentials are rotated in Supabase admin console (if they were exposed in git history)
2. The template is not shared externally with production credentials
3. Use `.env.example` or similar for template defaults, never commit actual secrets

**Related Issues**:
- #1522: Event emitter (implemented correctly)
- #1526: UI routing (implemented correctly)
- #1530: Timing/verification (implemented correctly)
- #1529: Original diagnosis (predecessor to this diagnosis)

**Template Rebuild Commands** (for reference):
```bash
# Build template
cd packages/e2b
e2b template build

# List versions
e2b template list

# Delete old version (if needed)
e2b template delete --version <old-version>
```

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1533*
