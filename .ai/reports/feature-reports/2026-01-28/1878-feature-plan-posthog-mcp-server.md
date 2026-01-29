# Feature: Install PostHog MCP Server for Claude Code

## Feature Description
Install the official PostHog Model Context Protocol (MCP) server to enable Claude Code agents to interact with PostHog's analytics, feature flags, error tracking, experiments, and insights. This integration will allow developers to query analytics data, manage feature flags, investigate errors, and access PostHog dashboards directly through Claude Code without leaving the development environment.

The PostHog MCP server is hosted as a Cloudflare Worker and provides access to 27+ tools across 7 categories including feature flags, dashboards, insights & analytics, experiments, error tracking, events & properties, and surveys.

## User Story
As a developer working on the SlideHeroes application
I want to query PostHog analytics, manage feature flags, and investigate errors directly through Claude Code
So that I can get insights about user behavior and application health without switching contexts between my code editor and the PostHog dashboard

## Problem Statement
Currently, developers must switch between their code editor and the PostHog web dashboard to:
- View analytics data and insights
- Manage feature flags
- Investigate error tracking events
- Review experiment results
- Check survey responses
- Query event definitions and properties

This context switching disrupts developer workflow and slows down the feedback loop when debugging issues or evaluating feature performance.

## Solution Statement
Install the PostHog MCP server to provide Claude Code agents with direct access to PostHog's capabilities. The server connects via the `mcp-remote` package to PostHog's hosted Cloudflare Worker endpoint at `https://mcp.posthog.com/mcp` (or `https://mcp-eu.posthog.com/mcp` for EU cloud).

The configuration will follow the project's existing MCP server pattern, adding the server to `.mcp.json` and documenting required environment variables in `.env.example`.

## Relevant Files
Use these files to implement the feature:

### Files to Modify
- `.mcp.json` - Add PostHog MCP server configuration
- `.env.example` - Document required PostHog API key variable

### Reference Files
- `.mcp.example.json` - Reference for MCP server configuration patterns
- `.claude/agents/research/docs-mcp-expert.md` - Reference for creating a dedicated PostHog agent (optional)

### New Files
- `.claude/agents/research/posthog-expert.md` - Optional agent definition for PostHog-specific research tasks

## Impact Analysis

### Dependencies Affected
- **mcp-remote@latest** - Required dependency for connecting to PostHog's hosted MCP endpoint
- **PostHog Personal API Key** - Required authentication credential with "MCP Server" preset scope

### Risk Assessment
- **Low Risk**: Well-understood MCP server configuration pattern that follows existing project conventions
- Isolated changes to configuration files only
- No code changes to the application itself
- Safe to enable/disable without affecting production systems

### Backward Compatibility
- Existing features will continue to work
- No breaking changes to the application
- PostHog MCP server is additive only
- Can be easily disabled by removing from `.mcp.json`

### Performance Impact
- **Client**: Minimal - MCP server runs as a separate process
- **Network**: Additional requests to PostHog's Cloudflare Worker endpoint when tools are invoked
- **Caching**: PostHog handles its own caching strategies
- **Bundle size**: No impact (MCP server runs outside the application)

### Security Considerations
- **Authentication**: Requires PostHog Personal API Key with "MCP Server" preset
- **Scope**: API key is scoped to a specific project for least privilege access
- **Prompt Injection**: PostHog MCP docs warn about prompt injection risks - review PostHog's security documentation
- **Data Residency**: Hosted on Cloudflare Worker - data may be processed outside EU/US regions (EU users must use EU endpoint)
- **Secret Management**: API key stored in environment variable, not committed to git (`.env.local` is gitignored)

