# Implementation Report: E2E Sharded Tests Fix

**Issue**: #1570 - Bug Fix: E2E Sharded Tests Fail - No Web Server Running
**Status**: ✅ Complete
**Date**: 2026-01-16

## Summary

Added Playwright's `webServer` configuration to all config files to automatically start the Next.js server before running tests. This fixes the `ERR_CONNECTION_REFUSED` errors in E2E sharded tests.

## Changes Made

### 1. Main Config (`apps/e2e/playwright.config.ts`)
- Added `webServer` array to start both servers:
  - Web server on port 3001
  - Payload server on port 3021
- Used array syntax to support both projects (chromium and payload)

### 2. Smoke Config (`apps/e2e/playwright.smoke.config.ts`)
- Added `webServer` configuration for web server on port 3001

### 3. Auth Config (`apps/e2e/playwright.auth.config.ts`)
- Added `webServer` configuration for web server on port 3001

### 4. Billing Config (`apps/e2e/playwright.billing.config.ts`)
- Added `webServer` configuration for web server on port 3001

### 5. Workflow (`github/workflows/e2e-sharded.yml`)
- Documented removal of unused `PLAYWRIGHT_WEB_COMMAND` and `PLAYWRIGHT_PAYLOAD_COMMAND` environment variables
- Server startup is now handled by Playwright's webServer config

## Files Changed

```
.github/workflows/e2e-sharded.yml       |  5 +-
apps/e2e/playwright.auth.config.ts      | 11 +++
apps/e2e/playwright.billing.config.ts   | 11 +++
apps/e2e/playwright.config.ts           | 32 ++++++---
apps/e2e/playwright.smoke.config.ts     | 11 +++
5 files changed, 58 insertions(+), 12 deletions(-)
```

## Commits

```
3f9292a8d fix(e2e): add webServer config to all Playwright configs
```

## Validation Results

- ✅ `pnpm typecheck` - Passed (39 successful tasks)
- ✅ `pnpm lint:fix` - Passed (no lint errors)
- ✅ `pnpm format:fix` - Passed

## Technical Details

- Used Playwright's array syntax for `webServer` to start multiple servers in main config
- Configured `reuseExistingServer: !process.env.CI` to start fresh in CI, reuse locally
- Set `timeout: 120 * 1000` (2 minutes) for build compilation
- Used `stdout: "ignore"` and `stderr: "pipe"` to reduce log noise while capturing errors

## Follow-up Items

- Monitor first 3 E2E workflow runs for stability
- Verify no `ERR_CONNECTION_REFUSED` errors in shard logs
