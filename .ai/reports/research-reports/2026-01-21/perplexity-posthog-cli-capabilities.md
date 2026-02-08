# Perplexity Research: PostHog CLI Capabilities for AI-Driven Development Workflows

**Date**: 2026-01-21
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Comprehensive research on PostHog CLI features, commands, and capabilities for developers, including:
- Core CLI features and commands
- Feature flags management
- CI/CD pipeline integration
- AI-driven development workflows
- Event tracking and debugging in development
- Schema management and TypeScript generation
- Sourcemap upload for error tracking

## Executive Summary

The PostHog CLI is a command-line interface for interacting with PostHog product analytics platform. It enables developers to authenticate, run SQL queries, upload sourcemaps for error tracking, and manage event schemas from the terminal. The CLI is particularly powerful when integrated into CI/CD pipelines and AI-driven development workflows.

---

## 1. Core CLI Features and Commands

### Installation

Install via npm as a global package or use npx for one-off runs:
- npm install -g @posthog/cli
- npx posthog-cli

### Authentication

**Interactive (Local Development):**
Run posthog-cli login for browser-based OAuth authentication that stores a personal API token locally.

**Environment Variables (CI/CD):**

| Variable | Purpose | Example |
|----------|---------|---------|
| POSTHOG_CLI_HOST | PostHog instance host | https://us.posthog.com |
| POSTHOG_CLI_TOKEN | Personal API key | Required for auth |
| POSTHOG_CLI_ENV_ID | Project/environment ID | Numeric ID from project URL |

### Main Commands

| Command | Description | Status |
|---------|-------------|--------|
| login | Interactive browser-based authentication | Stable |
| query | Run SQL queries against PostHog data | Experimental |
| sourcemap | Upload bundled sourcemaps for error tracking | Stable |
| exp schema download | Fetch event schemas, generate typed definitions | Experimental |
| help | Show usage or subcommand help | Stable |

---

## 2. Sourcemap Upload for Error Tracking

The CLI primary production use case is uploading source maps for JavaScript error debugging.

### Workflow

1. **Install the CLI:** npm install -g @posthog/cli

2. **Build with source maps enabled:** Configure your build tool (Vite, webpack, Rollup) to generate source maps.

3. **Inject source map metadata:** posthog-cli sourcemap inject ./dist
   Adds metadata to associate maps with served code.

4. **Upload to PostHog:** posthog-cli sourcemap ./dist
   The --delete-after option cleans up sourcemaps after upload.

### Next.js Integration

Use @posthog/nextjs-config for automatic source map handling in next.config.ts with withPostHogConfig wrapper.

**Required Environment Variables:**
- POSTHOG_ERROR_TRACKING_API_KEY - Personal API key with error tracking write scope
- POSTHOG_PROJECT_ID - Project ID from settings
- NEXT_PUBLIC_POSTHOG_HOST - PostHog instance URL

---

## 3. Schema Management and TypeScript Generation

The experimental schema command enables type-safe event tracking.

### Workflow

Run: posthog-cli exp schema download

**This command:**
1. Fetches event schemas from PostHog
2. Prompts for output file path (e.g., src/lib/posthog-typed.ts)
3. Generates typed definitions
4. Updates posthog.json with schema hash

### Generated TypeScript Benefits

- **Type safety**: Properties validated against schema
- **Autocomplete**: IDE suggests event names and properties
- **Documentation**: Inline types with descriptions
- **Gradual migration**: Standard SDK functionality remains available

### Configuration Files

Commit both to git:
- posthog.json - Schema hash for change detection
- posthog-typed.ts - Generated type definitions

---

## 4. SQL Query Capability

Example: posthog-cli query "SELECT COUNT(*) FROM events WHERE event = 'signup'"

**Note**: This is experimental and subject to change. Useful for:
- Ad-hoc data analysis
- Scripted reporting
- CI/CD validation checks

---

## 5. CI/CD Pipeline Integration

### GitHub Actions Example

```yaml
name: PostHog CI/CD
on:
  push:
    branches: [main]
jobs:
  posthog-tasks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install PostHog CLI
        run: npm i -g @posthog/cli
      
      - name: Upload sourcemaps
        env:
          POSTHOG_CLI_TOKEN: ${{ secrets.POSTHOG_CLI_TOKEN }}
          POSTHOG_CLI_ENV_ID: ${{ secrets.POSTHOG_CLI_ENV_ID }}
        run: |
          posthog-cli sourcemap inject ./dist
          posthog-cli sourcemap ./dist --delete-after
```

