# Exa Research: pnpm Preinstall Hook Failures on Vercel Deployments

**Date**: 2026-01-14
**Agent**: exa-expert
**Search Types Used**: Neural, Keyword, Answer, Get Contents

## Query Summary

Researched solutions for pnpm monorepo deployments where preinstall scripts that use workspace features (like `--filter`) fail on Vercel because the workspace is not set up during the install phase.

## Top Results

| Title | URL | Relevance |
|-------|-----|-----------|
| WORKSPACE_MISSING_PACKAGE_JSON | https://vercel.com/docs/conformance/rules/WORKSPACE_MISSING_PACKAGE_JSON | High |
| Package Managers | https://vercel.com/docs/package-managers | High |
| pnpm install --filter behavior | https://github.com/pnpm/pnpm/issues/7387 | High |
| Vercel pnpm monorepo deployment | https://stackoverflow.com/questions/78976444 | High |
| pnpm install scripts issue | https://github.com/pnpm/pnpm/issues/6289 | Medium |
| Turborepo workspace issues | https://github.com/vercel/turborepo/issues/10944 | Medium |
| pnpm install infinite loop | https://github.com/pnpm/pnpm/issues/5901 | Medium |

## Key Findings

### Root Cause

The `preinstall` hook runs **before** pnpm has materialized the workspace on Vercel. Any scripts that use `pnpm --filter`, `pnpm run --filter`, or other workspace-dependent commands will fail because:

1. The workspace is not yet set up during the install phase
2. Dependencies are not installed when preinstall runs
3. Workspace packages cannot be resolved

### Solution 1: Move Logic Out of preinstall

**Remove workspace-filter logic from `preinstall`** and move it to:
- `prepare` hook (runs after install)
- `postinstall` hook (runs after install)
- A custom build script

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "postinstall": "pnpm --filter @your/app run setup"
  }
}
```

### Solution 2: Custom Vercel Install Command

Set a custom install command in Vercel dashboard or `vercel.json` that installs the target workspace first:

```bash
pnpm install --filter <your-app> --ignore-workspace-root-check && pnpm install
```

This forces pnpm to set up the workspace for the selected package before other scripts execute.

### Solution 3: vercel.json Configuration

```json
{
  "installCommand": "pnpm install",
  "buildCommand": "pnpm --filter @your/app build"
}
```

### Solution 4: Conditional Script Execution

Make preinstall scripts workspace-safe by checking if the workspace exists:

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm || true"
  }
}
```

Or use environment detection:

```json
{
  "scripts": {
    "preinstall": "[ -z \"$VERCEL\" ] || npx only-allow pnpm"
  }
}
```

### Solution 5: Remove Workspace-Dependent preinstall

If your preinstall script uses `pnpm run --filter` or similar, remove it entirely from root package.json and handle it in the build phase:

**Before (broken):**
```json
{
  "preinstall": "pnpm run --filter @your/package some-script"
}
```

**After (working):**
```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "build": "pnpm run --filter @your/package some-script && turbo build"
  }
}
```

## Common Errors and Solutions

### Error: "pnpm install exited with 1"
- **Cause**: preinstall hook using workspace commands
- **Fix**: Move workspace-dependent commands to postinstall or build scripts

### Error: "No projects matched the filters"
- **Cause**: Workspace not set up when filter runs
- **Fix**: Remove --filter from preinstall, use in postinstall/build

### Error: "WORKSPACE_MISSING_PACKAGE_JSON"
- **Cause**: Directory matches workspace glob but lacks package.json
- **Fix**: Add package.json, move directory, or exclude from workspace config

### Error: "Cannot find module"
- **Cause**: Standalone output missing workspace dependencies
- **Fix**: Ensure proper dependency hoisting or use bundled approach

## Vercel-Specific Considerations

1. **Lock file detection**: Vercel auto-detects pnpm from `pnpm-lock.yaml`
2. **Supported versions**: pnpm 6, 7, 8, 9, 10
3. **Corepack support**: If using Corepack, Vercel uses packageManager field
4. **Install command**: Default is `pnpm install` with `--frozen-lockfile` in CI

## Best Practices for pnpm + Vercel Monorepos

1. Keep `preinstall` minimal (only `npx only-allow pnpm`)
2. Use `postinstall` for workspace-dependent setup
3. Configure proper workspace globs in `pnpm-workspace.yaml`
4. Ensure all workspace directories have `package.json`
5. Use `vercel.json` to specify build commands with proper filters
6. Test deployments with `vercel build` locally before pushing

## Sources

1. [Vercel - WORKSPACE_MISSING_PACKAGE_JSON](https://vercel.com/docs/conformance/rules/WORKSPACE_MISSING_PACKAGE_JSON)
2. [Vercel - Package Managers](https://vercel.com/docs/package-managers)
3. [pnpm/pnpm#7387 - Change behavior of pnpm install --filter](https://github.com/pnpm/pnpm/issues/7387)
4. [pnpm/pnpm#6289 - Install scripts not executed from store](https://github.com/pnpm/pnpm/issues/6289)
5. [pnpm/pnpm#5901 - Infinite loop in postinstall](https://github.com/pnpm/pnpm/issues/5901)
6. [Stack Overflow - Next.js + pnpm + monorepo deployment](https://stackoverflow.com/questions/78976444)
7. [Vercel Community - Issue with pnpm v10](https://community.vercel.com/t/issue-with-pnpm-v10/27586)
8. [pnpm.io - Workspaces](https://pnpm.io/workspaces)

## Related Resources

- [Turborepo + Vercel + Prisma deployment issues](https://github.com/vercel/turborepo/discussions/1059)
- [pnpm fetch in CI](https://github.com/pnpm/pnpm/issues/6615)
- [Vercel build uses npm despite pnpm workspace](https://community.vercel.com/t/vercel-build-uses-npm-despite-pnpm-workspace-corepack-ui-overrides/21091)
