# Bug Diagnosis: Supabase Status Output Parsing Failure in CI

**ID**: ISSUE-pending
**Created**: 2025-12-05T19:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The staging-deploy.yml workflow fails because the "Export Supabase environment variables" step cannot correctly parse the Supabase CLI status output. The Supabase CLI has changed its output format, causing the grep/awk patterns to fail silently, resulting in empty environment variables that cause the Next.js application to fail on startup.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: Latest (via setup-deps action)
- **Supabase CLI**: v1 (via supabase/setup-cli@v1)
- **Last Working**: Unknown (format may have changed with Supabase CLI update)

## Reproduction Steps

1. Push code to the `staging` branch
2. Observe the staging-deploy.yml workflow run
3. Check the "Export Supabase environment variables" step output
4. See that `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are all empty
5. Application fails to start, wait-on times out

## Expected Behavior

The "Export Supabase environment variables" step should correctly extract:
- `NEXT_PUBLIC_SUPABASE_URL` (e.g., `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e.g., `sb_publishable_...`)
- `SUPABASE_SERVICE_ROLE_KEY` (e.g., `sb_secret_...`)

## Actual Behavior

All three environment variables are exported as empty strings:
```
✅ Exported NEXT_PUBLIC_SUPABASE_URL=
✅ Exported NEXT_PUBLIC_SUPABASE_ANON_KEY=...
✅ Exported SUPABASE_SERVICE_ROLE_KEY=...
```

This causes the Next.js application to fail with Zod validation errors when the AI Gateway tries to initialize:
```
Error importing Supabase admin client: ZodError - Invalid Supabase Secret Key
```

## Diagnostic Data

### Console Output
```
Full Test Suite	Export Supabase environment variables	2025-12-05T19:36:31.7076926Z ✅ Exported NEXT_PUBLIC_SUPABASE_URL=
Full Test Suite	Export Supabase environment variables	2025-12-05T19:36:31.7077317Z ✅ Exported NEXT_PUBLIC_SUPABASE_ANON_KEY=...
Full Test Suite	Export Supabase environment variables	2025-12-05T19:36:31.7077604Z ✅ Exported SUPABASE_SERVICE_ROLE_KEY=...
```

### Application Startup Error
```json
{
  "timestamp":"2025-12-05T19:37:00.860Z",
  "level":"error",
  "service":"AI-GATEWAY",
  "message":"Error importing Supabase admin client:",
  "data":{
    "name":"ZodError",
    "message":"Invalid Supabase Secret Key. Please add the environment variable SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY."
  }
}
```

### Supabase CLI Output Format Comparison

**OLD FORMAT** (expected by current code):
```
API URL: http://127.0.0.1:54321
Publishable key: eyJhbGci...
Secret key: eyJhbGci...
```

**NEW FORMAT** (actual current output):
```
╭──────────────────────────────────────────────────────╮
│ 🌐 APIs                                              │
├────────────────┬─────────────────────────────────────┤
│ Project URL    │ http://127.0.0.1:54521              │
╰────────────────┴─────────────────────────────────────╯

╭──────────────────────────────────────────────────────────────╮
│ 🔑 Authentication Keys                                       │
├─────────────┬────────────────────────────────────────────────┤
│ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
│ Secret      │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz      │
╰─────────────┴────────────────────────────────────────────────╯
```

## Error Stack Traces

No stack trace - the grep commands fail silently when no match is found, returning empty strings.

## Related Code

- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 160-176)
- **Recent Changes**: Supabase CLI update changed output format
- **Suspected Functions**: "Export Supabase environment variables" step

### Current Broken Code (staging-deploy.yml:164-166)
```bash
SUPABASE_URL=$(npx supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(npx supabase status | grep "Publishable key" | awk '{print $3}')
SUPABASE_SERVICE_KEY=$(npx supabase status | grep "Secret key" | awk '{print $3}')
```

## Related Issues & Context

### Similar Symptoms
- #697 (CLOSED): "E2E test failures due to Supabase port/key mismatch"
- #698 (CLOSED): "E2E test infrastructure should dynamically detect Supabase configuration"
- #710 (CLOSED): "Stale Docker Container Using Old Supabase Port"

### Historical Context
This is a recurring theme - Supabase CLI output format changes have caused issues before. The dynamic detection approach in issue #698 was implemented for local E2E tests but not for CI workflows.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Supabase CLI output format changed from simple key-value pairs to a table format with different field names, causing grep patterns to fail silently.

**Detailed Explanation**:
The workflow uses grep patterns to extract values from `supabase status` output:
- `grep "API URL"` - No longer matches (now called "Project URL")
- `grep "Publishable key"` - No longer matches (now called "Publishable")
- `grep "Secret key"` - No longer matches (now called "Secret")

Additionally, the output now uses table delimiters (`│`) instead of simple colon-separated values, so `awk '{print $3}'` would need to account for the table structure.

**Supporting Evidence**:
1. CI logs show empty values being exported
2. Local testing confirms grep patterns don't match new format:
   ```bash
   npx supabase status | grep "API URL"  # Returns nothing
   npx supabase status | grep "Project URL"  # Returns match
   ```
3. Key format changed from `eyJhbGci...` (JWT) to `sb_publishable_...` and `sb_secret_...`

### How This Causes the Observed Behavior

1. Grep patterns fail to match new field names → empty strings captured
2. Empty strings exported to `GITHUB_ENV`
3. Build step completes (variables not validated at build time)
4. Application starts but AI Gateway fails Zod validation for empty `SUPABASE_SERVICE_ROLE_KEY`
5. Application may partially start but becomes unresponsive
6. `wait-on` times out waiting for http://localhost:3000

### Confidence Level

**Confidence**: High

**Reasoning**:
- Verified locally that grep patterns don't match
- Confirmed new parsing commands work correctly
- CI logs clearly show empty values being exported
- Error message explicitly states missing Supabase key

## Fix Approach (High-Level)

Update the grep/awk patterns in `.github/workflows/staging-deploy.yml` (lines 164-166) to match the new Supabase CLI output format:

```bash
# New patterns that work with current Supabase CLI
SUPABASE_URL=$(npx supabase status | grep "Project URL" | sed 's/│//g' | awk '{print $3}')
SUPABASE_ANON_KEY=$(npx supabase status | grep "Publishable" | sed 's/│//g' | awk '{print $2}')
SUPABASE_SERVICE_KEY=$(npx supabase status | grep -E "^│ Secret" | sed 's/│//g' | awk '{print $2}')
```

Note: The Secret key grep needs `^│ Secret` to avoid matching "Secret key" in other contexts.

## Diagnosis Determination

Root cause confirmed: Supabase CLI output format change broke environment variable extraction in CI workflow. The fix requires updating three grep/awk patterns to match the new table-based output format with changed field names.

## Additional Context

- This workflow was last successfully run before the Supabase CLI format change
- Similar extraction logic may exist in other workflows that need updating
- Consider using `supabase status --output json` for more stable parsing in the future

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run list, grep, awk, sed, npx supabase status*
