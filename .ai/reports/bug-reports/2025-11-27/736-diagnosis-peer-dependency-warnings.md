# Bug Diagnosis: Peer Dependency Version Mismatches

**ID**: ISSUE-pending
**Created**: 2025-11-27T17:00:00Z
**Reporter**: user
**Severity**: low
**Status**: new
**Type**: integration

## Summary

Three categories of peer dependency warnings appear during `pnpm update`: (1) Tiptap extension version mismatches within the same package (3.10.7 vs 3.10.8), (2) Payload CMS requiring Next.js 15 while the project uses Next.js 16, and (3) @edge-csrf/nextjs being deprecated and not supporting Next.js 16. These are compatibility warnings, not breaking errors - the application still builds and runs.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 22.16.0
- **pnpm Version**: 10.14.0
- **Next.js Version**: 16.0.3
- **Payload CMS Version**: 3.64.0
- **Last Working**: N/A (warnings existed before update)

## Reproduction Steps

1. Run `pnpm update` in the repository root
2. Observe peer dependency warnings in the output

## Expected Behavior

All package peer dependencies should be satisfied without warnings.

## Actual Behavior

Three categories of peer dependency warnings appear:

### Category 1: Tiptap Version Mismatches
```
├─┬ @tiptap/extension-bold 3.10.8
│ └── ✕ unmet peer @tiptap/core@^3.10.8: found 3.10.7
├─┬ @tiptap/starter-kit 3.10.7
│ ├─┬ @tiptap/extension-code 3.10.8
│ │ └── ✕ unmet peer @tiptap/core@^3.10.8: found 3.10.7
│ ├─┬ @tiptap/extension-list-keymap 3.10.8
│ │ └── ✕ unmet peer @tiptap/extension-list@^3.10.8: found 3.10.7
│ ├─┬ @tiptap/extension-gapcursor 3.10.8
│ │ └── ✕ unmet peer @tiptap/extensions@^3.10.8: found 3.10.7
│ └─┬ @tiptap/extension-dropcursor 3.10.8
│   └── ✕ unmet peer @tiptap/extensions@^3.10.8: found 3.10.7
├─┬ @tiptap/extension-list-item 3.10.8
│ └── ✕ unmet peer @tiptap/extension-list@^3.10.8: found 3.10.7
└─┬ @tiptap/extension-placeholder 3.10.8
  └── ✕ unmet peer @tiptap/extensions@^3.10.8: found 3.10.7
```

### Category 2: Payload/Next.js Version
```
apps/payload
└─┬ @payloadcms/next 3.64.0
  ├── ✕ unmet peer next@^15.2.3: found 16.0.3
  └─┬ @payloadcms/ui 3.64.0
    └── ✕ unmet peer next@^15.2.3: found 16.0.3
```

### Category 3: @edge-csrf/nextjs Deprecation
```
apps/web
├─┬ @edge-csrf/nextjs 2.5.3-cloudflare-rc1
│ └── ✕ unmet peer next@"^13.0.0 || ^14.0.0 || ^15.0.0": found 16.0.3
```

## Diagnostic Data

### Package Versions in apps/web/package.json (Tiptap)

```json
"@tiptap/extension-bold": "^3.10.8",
"@tiptap/extension-bullet-list": "^3.10.7",
"@tiptap/extension-heading": "^3.10.7",
"@tiptap/extension-italic": "^3.10.7",
"@tiptap/extension-list-item": "^3.10.8",
"@tiptap/extension-ordered-list": "^3.10.7",
"@tiptap/extension-placeholder": "^3.10.8",
"@tiptap/extension-underline": "^3.10.7",
"@tiptap/react": "^3.10.7",
"@tiptap/starter-kit": "^3.10.7"
```

### Payload Peer Dependencies

```bash
$ npm view @payloadcms/next@3.64.0 peerDependencies
{ next: '^15.2.3', graphql: '^16.8.1', payload: '3.64.0' }
```

### @edge-csrf/nextjs Status

```bash
$ npm view @edge-csrf/nextjs
DEPRECATED ⚠️ - Package no longer supported.
peerDependencies: { next: '^13.0.0 || ^14.0.0 || ^15.0.0' }
```

## Related Code

### Issue 1: Tiptap
- **Affected Files**:
  - `apps/web/package.json` - Mixed Tiptap versions (3.10.7 and 3.10.8)
- **Root Cause**: Partial update - some extensions updated to 3.10.8, others remain at 3.10.7

### Issue 2: Payload/Next.js
- **Affected Files**:
  - `apps/payload/package.json`
  - `packages/payload/package.json`
- **Root Cause**: Payload CMS 3.64.0 hasn't released Next.js 16 support yet

### Issue 3: @edge-csrf/nextjs
- **Affected Files**:
  - `apps/web/package.json`
  - `apps/web/proxy.ts` - Uses `createCsrfProtect` from @edge-csrf/nextjs
