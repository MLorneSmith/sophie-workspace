# Bug Diagnosis: ESLint and Biome Coexistence - Redundant Tooling

**ID**: ISSUE-808
**Created**: 2025-12-01T00:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: chore

## Summary

The project uses Biome as the primary linting and formatting tool at the root level, but ESLint remains installed and configured in 36+ packages with individual `"lint": "eslint ."` scripts. This creates redundant tooling, increases maintenance burden, and causes confusion about which linter is authoritative.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: >=18.18.0
- **Biome Version**: 2.3.6
- **ESLint Version**: ^9.39.1
- **Package Manager**: pnpm 10.14.0

## Current State Analysis

### Root-Level Configuration (Biome)

The root `package.json` uses Biome exclusively:
```json
"lint": "biome lint . && manypkg check && pnpm lint:yaml && pnpm lint:md",
"lint:fix": "biome lint --write . && manypkg fix && pnpm lint:md:fix",
"format": "biome format .",
"format:fix": "biome format --write ."
```

### Package-Level Configuration (ESLint)

36 packages still have ESLint configured with `"lint": "eslint ."`, including:
- `apps/web`
- All `packages/features/*`
- All `packages/billing/*`
- All `packages/cms/*`
- All `packages/mailers/*`
- All `packages/monitoring/*`
- And more...

### Only 2 Packages Use Biome Directly

- `apps/payload` - `"lint": "biome lint . --write"`
- Root `package.json` - `"lint": "biome lint ."`

## Diagnostic Data

### ESLint Config Package

Location: `tooling/eslint/`

The project maintains an entire ESLint config package (`@kit/eslint-config`) with:
- `base.js` - ESLint recommended + Turbo + Next.js rules
- `nextjs.js` - Next.js core web vitals + TypeScript configs
- Dependencies: `eslint-config-next`, `eslint-config-turbo`, `typescript-eslint`, `@next/eslint-plugin-next`

### ESLint Rules Being Used

From `tooling/eslint/base.js`:
```javascript
// Key ESLint rules configured:
- @typescript-eslint/no-unused-vars (with _ ignore pattern)
- no-restricted-imports (restricts react-i18next Trans import)
- Various @next/next rules
- turbo/no-undeclared-env-vars (disabled)
```

### Biome Coverage

From `biome.json`, Biome handles:
- Linting with 390+ rules
- Formatting with tab indentation
- React/JSX support
- TypeScript support
- Next.js-specific rules (partial support)

**Biome supports these @next/eslint-plugin-next rules:**
| ESLint Rule | Biome Equivalent |
|-------------|------------------|
| `google-font-display` | `useGoogleFontDisplay` |
| `no-document-import-in-page` | `noDocumentImportInPage` |
| `no-head-element` | `noHeadElement` |
| `no-head-import-in-document` | `noHeadImportInDocument` |
| `no-img-element` | `noImgElement` |

**Biome supports react-hooks rules:**
| ESLint Rule | Biome Equivalent |
|-------------|------------------|
| `exhaustive-deps` | `useExhaustiveDependencies` |
| `rules-of-hooks` | `useHookAtTopLevel` |

### lint-staged Configuration

From root `package.json`, lint-staged runs:
1. TruffleHog for secrets
2. `pnpm lint` for `apps/payload`
3. Package-specific `pnpm lint --fix` for `packages/**`
4. `biome format --write` and `biome lint --write` for other files

This means **both ESLint AND Biome are being invoked** during pre-commit hooks.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The project was migrated to Biome but the migration was incomplete - individual packages were not updated to use Biome, leaving ESLint as a remnant.

**Detailed Explanation**:

1. **Historical Migration**: Git history shows commit `f5a961f15` "Clean up packages and old references to eslint config" from Feb 2025, indicating a partial cleanup occurred
2. **Incomplete Transition**: Root-level scripts were updated to use Biome, but 36+ packages retained their ESLint `"lint": "eslint ."` scripts
3. **Template Generator**: The Turbo generator template at `turbo/generators/templates/package/eslint.config.mjs.hbs` still creates ESLint configs for new packages
4. **Makerkit Origin**: The project is based on Makerkit template which originally used ESLint; the migration to Biome was not fully propagated to all packages