## Pre-Feature Checklist
Before starting implementation:
- [ ] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/posthog-mcp-server`
- [ ] Review existing MCP server configurations in `.mcp.json` and `.mcp.example.json`
- [ ] Identify PostHog project ID for API key scope
- [ ] Confirm PostHog API key with "MCP Server" preset is available
- [ ] Determine if US or EU PostHog cloud endpoint should be used
- [ ] Verify no duplicate MCP server configurations exist

## Documentation Updates Required
- `.env.example` - Add `POSTHOG_PERSONAL_API_KEY` documentation
- `.mcp.example.json` - Add PostHog MCP server as an example configuration
- `.ai/ai_docs/tool-docs/mcp-configuration.md` - Add PostHog MCP server documentation section

## Rollback Plan
To disable/rollback this feature if issues arise:
1. Remove the PostHog server entry from `.mcp.json`
2. Restart Claude Code (required for MCP configuration reload)
3. Optionally remove `POSTHOG_PERSONAL_API_KEY` from `.env.local`

No database migrations or application code changes are required, making rollback trivial.

## Implementation Plan

### Phase 1: Preparation
Gather required credentials and documentation.

### Phase 2: Configuration
Add PostHog MCP server to project configuration files.

### Phase 3: Optional Agent Creation
Create a dedicated PostHog expert agent (optional, based on usage patterns).

## Step by Step Tasks

### Step 1: Gather PostHog Credentials
- Log in to PostHog dashboard
- Navigate to Settings > Personal API Keys
- Create a new Personal API Key with "MCP Server" preset
- Scope the key to the appropriate project (e.g., SlideHeroes production/staging/dev)
- Copy the generated API key for local configuration

### Step 2: Determine PostHog Cloud Region
- Identify whether PostHog project uses US or EU cloud
- US cloud: `https://mcp.posthog.com/mcp`
- EU cloud: `https://mcp-eu.posthog.com/mcp`

### Step 3: Add PostHog Configuration to .mcp.json
- Add PostHog MCP server configuration to `.mcp.json`:
  ```json
  {
    "mcpServers": {
      "docs-mcp": {
        "command": "npx",
        "args": ["-y", "mcp-remote", "http://localhost:6280/sse"]
      },
      "posthog": {
        "command": "npx",
        "args": [
          "-y",
          "mcp-remote@latest",
          "https://mcp.posthog.com/mcp"
        ],
        "env": {
          "POSTHOG_AUTH_HEADER": "Bearer ${POSTHOG_PERSONAL_API_KEY}"
        }
      }
    }
  }
  ```
- Validate JSON syntax using `jq empty .mcp.json`

### Step 4: Add API Key to .env.local
- Add PostHog personal API key to `.env.local`:
  ```bash
  POSTHOG_PERSONAL_API_KEY=your_actual_api_key_here
  ```
- Ensure `.env.local` is not committed to git (already in `.gitignore`)

### Step 5: Update .env.example
- Add PostHog MCP server documentation to `.env.example`:
  ```bash
  # PostHog MCP Server
  # Create a Personal API Key with "MCP Server" preset at:
  # https://app.posthog.com/settings/personal-api-keys
  POSTHOG_PERSONAL_API_KEY=your_posthog_personal_api_key_here
  ```

### Step 6: Update .mcp.example.json
- Add PostHog MCP server example to `.mcp.example.json`:
  ```json
  "posthog": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote@latest",
      "https://mcp.posthog.com/mcp"
    ],
    "env": {
      "POSTHOG_AUTH_HEADER": "Bearer ${POSTHOG_PERSONAL_API_KEY}"
    }
  }
  ```

### Step 7: Optional - Create PostHog Expert Agent
- If developers frequently use PostHog for analytics, create an agent at `.claude/agents/research/posthog-expert.md`
- Configure agent to use PostHog MCP tools:
  - `mcp__posthog__query-run`
  - `mcp__posthog__feature-flag-get-all`
  - `mcp__posthog__list-errors`
  - `mcp__posthog__experiment-results-get`
  - `mcp__posthog__insight-create-from-query`
  - etc.

### Step 8: Verify Configuration
- Restart Claude Code (required for MCP configuration reload)
- Run `/mcp` command to verify PostHog server is listed
- Test a PostHog MCP tool to verify connectivity

