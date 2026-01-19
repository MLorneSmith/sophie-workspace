# Context7 Research: Playwright webServer Configuration

**Date**: 2026-01-16
**Agent**: context7-expert
**Libraries Researched**: microsoft/playwright

## Query Summary

Searched for Playwright documentation on configuring the webServer property, specifically:
1. How to configure multiple web servers (array support)
2. How to conditionally start different servers for different projects
3. Best practices for CI environments

## Findings

### 1. Multiple Web Servers (Array Support)

**Yes, webServer can be an array.** Playwright supports launching multiple web servers simultaneously by providing an array of configurations.

### 2. webServer Configuration Options

Each webServer object supports these properties:

| Property | Type | Description |
|----------|------|-------------|
| command | string | Command to start the server |
| url | string | URL to wait for before running tests |
| name | string | Optional name for the server (useful in logs) |
| timeout | number | How long to wait for server startup (ms) |
| reuseExistingServer | boolean | Reuse existing server if already running |
| stdout | pipe or ignore | How to handle stdout |
| stderr | pipe or ignore | How to handle stderr |
| wait | object | Wait for stdout regex pattern |

### 3. CI Environment Best Practices

The recommended pattern: `reuseExistingServer: !CI_ENV`
- Local development: true - Reuse existing server
- CI environment: false - Always start fresh server

### 4. Key Limitation

The webServer property is GLOBAL to the config, not per-project. All webServers start before any tests run.

## Sources

- Playwright via Context7 (microsoft/playwright)
  - docs/src/test-webserver-js.md
  - docs/src/test-api/class-testconfig.md
  - docs/src/test-projects-js.md