**Supporting Evidence**:
- Root `package.json:24` uses `biome lint .`
- 36 packages still have `"lint": "eslint ."`
- `tooling/eslint/` package still exists with full configuration
- Both tools are invoked in lint-staged hooks

### How This Causes the Observed Behavior

1. Developer runs `pnpm lint` at root → Biome runs
2. Developer runs `pnpm --filter @kit/ui lint` → ESLint runs
3. Pre-commit hooks may run both tools on different file sets
4. Two different lint rule sets may catch or miss different issues
5. Developers may be confused about which linter is authoritative

### Confidence Level

**Confidence**: High

**Reasoning**: The evidence clearly shows two linting systems operating independently. The root uses Biome while packages use ESLint. This is definitively redundant tooling, not an intentional hybrid setup.

## Can ESLint Be Removed?

### YES - ESLint can be removed with some considerations:

**Rules Biome Covers Well:**
- Most TypeScript rules
- React hooks rules
- General code quality rules
- Import organization

**Rules Biome Has Partial/No Support For:**
- Some Next.js-specific rules (only 5 of ~20 rules supported)
- Custom `no-restricted-imports` configuration
- Turbo workspace rules

### Recommendation: Remove ESLint

**Rationale:**
1. **Biome is already the primary linter** at root level
2. **Next.js 15.5 officially supports Biome** as an alternative to ESLint
3. **Most ESLint rules have Biome equivalents**
4. **Performance**: Biome is 10-100x faster than ESLint
5. **Simplicity**: Single tool for linting and formatting

**What would be lost:**
1. `no-restricted-imports` rule preventing `react-i18next` `Trans` import
   - Mitigation: Add equivalent to Biome config or enforce via code review
2. Some Next.js-specific rules not in Biome
   - Mitigation: Most critical ones are supported; others are nice-to-have
3. `eslint-config-turbo` rules
   - Mitigation: Biome handles most modern monorepo concerns

## Fix Approach (High-Level)

1. **Update all package `lint` scripts** to use `biome lint .` instead of `eslint .`
2. **Remove ESLint dependencies** from all packages
3. **Delete `tooling/eslint/` package**
4. **Update Turbo generator template** to use Biome instead of ESLint
5. **Update lint-staged config** to remove package-specific ESLint calls
6. **Add `no-restricted-imports` equivalent** to biome.json if needed
7. **Remove `eslint-plugin-react-hooks`** from root devDependencies

## Affected Files

### Packages with ESLint lint scripts (36 total):
- `apps/web/package.json`
- `packages/features/*/package.json`
- `packages/billing/*/package.json`
- `packages/cms/*/package.json`
- `packages/mailers/*/package.json`
- `packages/monitoring/*/package.json`
- And 20+ more packages

### Files to remove:
- `tooling/eslint/` (entire directory)
- `packages/*/eslint.config.mjs` (2 files: `packages/mcp-server/`, `packages/policies/`)
- `turbo/generators/templates/package/eslint.config.mjs.hbs`

### Files to update:
- Root `package.json` (remove `eslint-plugin-react-hooks`)
- All 36 package `package.json` files (change lint script)
- lint-staged configuration in root `package.json`

## Related Issues & Context

### Historical Context

This appears to be technical debt from the initial Makerkit template setup. The project has incrementally adopted Biome but never completed the full migration.

## Diagnosis Determination

ESLint is **NOT needed** and **can be safely removed**. The project has already adopted Biome as its primary linting tool, and the remaining ESLint configuration is redundant legacy from an incomplete migration.

The recommended action is to complete the migration by:
1. Removing all ESLint configurations
2. Updating all package lint scripts to use Biome
3. Consolidating on Biome as the single linting/formatting tool

## Additional Context

### Sources

- [Next.js 15.5 officially supports Biome](https://nextjs.org/blog/next-15-5)
- [Biome vs ESLint 2025 Comparison](https://medium.com/@harryespant/biome-vs-eslint-the-ultimate-2025-showdown-for-javascript-developers-speed-features-and-3e5130be4a3c)
- [Biome Linter Rules Sources](https://biomejs.dev/linter/rules-sources/)
- [Next.js Biome Migration Guide](https://www.tsepakme.com/blog/nextjs-biome-migration)

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, Bash, WebSearch, WebFetch*