### Step 9: Update MCP Configuration Documentation
- Add PostHog section to `.ai/ai_docs/tool-docs/mcp-configuration.md`:
  - Installation instructions
  - Configuration format
  - Available tools reference
  - Troubleshooting tips

### Step 10: Run Validation Commands
Execute the following to validate the configuration:
- `jq empty .mcp.json` - Validate JSON syntax
- `jq '.mcpServers | keys' .mcp.json` - List configured servers
- Run `/mcp` in Claude Code to verify server is loaded

## Testing Strategy

### Unit Tests
Not applicable - this is a configuration-only feature with no application code changes.

### Integration Tests
Not applicable - MCP server validation is done through Claude Code CLI.

### E2E Tests
Not applicable - MCP server is a development tool, not part of the production application.

### Manual Verification
- Verify PostHog MCP server appears in `/mcp` output
- Test query-run tool to verify API connectivity
- Test feature-flag-get-all to verify data retrieval
- Verify error handling with invalid API key

## Acceptance Criteria
- [ ] PostHog MCP server configuration added to `.mcp.json`
- [ ] `POSTHOG_PERSONAL_API_KEY` documented in `.env.example`
- [ ] PostHog server example added to `.mcp.example.json`
- [ ] PostHog MCP documentation added to `.ai/ai_docs/tool-docs/mcp-configuration.md`
- [ ] PostHog MCP server is accessible via `/mcp` command in Claude Code
- [ ] At least one PostHog MCP tool is successfully invoked
- [ ] JSON configuration is valid (passes `jq empty .mcp.json`)

## Validation Commands
Execute every command to validate the configuration is correct:

- `jq empty .mcp.json && echo "Valid JSON"` - Validate JSON syntax
- `jq '.mcpServers | keys' .mcp.json` - List configured servers
- `jq '.mcpServers.posthog' .mcp.json` - Verify PostHog configuration exists
- `/mcp` - Run in Claude Code to verify server is loaded

## Notes

### PostHog MCP Server Capabilities
The PostHog MCP server provides 27+ tools across 7 categories:

1. **Feature Flags (5 tools)**: `create-feature-flag`, `feature-flag-get-all`, `update-feature-flag`, `delete-feature-flag`, `feature-flag-get-definition`
2. **Dashboards (7 tools)**: `dashboard-create`, `dashboard-get`, `dashboards-get-all`, `add-insight-to-dashboard`
3. **Insights & Analytics (8 tools)**: `insight-create-from-query`, `query-run`, `query-generate-hogql-from-question`, `insights-get-all`
4. **Experiments (6 tools)**: `experiment-create`, `experiment-results-get`, `experiment-update`
5. **Error Tracking (2 tools)**: `list-errors`, `error-details`
6. **Events & Properties (2 tools)**: `event-definitions-list`, `properties-list`
7. **Surveys (7 tools)**: `survey-create`, `survey-stats`, `surveys-get-all`
8. **LLM Analytics (1 tool)**: `get-llm-total-costs-for-project`
9. **Logs (3 tools)**: `logs-query`, `logs-list-attributes`
10. **Org & Project Mgmt (7 tools)**: `projects-get`, `switch-organization`, `organization-details-get`
11. **Documentation (1 tool)**: `docs-search`
12. **Actions (5 tools)**: `action-create`, `action-get`, `actions-get-all`

### Alternative Installation Method
PostHog provides a wizard for automatic installation:
```bash
npx @posthog/wizard@latest mcp add
```
This installs to Claude Desktop, Claude Code, VS Code, Zed, and Cursor simultaneously. However, manual configuration is recommended for version control and consistency across team environments.

### EU Cloud Users
For PostHog EU cloud deployments, use:
```json
{
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote@latest",
    "https://mcp-eu.posthog.com/mcp"
  ]
}
```

### References
- Official Documentation: https://posthog.com/docs/model-context-protocol
- GitHub Repository: https://github.com/PostHog/mcp
- Wizard NPM Package: https://www.npmjs.com/package/@posthog/wizard
