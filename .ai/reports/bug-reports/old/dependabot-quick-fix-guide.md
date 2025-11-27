# Dependabot GitHub Actions Failure - Quick Fix Guide

**TL;DR**: Dependabot PRs fail because:
1. Secrets aren't accessible (GitHub security design)
2. Composite action uses v4 while workflows use v6
3. Artifact v6 requires explicit merge configuration

---

## Immediate Fix Options

### Option A: Skip Workflows for Dependabot (Fastest)

Add to each failing workflow:

```yaml
jobs:
  job-name:
    if: github.actor != 'dependabot[bot]'
    # ... rest of job
```

**Time**: 5 minutes
**Risk**: Low
**Tradeoff**: Dependabot PRs won't be fully tested

---

### Option B: Update Composite Action (Recommended)

File: `.github/actions/setup-deps/action.yml`

Change line 12:
```yaml
# FROM:
- uses: actions/setup-node@v4

# TO:
- uses: actions/setup-node@v6
  with:
    node-version-file: '.nvmrc'
    cache: 'pnpm'
    cache-dependency-path: 'pnpm-lock.yaml'
```

**Time**: 10 minutes + testing
**Risk**: Medium
**Benefit**: Full compatibility with updated actions

---

### Option C: Add merge-multiple to Artifact Downloads

File: `.github/workflows/e2e-sharded.yml` (line 206)

```yaml
- name: Download all shard results
  uses: actions/download-artifact@v6
  with:
    path: shard-results
    pattern: e2e-results-shard-*-${{ github.run_id }}
    merge-multiple: true  # ADD THIS LINE
```

**Time**: 2 minutes
**Risk**: Low
**Benefit**: Fixes E2E artifact collection

---

## Complete Fix (All Issues)

1. **Update composite action** (Option B above)
2. **Add merge-multiple** (Option C above)
3. **Configure Dependabot secrets**:
   - GitHub Settings → Secrets → Dependabot
   - Add: `NEXT_PUBLIC_CAPTCHA_SITE_KEY` = "test-key"
   - Add: `NEXT_PUBLIC_SUPABASE_PUBLIC_KEY` = "test-key"

**Total Time**: 20 minutes
**Risk**: Medium
**Result**: Fully working Dependabot PR

---

## Testing Command

```bash
# Create test branch
git checkout -b test/fix-dependabot-actions origin/dependabot/github_actions/dev/github-actions-3e74b0b7b6

# Apply fixes above

# Test manually
gh workflow run e2e-sharded.yml --ref test/fix-dependabot-actions
```

---

## Which Actions Have Breaking Changes?

| Action | Breaking? | Fix Required |
|--------|-----------|--------------|
| actions/checkout v5 | No | None |
| actions/setup-node v6 | **YES** | Update composite action |
| actions/download-artifact v6 | **YES** | Add merge-multiple |
| pnpm/action-setup v4 | Maybe | Watch for cache issues |
| All others | No | None |

---

## Quick Decision Matrix

**If you have 5 minutes**: Use Option A (skip for Dependabot)
**If you have 20 minutes**: Use Complete Fix
**If failures persist**: Close Dependabot PR, upgrade manually in stages

---

## Files to Edit

1. `.github/actions/setup-deps/action.yml` - Line 12 (setup-node version)
2. `.github/workflows/e2e-sharded.yml` - Line 206 (add merge-multiple)
3. `.github/workflows/bundle-size-alert.yml` - Add job condition (optional)

---

## Validation

After fixes, check:
- [ ] E2E workflow completes all shards
- [ ] Artifact download succeeds
- [ ] Bundle size workflow builds successfully
- [ ] Normal (non-Dependabot) PRs still work

---

**Full details**: See `dependabot-github-actions-failure-analysis.md`
