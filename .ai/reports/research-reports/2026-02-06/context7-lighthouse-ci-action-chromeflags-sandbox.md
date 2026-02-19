# Context7 Research: Lighthouse CI Action chromeFlags and --no-sandbox

**Date**: 2026-02-06
**Agent**: context7-expert
**Libraries Researched**: treosh/lighthouse-ci-action, googlechrome/lighthouse-ci, googlechrome/lighthouse

## Query Summary
Researched how `treosh/lighthouse-ci-action@v12` handles `chromeFlags` from `lighthouserc.json` via `configPath`, specifically why `--no-sandbox` is not being passed to Chrome causing "FATAL:sandbox/linux/services/credentials.cc:131] Check failed: Permission denied" errors on self-hosted/CI runners.

## Root Cause: chromeFlags Placement in lighthouserc.json

The project's `lighthouserc.json` has `chromeFlags` at the WRONG nesting level:

```json
{
  "ci": {
    "collect": {
      "chromeFlags": "--no-sandbox --disable-gpu",   // <-- WRONG: collect-level
      "settings": {
        "preset": "desktop"
      }
    }
  }
}
```

The LHCI documentation from `googlechrome/lighthouse-ci` clearly shows `chromeFlags` must be INSIDE the `settings` object:

```json
{
  "ci": {
    "collect": {
      "settings": {
        "chromeFlags": "--no-sandbox --disable-gpu"   // <-- CORRECT: settings-level
      }
    }
  }
}
```

### Evidence from Official Documentation

**From googlechrome/lighthouse-ci configuration.md:**
> `settings`: The Lighthouse CLI flags to pass along to Lighthouse. This can be used to change configuration of Lighthouse itself.

The `settings` object maps directly to Lighthouse CLI flags. `chromeFlags` is a Lighthouse CLI flag, so it must go inside `settings`.

**From googlechrome/lighthouse-ci getting-started.md (Google Cloud Build example):**
```javascript
module.exports = {
  ci: {
    collect: {
      settings: {chromeFlags: '--no-sandbox'},
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

**From treosh/lighthouse-ci-action README.md:**
```json
{ "ci": { "collect": { "numberOfRuns": 1, "settings": { "chromeFlags": "--disable-gpu --no-sandbox --no-zygote" } } } }
```

**From googlechrome/lighthouse-ci configuration.md (explicit chromeFlags example):**
```jsonc
{
  "ci": {
    "collect": {
      "settings": {
        "chromeFlags": "--disable-gpu --no-sandbox"
      }
    }
  }
}
```

Every single example from all three repositories places `chromeFlags` inside `ci.collect.settings`, never at `ci.collect` level.

## Findings

### 1. How configPath Works with chromeFlags

The `configPath` action input tells `treosh/lighthouse-ci-action` to load configuration from the specified JSON/JS/YAML file. The action passes this to `lhci autorun --config=<path>`. LHCI then reads the config and passes the `settings` object as Lighthouse CLI flags.

The flow is:
1. Action reads `configPath` input
2. Action invokes `lhci autorun --config=./lighthouserc.json`
3. LHCI reads `ci.collect.settings` and passes each key as a Lighthouse CLI flag
4. Lighthouse receives `--chrome-flags="--no-sandbox --disable-gpu"` and launches Chrome accordingly

When `chromeFlags` is at the `ci.collect` level (outside `settings`), LHCI treats it as a collect-level configuration option. However, `chromeFlags` is NOT a valid collect-level option -- it is a Lighthouse CLI flag that must be inside `settings`.

### 2. Does the Action Properly Pass chromeFlags?

Yes, the action properly passes chromeFlags **when they are correctly placed inside `ci.collect.settings`**. The action itself does not process chromeFlags -- it delegates entirely to LHCI, which delegates to Lighthouse. The chain works correctly when the config structure is right.

### 3. Is There a Known Issue Where chromeFlags Are Ignored?

This is not a bug in the action. It is a configuration structure issue. The `chromeFlags` key at `ci.collect` level is simply **silently ignored** because it is not a recognized collect-level configuration option. LHCI does not warn about unrecognized keys.

Valid collect-level options include: `url`, `staticDistDir`, `startServerCommand`, `numberOfRuns`, `settings`, `chromePath`, `puppeteerScript`, `additive`, etc. `chromeFlags` is NOT one of them.

### 4. Correct Way to Pass --no-sandbox

**Option A: Fix lighthouserc.json (recommended)**

Move `chromeFlags` inside `settings`:

```json
{
  "ci": {
    "collect": {
      "url": [...],
      "numberOfRuns": 3,
      "settings": {
        "chromeFlags": "--no-sandbox --disable-gpu",
        "preset": "desktop",
        "throttling": {
          "cpuSlowdownMultiplier": 1
        }
      }
    }
  }
}
```

**Option B: Pass via CLI (as a belt-and-suspenders approach)**

In the workflow, add chromeFlags to the lhci command directly:

```yaml
- name: Run Lighthouse CI
  run: |
    lhci autorun --config=lighthouserc.json \
      --collect.settings.chromeFlags="--no-sandbox --disable-gpu"
