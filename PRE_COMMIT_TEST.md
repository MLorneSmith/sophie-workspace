# Pre-Commit Hook Test Guide

This document explains how to test the hybrid pre-commit hook.

## Test Scenarios

### Test 1: Main App Files (Should use Biome)

```bash
# Create test files in main app
echo "const test = 'main app';" > apps/web/test-main.js
echo "export const component = () => <div>test</div>;" > apps/web/test-main.tsx
git add apps/web/test-main.*
git commit -m "test: main app files"
# Expected: 🎨 Formatting and linting files with Biome...
```

### Test 2: Payload CMS Files (Should use ESLint)

```bash
# Create test files in Payload
echo "const payload = 'test';" > apps/payload/test-payload.js
git add apps/payload/test-payload.js
git commit -m "test: payload files"
# Expected: 🔧 Linting Payload CMS files with ESLint...
```

### Test 3: Package Files (Should use ESLint selectively)

```bash
# Create test file in package
echo "export const pkg = 'test';" > packages/ui/test-pkg.ts
git add packages/ui/test-pkg.ts
git commit -m "test: package files"
# Expected: 📦 Linting package files with ESLint...
```

### Test 4: Markdown Files (Should use Prettier)

```bash
# Create test markdown
echo "# Test Header\n\nSome content" > TEST.md
git add TEST.md
git commit -m "test: markdown files"
# Expected: 📝 Formatting markdown files with Prettier...
```

### Test 5: Mixed Files (Should use appropriate linter per file)

```bash
# Create mixed files
echo "const main = 'test';" > apps/web/mixed-main.js
echo "const payload = 'test';" > apps/payload/mixed-payload.js
echo "# Mixed Test" > MIXED.md
git add apps/web/mixed-main.js apps/payload/mixed-payload.js MIXED.md
git commit -m "test: mixed file types"
# Expected: All three linters should run
```

## Pre-Commit Output

The hook should show clear messages for each linter used:

- 🎨 **Biome**: Main app and root files
- 🔧 **ESLint**: Payload CMS files
- 📦 **ESLint**: Package files (selective)
- 📝 **Prettier**: Markdown files
- 🔍 **TypeScript**: Typecheck for .ts/.tsx files
- 📥 **Re-staging**: Modified files after formatting

## Cleanup

After testing, clean up test files:

```bash
git reset --soft HEAD~5  # Reset last 5 test commits
git reset HEAD .         # Unstage all files
rm -f apps/web/test-* apps/payload/test-* packages/*/test-* TEST.md MIXED.md
```
