# Perplexity Research: ERR_PNPM_LOCKFILE_CONFIG_MISMATCH with patchedDependencies in pnpm 10.x

**Date**: 2026-02-06
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched the `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` error specifically for `patchedDependencies` in pnpm 10.x (~10.14.0), where `pnpm install --frozen-lockfile` works locally but fails on Vercel's build servers. The project uses lockfileVersion 9.0, has `legacy-peer-deps=true` and `public-hoist-pattern` entries in `.npmrc`.

## Findings

### 1. Root Cause: pnpm 10.x Hashing Breaking Change

This is a **confirmed pnpm 10 breaking change** documented in GitHub issue pnpm/pnpm#9608 (opened Jun 2025, closed Jun 2025).

**What changed**: pnpm 10.x introduced a new hashing mechanism for `patchedDependencies` in the lockfile. Instead of storing patch paths directly, pnpm 10 computes a **hash of the `patchedDependencies` configuration** and embeds it in `pnpm-lock.yaml`. When running `--frozen-lockfile`, it strictly compares the hash of the current `patchedDependencies` from `package.json` against the one stored in the lockfile.

**Key details**:
- The hashing algorithm changed between minor versions of pnpm 10.x (e.g., lockfile generated with 10.6.x may mismatch when installed with 10.11.x+)
- The `patchedDependencies` section in lockfile includes both `hash` and `path` fields
- Even with identical `package.json` config, different pnpm minor versions can compute different hashes

### 2. Vercel Build Environment Effects

**Vercel's behavior is a primary trigger** for this error:

- **pnpm version mismatch**: Vercel may auto-detect and use a different pnpm version than your local environment. Even small version differences (e.g., 10.12 vs 10.14) can cause hash mismatches.
- **Frozen lockfile by default**: Vercel runs `pnpm install --frozen-lockfile` in CI by default, which enforces strict config matching.
- **Corepack behavior**: If `packageManager` is set in `package.json`, Vercel uses corepack to install the exact version. If not set, Vercel may pick its own default pnpm version.
- **No user-level .npmrc**: Vercel's build environment does not have user-level `.npmrc` settings that may exist locally (e.g., `auto-install-peers` in `~/Library/Preferences/pnpm/rc` on macOS).

**Related Vercel issues**: vercel/vercel#8272, Vercel Community thread on deploy error pnpm 10.4

### 3. Line Ending Differences (CRLF vs LF)