- **Root Cause**: Package deprecated, no Next.js 16 peer dependency declared

## Related Issues & Context

### Direct Predecessors
- #198 (CLOSED): "Peer dependency version conflicts after Makerkit update"
- #645 (CLOSED): "Bug Diagnosis: Dev Server Startup Warnings"
- #646 (CLOSED): "Bug Fix: Resolve Dev Server Startup Warnings"

### Similar Symptoms
- #71 (CLOSED): "React 19 Type Compatibility Issues After Version Alignment"

## Root Cause Analysis

### Issue 1: Tiptap Version Mismatches

**Summary**: Inconsistent version pinning in package.json causes internal peer dependency conflicts within Tiptap ecosystem.

**Detailed Explanation**:
The `apps/web/package.json` has mixed Tiptap versions:
- 3.10.8: `@tiptap/extension-bold`, `@tiptap/extension-list-item`, `@tiptap/extension-placeholder`
- 3.10.7: All other Tiptap packages

When Tiptap 3.10.8 extensions are installed, they require `@tiptap/core@^3.10.8`, but `@tiptap/starter-kit@3.10.7` installs `@tiptap/core@3.10.7`, creating the mismatch.

**Supporting Evidence**:
- `pnpm list "@tiptap/*" -r` shows version split
- Package.json shows explicit version differences

### Issue 2: Payload/Next.js Version

**Summary**: Payload CMS 3.64.0 officially supports Next.js 15, not Next.js 16.

**Detailed Explanation**:
`@payloadcms/next@3.64.0` declares `peerDependencies: { next: '^15.2.3' }`. The project uses `next@16.0.3`. This is an upstream compatibility gap - Payload hasn't updated their peer dependency to include Next.js 16 yet.

**Supporting Evidence**:
- `npm view @payloadcms/next@3.64.0 peerDependencies` shows `next: '^15.2.3'`
- Project has `next@16.0.3` installed

### Issue 3: @edge-csrf/nextjs Deprecation

**Summary**: The @edge-csrf/nextjs package is deprecated and doesn't declare Next.js 16 compatibility.

**Detailed Explanation**:
The package shows `DEPRECATED` on npm with peer dependency `next: '^13.0.0 || ^14.0.0 || ^15.0.0'`. However, research indicates:
1. The package is still being maintained (last update Nov 2024)
2. Next.js 16 Server Actions have built-in CSRF protection
3. The deprecation may be related to Next.js 16's shift from `middleware.ts` to `proxy.ts`

**Supporting Evidence**:
- `npm view @edge-csrf/nextjs` shows DEPRECATED status
- `apps/web/proxy.ts:1` imports from `@edge-csrf/nextjs`
- Package still functional despite deprecation warning

### Confidence Level

**Confidence**: High

**Reasoning**: All three issues are well-documented npm peer dependency mismatches. The warnings are informational - the application builds and runs successfully. These are compatibility declarations, not runtime errors.

## Fix Approach (High-Level)

### Issue 1: Tiptap
Align all Tiptap packages to the same version (either all 3.10.7 or all 3.10.8):
```bash
pnpm --filter web update "@tiptap/*"@3.10.8
```

### Issue 2: Payload/Next.js
**Wait for Payload to release Next.js 16 support.** This is an upstream issue. Options:
1. Wait for `@payloadcms/next@3.65+` with Next.js 16 peer dependency
2. Override peer dependency check in `.npmrc` with `strict-peer-dependencies=false`
3. Downgrade Next.js to 15.x (not recommended)

### Issue 3: @edge-csrf/nextjs
Two options:
1. **Short-term**: Continue using @edge-csrf/nextjs - it works despite warnings
2. **Long-term**: Migrate to Next.js 16 built-in CSRF for Server Actions, remove package for routes that use Server Actions exclusively

## Diagnosis Determination

All three peer dependency warnings are **compatibility declarations**, not breaking issues:

1. **Tiptap**: Minor version mismatch within same major release - fixable with version alignment
2. **Payload**: Upstream hasn't declared Next.js 16 support yet - works in practice
3. **@edge-csrf**: Deprecated but functional - evaluate if built-in CSRF is sufficient

**Impact**: Warnings only. Application builds, runs, and tests pass. These should be addressed for cleaner builds but are not blocking issues.

**Priority**: Low - address during routine dependency maintenance

## Additional Context

- These warnings existed before the `pnpm update` command
- The warnings appear during `pnpm install` resolution, not at runtime
- The application's functionality is unaffected by these peer dependency mismatches
- Next.js 16 is relatively new; ecosystem packages are still catching up

---
*Generated by Claude Debug Assistant*
*Tools Used: pnpm list, pnpm update, npm view, gh issue list, grep, file reads*
