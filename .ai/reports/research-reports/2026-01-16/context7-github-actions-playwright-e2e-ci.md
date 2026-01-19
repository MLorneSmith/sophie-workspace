# Context7 Research: GitHub Actions + Playwright E2E Testing Best Practices

**Date**: 2026-01-16
**Agent**: context7-expert
**Libraries Researched**: microsoft/playwright, actions/cache, websites/github_en_actions

## Query Summary

Research on GitHub Actions best practices for running Playwright E2E tests in CI/CD workflows, focusing on:
1. Web server startup strategies
2. Sharded/parallel test execution
3. Job architecture (separate vs combined jobs)
4. Build artifact caching between jobs
5. Matrix strategies for test sharding

## Findings

### 1. Web Server Startup for E2E Tests

**Playwright's Built-in webServer Configuration (Recommended)**

Playwright provides a `webServer` configuration option that automatically starts your dev server before tests run. This is the recommended approach for CI/CD.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,  // Always start fresh in CI
    stdout: 'ignore',
    stderr: 'pipe',
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

**Key Points:**
- `reuseExistingServer: !process.env.CI` - Always starts a fresh server in CI, but reuses existing servers locally
- `timeout: 120 * 1000` - 2-minute timeout for server to start
- `stdout: 'ignore'` / `stderr: 'pipe'` - Control output verbosity
- Server starts automatically before tests and shuts down after

**Multiple Web Servers (Frontend + Backend)**

```typescript
export default defineConfig({
  webServer: [
    {
      command: 'npm run start',
      url: 'http://localhost:3000',
      name: 'Frontend',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run backend',
      url: 'http://localhost:3333',
      name: 'Backend',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    }
  ],
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

### 2. Sharded/Parallel E2E Test Execution

**Recommended Architecture: Matrix Strategy with Blob Reports**

The official Playwright recommendation for sharded E2E tests in GitHub Actions uses a matrix strategy with blob reports that are merged after all shards complete.

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  playwright-tests:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright browsers
      run: npx playwright install --with-deps

    - name: Run Playwright tests
      run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}

    - name: Upload blob report to GitHub Actions Artifacts
      if: ${{ !cancelled() }}
      uses: actions/upload-artifact@v4
      with:
        name: blob-report-${{ matrix.shardIndex }}
        path: blob-report
        retention-days: 1

  merge-reports:
    if: ${{ !cancelled() }}
    needs: [playwright-tests]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci

    - name: Download blob reports from GitHub Actions Artifacts
      uses: actions/download-artifact@v5
      with:
        path: all-blob-reports
        pattern: blob-report-*
        merge-multiple: true

    - name: Merge into HTML Report
      run: npx playwright merge-reports --reporter html ./all-blob-reports

    - name: Upload HTML report
      uses: actions/upload-artifact@v4
      with:
        name: html-report--attempt-${{ github.run_attempt }}
        path: playwright-report
        retention-days: 14
```

**Playwright Configuration for Blob Reports**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  reporter: process.env.CI ? 'blob' : 'html',
});
```

**Key Points:**
- `fail-fast: false` - Continue running other shards even if one fails
- `if: ${{ !cancelled() }}` - Upload reports even on failure
- Blob reports contain all test results and attachments (traces, screenshots)
- Merge job runs after ALL shards complete, even if some fail

### 3. Job Architecture: Same Job vs Separate Jobs

**Recommendation: Same Job (Playwright handles webserver)**

The Playwright documentation and examples consistently show the webserver being started within the same job as the tests, using Playwright's built-in webServer configuration.

**Why Same Job is Preferred:**
1. Playwright's webServer config handles it automatically
2. Simpler workflow - Fewer jobs to manage
3. No artifact passing - Build artifacts stay local to the job
4. Automatic cleanup - Server stops when tests complete

**When to Consider Separate Jobs:**
1. Build is very expensive - Long build times that should be shared across shards
2. Docker container builds - When you need to build and push a container first
3. Complex service orchestration - Multiple services with complex startup dependencies

**Separate Job Pattern (if needed)**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Build application
      run: npm run build
    - name: Upload build artifact
      uses: actions/upload-artifact@v4
      with:
        name: build
        path: .next/
        retention-days: 1

  test:
    needs: build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v5
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Download build artifact
      uses: actions/download-artifact@v5
      with:
        name: build
        path: .next/
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

### 4. Caching Build Artifacts Between Jobs

**Using actions/cache for Dependencies**

```yaml
- uses: actions/cache@v4
  id: cache
  with:
    path: |
      node_modules
      ~/.cache/ms-playwright
    key: ${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-

- name: Install dependencies
  if: steps.cache.outputs.cache-hit != 'true'
  run: pnpm install

- name: Install Playwright browsers
  if: steps.cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps
```

**Using actions/upload-artifact for Build Outputs**

```yaml
# In build job
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: |
      .next/
      !.next/cache/
    retention-days: 1

# In test job
- uses: actions/download-artifact@v5
  with:
    name: build-output
    path: .next/
```

**Key Differences:**
- **cache**: Shared across workflow runs, keyed by hash (dependencies)
- **artifacts**: Specific to workflow run, passed between jobs (build outputs)

### 5. Matrix Strategies for Test Sharding

**Basic Sharding Matrix**

```yaml
strategy:
  fail-fast: false
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
```

**Multi-Browser + Sharding Matrix**

```yaml
strategy:
  fail-fast: false
  matrix:
    project: ['chromium', 'firefox', 'webkit']
    shardIndex: [1, 2, 3]
    shardTotal: [3]
steps:
  - run: npx playwright test --project=${{ matrix.project }} --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

**Controlling Parallelism**

```yaml
strategy:
  max-parallel: 2  # Limit concurrent jobs
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]
```

## Key Takeaways

1. **Use Playwright's webServer config** - Let Playwright manage your dev server automatically with `reuseExistingServer: !process.env.CI`

2. **Same job for server + tests** - Keep the web server and tests in the same job; Playwright's webServer config handles this elegantly

3. **Matrix strategy for sharding** - Use `shardIndex` and `shardTotal` arrays with `fail-fast: false`

4. **Blob reporter for sharded tests** - Configure `reporter: process.env.CI ? 'blob' : 'html'` and merge reports in a separate job

5. **Cache dependencies, artifact builds** - Use `actions/cache` for node_modules and Playwright browsers; use `actions/upload-artifact` for build outputs

6. **Always upload on non-cancel** - Use `if: ${{ !cancelled() }}` to ensure reports are uploaded even on test failure

7. **Merge job depends on test job** - Use `needs: [playwright-tests]` with `if: ${{ !cancelled() }}` to run even if shards fail

## Sources

- microsoft/playwright via Context7 (CI docs, test-sharding-js, test-webserver-js)
- actions/cache via Context7 (caching strategies, examples)
- websites/github_en_actions via Context7 (matrix strategy, artifacts)