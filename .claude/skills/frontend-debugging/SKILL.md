---
name: frontend-debugging
description: Debug front-end issues including rendering bugs, performance problems, network failures, and client-side errors. This skill should be used when investigating React/Next.js components, CSS styling problems, console errors, hydration mismatches, or Core Web Vitals issues. Leverages Playwright for browser automation and Lighthouse for performance audits.
allowed-tools: Bash, Read, Grep, Glob
---

# Frontend Debugging

Systematic front-end debugging using Playwright for browser automation, Lighthouse for performance audits, and structured workflows for common issues.

## When to Use This Skill

- Investigating rendering issues or visual bugs
- Analyzing performance bottlenecks (LCP, CLS, TBT)
- Debugging client-side errors or console warnings
- Inspecting network requests or API failures
- Testing responsive design or browser compatibility
- Diagnosing hydration mismatches in SSR/RSC apps
- Troubleshooting CSS specificity conflicts

## Quick Start

### Visual Debugging (Screenshots)

```bash
# Full-page screenshot
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 \
  --screenshot /tmp/debug.png

# Screenshot with console and network capture
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 \
  --screenshot /tmp/debug.png \
  --console-logs \
  --network
```

### Console Error Capture

```bash
# Capture all console output
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 \
  --console-logs
```

### Performance Audit

```bash
# Run Lighthouse with Core Web Vitals summary
.claude/skills/frontend-debugging/scripts/lighthouse_audit.sh \
  http://localhost:3000 \
  --summary
```

### Full Debug Capture

```bash
# Complete debug data as JSON
python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
  http://localhost:3000 \
  --screenshot /tmp/page.png \
  --console-logs \
  --network \
  --output /tmp/debug.json
```

## Debugging Workflows

### 1. Visual Bug Investigation

When a user reports a rendering issue:

1. **Capture the current state**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3000/affected-page \
     --screenshot /tmp/before.png \
     --console-logs
   ```

2. **Inspect the component HTML**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3000/affected-page \
     --selector ".problematic-component" \
     --dump-html /tmp/component.html
   ```

3. **Find the component source**
   ```bash
   rg -l "problematic-component" apps/web/app
   ```

4. **Check for CSS issues**
   ```bash
   rg "problematic-component" -A 5 -B 5 apps/web/app --glob "*.css"
   rg "problematic-component" -A 5 -B 5 apps/web/app --glob "*.tsx"
   ```

### 2. Console Error Debugging

When investigating JavaScript errors:

1. **Capture console output**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3000 \
     --console-logs \
     --output /tmp/console-debug.json
   ```

2. **Review the JSON output** for:
   - Error messages and stack traces
   - Warning messages (React warnings, deprecations)
   - Failed network requests logged to console

3. **Search for error source**
   ```bash
   rg "ErrorMessage" apps/web/app --type ts --type tsx
   ```

### 3. Performance Investigation

When diagnosing slow page loads:

1. **Run Lighthouse audit**
   ```bash
   .claude/skills/frontend-debugging/scripts/lighthouse_audit.sh \
     http://localhost:3000 \
     --categories performance \
     --summary
   ```

2. **Analyze network waterfall**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3000 \
     --network \
     --output /tmp/network.json
   ```

3. **Review bundle size** (if applicable)
   ```bash
   pnpm --filter web analyze
   ```

4. **Check for common issues**:
   - Large JavaScript bundles
   - Unoptimized images
   - Render-blocking resources
   - Excessive re-renders

### 4. Network Request Debugging

When API calls fail or behave unexpectedly:

1. **Capture all network traffic**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3000 \
     --network
   ```

2. **Look for**:
   - 4xx/5xx status codes
   - CORS errors
   - Slow responses (timing data)
   - Missing requests

3. **Check API routes**
   ```bash
   rg "api/endpoint-name" apps/web/app
   ```

### 5. Hydration Mismatch Debugging

For SSR/RSC hydration errors in Next.js:

1. **Capture console for hydration warnings**
   ```bash
   python3 .claude/skills/frontend-debugging/scripts/playwright_inspect.py \
     http://localhost:3000 \
     --console-logs 2>&1 | grep -i "hydrat"
   ```

2. **Common causes**:
   - Date/time rendering differences
   - Browser-only APIs used during SSR
   - Conditional rendering based on `window`
   - Extension-injected content

3. **Fix pattern**:
   ```typescript
   // Use useEffect for browser-only rendering
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return null;
   ```

## Script Reference

### playwright_inspect.py

Captures screenshots, DOM, console logs, and network requests.

| Option | Description |
|--------|-------------|
| `--screenshot <path>` | Save full-page screenshot |
| `--dump-html <path>` | Save page HTML |
| `--selector <css>` | Target specific element |
| `--console-logs` | Capture console output |
| `--network` | Capture network requests |
| `--output <path>` | Save all data as JSON |
| `--viewport <WxH>` | Set viewport (default: 1920x1080) |
| `--wait <ms>` | Wait after load (default: 2000) |
| `--headed` | Show browser window |

### lighthouse_audit.sh

Runs Lighthouse performance and accessibility audits.

| Option | Description |
|--------|-------------|
| `--output-dir <dir>` | Output directory (default: /tmp/lighthouse) |
| `--categories <list>` | Categories: performance,accessibility,best-practices,seo |
| `--format <type>` | Output: json, html, both |
| `--quick` | Fast mode with reduced accuracy |
| `--summary` | Print Core Web Vitals to stdout |

## Existing Project Resources

This project has existing Playwright E2E infrastructure:

- **Playwright config**: `apps/e2e/playwright.config.ts`
- **Playwright docs**: `.ai/ai_docs/tool-docs/playwright.md`
- **E2E tests**: `apps/e2e/tests/`

### Using Project E2E Commands

```bash
# Run E2E with trace capture
pnpm --filter web-e2e playwright test --trace on

# View trace file
pnpm --filter web-e2e playwright show-trace trace.zip

# Interactive UI mode
pnpm --filter web-e2e playwright test --ui

# Debug mode with Inspector
pnpm --filter web-e2e playwright test --debug

# Generate test by recording
npx playwright codegen http://localhost:3000
```

## Common Issues Reference

For detailed troubleshooting patterns, see: `references/debugging-checklist.md`

Quick reference for common issues:

| Issue | First Check | Tool |
|-------|-------------|------|
| Blank page | Console errors | `--console-logs` |
| Slow load | Core Web Vitals | `lighthouse_audit.sh --summary` |
| Layout broken | CSS classes | `--dump-html` + grep |
| API errors | Network status | `--network` |
| Hydration error | Console warnings | `--console-logs` |
| Wrong data | Network payloads | `--network --output` |