### GitLab CI Example

```yaml
stages:
  - deploy

posthog_sourcemaps:
  stage: deploy
  image: node:20
  script:
    - npm i -g @posthog/cli
    - posthog-cli sourcemap inject ./build
    - posthog-cli sourcemap ./build
  variables:
    POSTHOG_CLI_TOKEN: $POSTHOG_CLI_TOKEN
    POSTHOG_CLI_ENV_ID: $POSTHOG_CLI_ENV_ID
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

---

## 6. AI-Driven Development Workflows

### Continuous AI with PostHog MCP

PostHog provides a Model Context Protocol (MCP) integration that enables AI agents to:

1. **Fetch session recordings** for UX analysis
2. **Query analytics data** for pattern identification
3. **Manage feature flags** programmatically
4. **Create GitHub issues** automatically based on findings

### Example: Automated UX Issue Detection

Using Continue CLI with PostHog MCP, you can run automated analysis that:
- Fetches recent session recordings from PostHog API
- Filters for problematic sessions (console errors, long durations)
- Analyzes patterns using AI
- Creates prioritized GitHub issues automatically
- Runs on schedule via GitHub Actions

### Feature Flag Audit Workflow

AI agents can analyze feature flags to identify:
1. Flags that are 100% rolled out and could be removed
2. Flags that have not been updated in 90+ days
3. Flags with complex targeting that might need simplification
4. Experimental flags that should be cleaned up

### PostHog MCP Tools Available

| Tool | Purpose |
|------|---------|
| feature-flag-get-all | Retrieve all feature flags |
| feature-flag-get-definition | Get detailed flag configuration |
| query-run | Run analytics queries |
| insights-get-all | Get insights related to performance |
| switch-project | Change active project |

---

## 7. Development Environment Best Practices

### Separate Projects for Dev/Prod

- Create separate PostHog projects for development and production
- Use environment-specific API keys
- Prevents dev events from polluting production data

### Event Tracking Setup

Initialize PostHog with environment-specific keys, then use:
- posthog.identify() for user identification after login
- posthog.capture() for tracking key events
- posthog.group() for B2B organization-level analytics

### Local Development

For local PostHog development:
- Start services with docker-compose up
- Use DEBUG=1 hogcli start for self-capture enabled apps

---

## 8. Practical Use Cases

### 1. Post-Build Sourcemap Upload
npm run build && posthog-cli sourcemap inject ./dist && posthog-cli sourcemap ./dist

### 2. Schema Sync in CI
posthog-cli exp schema download --output src/lib/posthog-typed.ts
Then check for changes with git diff

### 3. Analytics Validation Before Deploy
posthog-cli query "SELECT COUNT(*) as events FROM events WHERE timestamp > now() - interval '1 day'"

### 4. Feature Flag Rollout (via API/MCP)
Using Continue CLI with PostHog MCP for programmatic flag management

---

## Sources and Citations

1. PostHog CLI npm package: https://www.npmjs.com/package/@posthog/cli
2. PostHog Sourcemap Documentation: https://posthog.com/docs/error-tracking/upload-source-maps/web
3. PostHog Workflows Documentation: https://posthog.com/docs/workflows
4. Continue.dev PostHog Integration Guide: https://docs.continue.dev/guides/posthog-github-continuous-ai
5. PostHog CLI Rust Crate: https://lib.rs/crates/posthog-cli
6. PostHog GitHub Repository: https://github.com/PostHog/posthog.com
7. TurboStarter PostHog Integration: https://www.turbostarter.dev/docs/web/monitoring/posthog

---

## Key Takeaways

1. **Primary CLI Use Cases**: Sourcemap upload and schema management are the most mature features
2. **CI/CD Integration**: Environment variable auth makes pipeline integration straightforward
3. **AI Workflows**: PostHog MCP enables powerful Continuous AI patterns for automated UX analysis
4. **Feature Flags**: While CLI does not have direct feature flag commands, MCP integration fills this gap
5. **TypeScript Support**: Experimental schema command generates type-safe event definitions
6. **Query Capability**: SQL queries are experimental but useful for validation and ad-hoc analysis

---

## Related Searches

- PostHog MCP (Model Context Protocol) setup and configuration
- Continue CLI integration patterns with PostHog
- PostHog feature flag best practices for A/B testing
- PostHog session replay analysis automation
- PostHog data export to data warehouses (BigQuery, Snowflake)
