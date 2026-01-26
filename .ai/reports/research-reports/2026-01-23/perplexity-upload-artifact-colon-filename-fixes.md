# Perplexity Research: Upload-Artifact Colon Filename Fixes

**Date**: 2026-01-23
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched solutions for `actions/upload-artifact` failing when uploading files containing colons (`:`) in filenames, specifically from Next.js/Turbopack builds that produce files like `node:child_process`. Focus on production-ready solutions for 2025-2026.

## Key Findings

### 1. Official GitHub Actions Position

**Colons are permanently restricted** in GitHub Actions artifact names and filenames. This restriction is:
- By design and not planned to change
- Due to NTFS file system compatibility requirements
- Applies to: `"`, `:`, `<`, `>`, `|`, `*`, `?`, `\r`, `\n`, `\`, `/`

From GitHub maintainer (Issue #22):
> "This restriction on artifact names is by design and we don't plan on adding support for anything like escaping. The reason for this restriction is because we have to be file-system agnostic."

### 2. Production-Ready Solutions

#### Solution A: Pre-Upload Filename Sanitization (Recommended)

Add a step before `upload-artifact` to rename files with colons:

```yaml
- name: Sanitize filenames with colons
  run: |
    # Find and rename files with colons, replacing with dashes
    find . -type f -name '*:*' | while read file; do
      newfile="${file//:/-}"
      # Create directory structure if needed
      mkdir -p "$(dirname "$newfile")"
      mv "$file" "$newfile"
    done

- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-artifacts
    path: ./dist
```

**For Next.js `.next` directory specifically:**
```yaml
- name: Sanitize Next.js build filenames
  run: |
    find .next -type f -name '*:*' 2>/dev/null | while IFS= read -r file; do
      newfile="${file//:/__}"  # Using double underscore for clarity
      mv "$file" "$newfile"
    done || true
```

#### Solution B: Tar Archive Approach (Most Robust)

Tar archives preserve original filenames including special characters:

```yaml
- name: Archive Next.js build
  run: tar -cvf nextjs-build.tar .next/

- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: nextjs-build
    path: nextjs-build.tar
    compression-level: 6

# In download job:
- name: Download artifact
  uses: actions/download-artifact@v4
  with:
    name: nextjs-build

- name: Extract archive
  run: tar -xvf nextjs-build.tar
```

**Benefits:**
- Preserves all special characters
- Maintains UNIX file permissions
- Avoids URL encoding issues
- Single file upload is faster for many small files

#### Solution C: Exclude Problematic Files

If the colon-containing files are not needed in the artifact:

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: |
      .next/**
      !.next/trace
      !.next/cache/**/*:*
```

### 3. Next.js/Turbopack Configuration Options

#### Where Colon Files Come From

Next.js/Turbopack may generate trace files or cache entries with `node:` protocol references in filenames, especially in:
- `.next/trace` files
- `.next/cache/webpack/` or `.next/cache/turbopack/`
- Build diagnostic files

#### Configuration to Reduce Colon Files

**Use `actions/cache` instead of `upload-artifact` for build cache:**

```yaml
- name: Cache Next.js build
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
```

**Note:** `actions/cache` uses different upload mechanisms and may handle these files differently than `upload-artifact`.

### 4. Upload-Artifact v4/v6 Notes

The restriction applies to **all versions** of upload-artifact (v3, v4, v6). No version has added special character support because:
- It's a fundamental file system compatibility issue
- Supporting escaping would create inconsistent behavior across OS runners
- The restriction is enforced at the API level

### 5. Alternative Approaches

#### Use GitHub's Cache Action for Build Artifacts
For build caches specifically, `actions/cache` may work better:
```yaml
- uses: actions/cache@v4
  with:
    path: .next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/pnpm-lock.yaml') }}
```

#### Store Only Necessary Build Outputs
Instead of uploading entire `.next` directory, upload only what's needed:
```yaml
- name: Upload production build
  uses: actions/upload-artifact@v4
  with:
    name: production-build
    path: |
      .next/standalone/
      .next/static/
      public/
```

## Complete Workflow Example

```yaml
name: Build and Upload
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      
      - run: pnpm build
      
      # Option 1: Sanitize filenames
      - name: Sanitize build output filenames
        run: |
          find .next -type f -name '*:*' 2>/dev/null | while IFS= read -r file; do
            newfile="${file//:/__}"
            mv "$file" "$newfile"
          done || true
      
      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: .next/
          
      # Option 2: Tar approach (alternative to Option 1)
      # - name: Archive build
      #   run: tar -cvf build.tar .next/
      # - name: Upload archive
      #   uses: actions/upload-artifact@v4
      #   with:
      #     name: nextjs-build-tar
      #     path: build.tar
```

## Sources & Citations

- https://github.com/actions/upload-artifact/issues/22 - Name Restrictions (Official GitHub response)
- https://github.com/actions/upload-artifact/issues/333 - Invalid characters documentation request
- https://github.com/actions/upload-artifact/issues/647 - Feature request for slash support
- https://github.com/actions/upload-artifact - Official documentation
- https://nextjs.org/docs/app/guides/ci-build-caching - Next.js CI caching guide
- https://github.com/actions/cache - GitHub Actions Cache

## Key Takeaways

1. **Colons will never be supported** in upload-artifact filenames - this is by design
2. **Tar archiving is the most robust solution** - preserves all filenames exactly
3. **Filename sanitization works** if you don't need the exact original names
4. **Consider using `actions/cache`** instead for build caches
5. **Exclude trace/diagnostic files** if they're not needed in the artifact
6. **No Turbopack config** can prevent `node:` protocol references in internal files

## Related Searches

- Turbopack output configuration for CI environments
- GitHub Actions artifact alternatives (e.g., S3, GCS)
- Next.js standalone build artifact best practices
