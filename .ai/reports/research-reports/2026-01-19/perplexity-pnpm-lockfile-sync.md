# Perplexity Research: pnpm Lock File Sync Behavior

**Date**: 2026-01-19
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro, sonar)

## Query Summary
When does `pnpm install` need to re-run if node_modules exists but pnpm-lock.yaml changed? How to quickly validate sync state?

## Key Findings

### 1. When Re-install is Required
**Yes, `pnpm install` must be re-run when `pnpm-lock.yaml` changes**, even if `node_modules` exists. pnpm checks if installed dependencies match the lockfile and will update `node_modules` accordingly.

### 2. Quick Validation Methods

| Method | Speed | Behavior |
|--------|-------|----------|
| `pnpm install --frozen-lockfile` | **Near-instant when in sync** | Fails immediately if out of sync; skips resolution/downloads when matched |
| `pnpm install` (default) | Near-instant when in sync | Auto-detects mismatches, updates as needed |
| `pnpm install --lockfile-only` | Fast | Updates only lockfile, no node_modules changes |

**No built-in hash comparison command exists** - community has requested a `pnpm verify` command but none exists officially.

### 3. Performance When Already Synced
- **Headless mode activates**: Skips dependency resolution, registry fetches
- **Completes in <1 second** for typical projects
- Only validates existing state, minimal I/O

### 4. Risks of Skipping Install After Branch Switch
- Runtime errors from incorrect package versions
- Missing transitive dependencies
- Build failures in CI where `--frozen-lockfile` enforces strict matching

## Recommendation for E2B Sandbox

**Best approach**: Always run `pnpm install --frozen-lockfile` after branch checkout.

```bash
# Fast and safe - fails if lockfile changed, near-instant if synced
pnpm install --frozen-lockfile
```

This is:
- **Fast when synced**: <1 second (headless mode)
- **Safe when different**: Fails fast with clear error rather than using wrong deps
- **CI-standard**: Same behavior as production pipelines

**Alternative**: Compare lockfile hash before/after checkout to skip when unchanged:
```bash
# Store hash before checkout
LOCK_HASH_BEFORE=$(sha256sum pnpm-lock.yaml | cut -d' ' -f1)

# After checkout
LOCK_HASH_AFTER=$(sha256sum pnpm-lock.yaml | cut -d' ' -f1)

if [ "$LOCK_HASH_BEFORE" != "$LOCK_HASH_AFTER" ]; then
  pnpm install --frozen-lockfile
fi
```

## Sources
- pnpm official documentation on lockfile behavior
- pnpm CLI reference for --frozen-lockfile and --lockfile-only flags
