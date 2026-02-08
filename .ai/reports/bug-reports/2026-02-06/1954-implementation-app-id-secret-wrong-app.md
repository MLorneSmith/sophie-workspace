# Implementation Report: APP_ID Secret Points to Wrong GitHub App

**Issue**: #1954
**Date**: 2026-02-06
**Type**: Bug Fix (configuration)
**Severity**: Medium

## Summary

- Created new GitHub App "SlideHeroes Bot" for PR creation (separate identity from Approval Bot)
- Updated `APP_ID` and `APP_PRIVATE_KEY` repository secrets to point to new app
- `APPROVAL_APP_ID` and `APPROVAL_APP_PRIVATE_KEY` remain pointing to SlideHeroes Approval Bot

## Root Cause

The `APP_ID` and `APP_PRIVATE_KEY` repository secrets were pointing to the SlideHeroes Approval Bot. No separate "main" GitHub App existed for PR creation. This caused the same app to create and try to approve its own PRs, triggering GitHub's "Can not approve your own pull request" error.

## Fix Applied

1. Created new GitHub App "SlideHeroes Bot" with required permissions (Contents, Pull requests, Issues, Checks read/write)
2. Installed app on `slideheroes/2025slideheroes` repository
3. Updated `APP_ID` secret to new app's ID
4. Updated `APP_PRIVATE_KEY` secret to new app's private key
5. Closed stale PR #1950 (created by wrong app identity)

## Verification

- Workflow run #21754048045: "Assess Promotion Readiness" job succeeded
- PR #1958 created by `app/slideheroes-bot`
- PR #1958 approved by `slideheroes-approval-bot`
- No "Can not approve your own pull request" error

## Architecture (Now Correct)

| Secret | Points To | Role |
|--------|-----------|------|
| `APP_ID` | SlideHeroes Bot | Creates PRs |
| `APPROVAL_APP_ID` | SlideHeroes Approval Bot | Approves PRs |

## Files Changed

No code files changed. Configuration-only fix (repository secrets).

## Follow-up Items

- "Check for Stale Deployment" job has a pre-existing JS syntax error at `.github#59` (unrelated, should be tracked separately)
- `staging-promotion-readiness.yml` also uses `APP_ID` — should now work correctly too