**Not a direct cause**. Research found no evidence that line ending differences in `pnpm-lock.yaml` cause `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. The YAML lockfile format handles line endings robustly. However:

- Patch files (`.patch`) committed with inconsistent line endings across OSes (Windows CRLF vs Unix LF) could **indirectly** affect the hash if the patch file content differs
- **Precaution**: Add `*.patch text eol=lf` to `.gitattributes` to standardize patch file line endings
- The lockfile mismatch error compares configuration hashes, not file content directly

### 4. pnpm 10.x Migration Issues with patchedDependencies Format

**Confirmed migration issues**:

| Aspect | pnpm 9 | pnpm 10 |
|--------|--------|---------|
| Lockfile Format | Patch paths referenced directly; no hashing | Hash-based storage of patchedDependencies config |
| Compatibility | pnpm 10 fails on pnpm 9 lockfiles with patches | Requires lockfile regeneration |
| Breaking Changes | N/A | Hashing update around v10.6.0+ |

- pnpm 10 lockfiles with `patchedDependencies` are **not backward compatible** with pnpm 9
- Even within pnpm 10.x, hashing changes between minor versions can cause mismatches
- The `overrides` field has the same issue (fixed in pnpm/pnpm#9546, May 2025)

### 5. legacy-peer-deps=true in .npmrc

**Does NOT contribute to this error**. Research confirms:

- `legacy-peer-deps` is an **npm-only setting** that pnpm ignores entirely
- pnpm uses `autoInstallPeers` instead (default: `true` since pnpm 8)
- Having `legacy-peer-deps=true` in `.npmrc` is harmless but also useless for pnpm
- The lockfile stores `autoInstallPeers` in its `settings` section; this must match between local and CI
- **However**: If you have `auto-install-peers=false` in a user-level `.npmrc` locally but not on Vercel, that could cause a *different* `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` for `autoInstallPeers`

### 6. Workarounds That Have Worked

#### Solution A: Regenerate Lockfile (Recommended)
```bash
pnpm install   # regenerates lockfile with current pnpm version hashes
git add pnpm-lock.yaml
git commit -m "fix(deps): regenerate lockfile for pnpm 10.x compatibility"
git push
```

#### Solution B: Pin Exact pnpm Version on Vercel
Ensure `packageManager` in `package.json` matches exactly:
```json
{
  "packageManager": "pnpm@10.14.0"
}
```
Then enable Corepack on Vercel:
- Set environment variable: `ENABLE_EXPERIMENTAL_COREPACK=1`
- Or use custom install command: `corepack use pnpm@$(pnpm -v) && pnpm i --frozen-lockfile`

#### Solution C: Override Vercel Install Command (Quick Fix)
In Vercel project settings or vercel.json:
```json
{
  "installCommand": "pnpm install --no-frozen-lockfile"
}
```
**Tradeoff**: Loses reproducibility guarantee of frozen lockfile.

#### Solution D: Delete and Regenerate Lockfile (Nuclear Option)
```bash
# Delete pnpm-lock.yaml, then:
pnpm install
# Verify it works:
pnpm install --frozen-lockfile
git add pnpm-lock.yaml
git commit -m "fix(deps): regenerate lockfile from scratch"
```

#### Solution E: Fix Lockfile
```bash
pnpm install --fix-lockfile
git add pnpm-lock.yaml
git commit -m "fix(deps): fix lockfile entries"
```

## Project-Specific Analysis

For this project (2025slideheroes):

**Current state**:
- `packageManager`: `pnpm@10.14.0` (pinned)
- Lockfile: version `9.0` with `autoInstallPeers: true`
- Patched: `payload@3.75.0` with hash `bc647ee89ca63bbf845c933d69096f88954779a83702d6a06275cdb4afe41ce8`
- `.npmrc`: has `legacy-peer-deps=true` (npm-only, ignored by pnpm)

**Most likely cause**: Vercel is using a different pnpm version than 10.14.0, causing the patchedDependencies hash to be recomputed differently. Since `packageManager` is set to `pnpm@10.14.0`, Vercel should use this exact version IF Corepack is enabled.

**Recommended fix order**:
1. Verify Vercel build logs for the actual pnpm version being used
2. Ensure `ENABLE_EXPERIMENTAL_COREPACK=1` is set on Vercel
3. Regenerate lockfile locally with the exact same pnpm version
4. If issue persists, try `pnpm install --fix-lockfile` and commit

## Sources and Citations

- https://github.com/pnpm/pnpm/issues/9608 - ERR_PNPM_OUTDATED_LOCKFILE with patchedDependencies (pnpm 10.11)
- https://github.com/pnpm/pnpm/issues/9283 - ERR_PNPM_LOCKFILE_CONFIG_MISMATCH with overrides (pnpm 10.6.3)
- https://github.com/pnpm/pnpm/issues/6649 - Lockfile config mismatch after version upgrade
- https://github.com/pnpm/pnpm/issues/6312 - Frozen lockfile error despite up to date lockfile
- https://github.com/vercel/vercel/issues/8272 - ERR_PNPM_OUTDATED_LOCKFILE on Vercel
- https://community.vercel.com/t/vercel-deploy-error-due-to-pnpm-10-4/6169 - Vercel deploy error pnpm 10.4
- https://community.vercel.com/t/deploy-fails-with-err-pnpm-outdated-lockfile/23910 - Deploy fails ERR_PNPM_OUTDATED_LOCKFILE
- https://pnpm.io/errors - pnpm Error Codes
- https://pnpm.io/settings - pnpm Settings
- https://github.com/pnpm/pnpm/issues/6048 - pnpm patch with workspaces
- https://github.com/apptension/saas-boilerplate/issues/629 - SaaS boilerplate patchedDependencies mismatch

## Key Takeaways

- This is a confirmed pnpm 10 breaking change in how patchedDependencies hashes are computed
- The error occurs when the pnpm version generating the lockfile differs from the one reading it
- Vercel version mismatch is the most common trigger - ensure Corepack is enabled and packageManager is pinned
- legacy-peer-deps=true in .npmrc is irrelevant (npm-only setting, ignored by pnpm)
- Line endings are not a direct cause, but standardizing .patch files via .gitattributes is good practice
- The recommended fix is to regenerate the lockfile with the exact pnpm version that CI will use

## Related Searches

- Monitor pnpm/pnpm#10258 for Netlify-specific issues with pnpm 10.24.0+
- Check if pnpm has stabilized hashing in newer 10.x releases
- Research whether pnpm deploy --legacy flag helps for monorepo deploy scenarios