```

**Option C: Use CHROME_FLAGS environment variable**

Note: This does NOT work with LHCI. The `CHROME_FLAGS` environment variable set in `pr-validation.yml` is not read by Lighthouse or LHCI. It is only a convention for some other tools.

### Additional Recommended Flags for CI Environments

From the treosh/lighthouse-ci-action README example, the recommended flags for CI are:

```
--disable-gpu --no-sandbox --no-zygote
```

- `--no-sandbox`: Required on most CI runners where Chrome runs as root or in containers
- `--disable-gpu`: Prevents GPU-related issues in headless environments
- `--no-zygote`: Avoids forking issues in constrained environments (containers, CI)

Also consider adding `--disable-dev-shm-usage` which tells Chrome to use /tmp instead of /dev/shm (which may be too small in containers).

## Project-Specific Analysis

### File: `/home/msmith/projects/2025slideheroes/lighthouserc.json`
- **Bug**: `chromeFlags` at line 11 is at `ci.collect` level, not inside `settings`
- **Fix**: Move to `ci.collect.settings.chromeFlags`

### File: `/home/msmith/projects/2025slideheroes/.github/workflows/dev-integration-tests.yml`
- Lines 463-472: Uses `treosh/lighthouse-ci-action@v12` with `configPath: ./lighthouserc.json`
- Since the config has chromeFlags at the wrong level, Chrome launches WITHOUT --no-sandbox
- This causes the sandbox permission denied crash

### File: `/home/msmith/projects/2025slideheroes/.github/workflows/pr-validation.yml`
- Line 389: Sets `CHROME_FLAGS` env var, but this is NOT read by LHCI
- This is a false sense of security -- the env var does nothing for Lighthouse

### File: `/home/msmith/projects/2025slideheroes/.github/workflows/lighthouse-ci.yml`
- Lines 50-101: Creates `lighthouserc.remote.json` dynamically but does NOT include chromeFlags at all
- This will also crash on runners that need --no-sandbox

## Key Takeaways

1. **Root cause**: `chromeFlags` is at `ci.collect.chromeFlags` but must be at `ci.collect.settings.chromeFlags`
2. **Silent failure**: LHCI does not warn about unrecognized keys at the collect level
3. **The action itself is fine**: `treosh/lighthouse-ci-action@v12` correctly delegates to LHCI
4. **CHROME_FLAGS env var is inert**: The env var in pr-validation.yml has no effect on LHCI/Lighthouse
5. **Three files need fixing**: lighthouserc.json, dev-integration-tests workflow (indirectly via config), and lighthouse-ci.yml (missing chromeFlags entirely)

## Sources
- treosh/lighthouse-ci-action via Context7 (treosh/lighthouse-ci-action) - README.md
- Google Chrome Lighthouse CI via Context7 (googlechrome/lighthouse-ci) - configuration.md, getting-started.md
- Google Chrome Lighthouse via Context7 (googlechrome/lighthouse) - readme.md, headless-chrome.md
