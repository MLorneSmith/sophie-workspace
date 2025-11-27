# Security Audit Report - Dependabot Alerts
Date: 2025-09-24
Branch: dev

## Summary

Dependabot is currently monitoring the **main branch**, which is significantly outdated compared to the **dev branch**. This has resulted in 30 Dependabot alerts on GitHub that are mostly not applicable to the current development branch.

## Key Findings

### 1. Branch Discrepancy
- **Main branch**: Next.js 15.3.3 (outdated)
- **Dev branch**: Next.js 15.5.2 (current)
- Most Dependabot alerts (25 of 30) are for Next.js vulnerabilities already fixed in dev branch

### 2. Actual Vulnerabilities on Dev Branch
After running `pnpm audit` on the dev branch, only **4 vulnerabilities** remain:

#### High Severity (1)
- **Package**: axios < 1.12.0
- **Location**: Transitive dependency via `newrelic > @newrelic/security-agent > axios`
- **Issue**: DoS attack through lack of data size check
- **Status**: Cannot be fixed directly - waiting for upstream package update

#### Moderate Severity (2)
- **Package**: esbuild <= 0.24.2
- **Location**: Transitive dependencies via Payload CMS packages
  - `@payloadcms/db-postgres > drizzle-kit > @esbuild-kit/esm-loader > @esbuild-kit/core-utils > esbuild`
  - `@payloadcms/next > @payloadcms/graphql > tsx > esbuild`
- **Issue**: Development server CORS vulnerability
- **Status**: Cannot be fixed directly - waiting for upstream package updates

#### Low Severity (1)
- Minor vulnerability with minimal impact

## Actions Taken

1. ✅ Updated Next.js to 15.5.2 (already done on dev branch)
2. ✅ Updated newrelic from 12.21.0 to 13.3.3 (latest version)
3. ✅ Verified Payload CMS is at latest stable version (3.56.0)
4. ✅ Cleaned and reinstalled dependencies

## Remaining Issues

The remaining vulnerabilities are in **transitive dependencies** that cannot be fixed directly:
- axios vulnerability requires @newrelic/security-agent to update their axios dependency
- esbuild vulnerabilities require Payload CMS dependencies to update their build tools

## Recommendations

1. **Configure Dependabot to monitor the dev branch** instead of main:
   - Add `.github/dependabot.yml` configuration
   - Set target branch to `dev`

2. **Consider disabling or replacing monitoring tools** if security is critical:
   - NewRelic monitoring could be temporarily disabled if the axios vulnerability is critical
   - The vulnerability only affects the monitoring package, not the main application

3. **Monitor upstream packages** for updates:
   - Watch for @newrelic/security-agent updates
   - Watch for Payload CMS updates that might fix esbuild issues

4. **Update main branch** from dev to align Dependabot alerts with actual codebase

## Risk Assessment

- **Production Impact**: LOW
  - axios vulnerability is in monitoring package only
  - esbuild vulnerability only affects development builds
  - All critical application dependencies are up-to-date

- **Next.js Security**: RESOLVED
  - All Next.js SSRF and Cache Key vulnerabilities are fixed in version 15.5.2

## Next Steps

1. Configure Dependabot for dev branch monitoring
2. Create GitHub issues for upstream dependency updates
3. Consider merging dev → main to update Dependabot baseline
4. Re-evaluate in 2 weeks for upstream package updates