# Perplexity Research: PostHog MCP Server

**Date**: 2026-01-28
**Agent**: perplexity-expert
**Search Type**: Search API & Chat API

## Query Summary

Researched PostHog's Model Context Protocol (MCP) server implementation, including official npm packages, installation instructions, configuration requirements, available tools, and documentation URLs. Also investigated community alternatives and integration options.

## Findings

### 1. Official PostHog MCP Server - YES, Exists

PostHog has an **official MCP server** that is maintained and hosted by PostHog.

**GitHub Repository**: https://github.com/PostHog/mcp
**Official Documentation**: https://posthog.com/docs/model-context-protocol

### 2. Installation Methods

#### Method A: Quick Install via PostHog Wizard (Recommended)

```bash
npx @posthog/wizard@latest mcp add
```

The wizard automatically installs the MCP server into:
- Cursor
- Claude Code
- Claude Desktop
- VS Code
- Zed

#### Method B: Manual Remote Installation (Cloudflare Workers)

The PostHog MCP server is hosted as a Cloudflare Worker and can be accessed via `mcp-remote`:

```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/mcp",
        "--header",
        "Authorization:${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```

**Alternative for SSE (Server-Sent Events) transport**:
Replace `https://mcp.posthog.com/mcp` with `https://mcp.posthog.com/sse` if your client does not support Streamable HTTP.

#### Method C: Local Development

To run the MCP server locally:

```bash
# Clone the repository
git clone https://github.com/PostHog/mcp.git
cd mcp

# Install dependencies (uses pnpm)
pnpm install

# Run development server (runs on port 8787)
pnpm run dev
```

Then use `http://localhost:8787/mcp` in your configuration instead of the remote URL.

### 3. NPM Package Details

**Important**: PostHog does NOT publish a standalone `@posthog/mcp-server` npm package. Instead:

- **Wizard package**: `@posthog/wizard` - Used for automatic installation
- **Remote client**: `mcp-remote@latest` - Used to connect to hosted PostHog MCP endpoint

The server is deployed as a Cloudflare Worker, not as a traditional npm package.

### 4. Configuration Requirements

#### Authentication

**Personal API Key** required with the **"MCP Server" preset** (this scopes access to a specific project):

1. Log in to PostHog
2. Navigate to Settings
3. Create a Personal API Key using the **"MCP Server" preset**

#### Environment Variables

For self-hosted or local development:

| Variable | Description | Example |
|----------|-------------|----------|
| `POSTHOG_AUTH_HEADER` | Authorization header (Bearer token) | `Bearer phc_xxx...` |
| `POSTHOG_BASE_URL` | Custom PostHog instance URL (optional) | `https://posthog.example.com` |
| `INKEEP_API_KEY` | For docs-search tool (optional) | (from Inkeep) |

#### EU Cloud Users

If using PostHog EU Cloud, use:
- URL: `https://mcp-eu.posthog.com/mcp`
- Or for SSE: `https://mcp-eu.posthog.com/sse`

### 5. Configuration Examples by Client

#### Claude Desktop / Claude Code

**Config file location**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration**:
```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/mcp",
        "--header",
        "Authorization:${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```

#### Cursor

**Config file**: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/sse",
        "--header",
        "Authorization:${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```

#### VS Code

Run in command palette: `MCP: Open User Configuration`

Add to `mcp.json`:
```json
{
  "mcpServers": {
    "posthog": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://mcp.posthog.com/mcp",
        "--header",
        "Authorization:${POSTHOG_AUTH_HEADER}"
      ],
      "env": {
        "POSTHOG_AUTH_HEADER": "Bearer {INSERT_YOUR_PERSONAL_API_KEY_HERE}"
      }
    }
  }
}
```

### 6. Available Tools and Capabilities (27+ Tools)

The PostHog MCP server provides **27+ tools** across **7 categories**:

#### Actions (5 tools)
- `action-create` - Create a new action in the project
- `action-delete` - Delete an action by ID
- `action-get` - Get a specific action by ID
- `action-update` - Update an existing action
- `actions-get-all` - Get all actions in the project

#### Dashboards (7 tools)
- `add-insight-to-dashboard` - Add an existing insight to a dashboard
- `dashboard-create` - Create a new dashboard in the project
- `dashboard-delete` - Delete a dashboard by ID
- `dashboard-get` - Get a specific dashboard by ID, including insights
- `dashboard-reorder-tiles` - Reorder tiles on a dashboard
- `dashboard-update` - Update an existing dashboard by ID
- `dashboards-get-all` - Get all dashboards with optional filtering

#### Documentation (1 tool)
- `docs-search` - Search the PostHog documentation for information

#### Error Tracking (2 tools)
- `error-details` - Get the details of an error in the project
- `list-errors` - List errors in the project

#### Events & Properties (2 tools)
- `event-definitions-list` - List all event definitions with optional filtering
- `properties-list` - Get properties for events or persons

#### Experiments (6 tools)
- `experiment-create` - Create A/B test experiment with guided metric setup
- `experiment-delete` - Delete an experiment by ID
- `experiment-get` - Get details of a specific experiment
- `experiment-get-all` - Get all experiments in the project
- `experiment-results-get` - Get comprehensive experiment results
- `experiment-update` - Update an existing experiment

#### Feature Flags (5 tools)
- `create-feature-flag` - Creates a new feature flag in the project
- `delete-feature-flag` - Delete a feature flag in the project
- `feature-flag-get-all` - Get all feature flags in the project
- `feature-flag-get-definition` - Get the definition of a feature flag
- `update-feature-flag` - Update a feature flag in the project

#### Insights & Analytics (8 tools)
- `insight-create-from-query` - Save a query as an insight
- `insight-delete` - Delete an insight by ID
- `insight-get` - Get a specific insight by ID
- `insight-query` - Execute a query on an existing insight
- `insight-update` - Update an existing insight by ID
- `insights-get-all` - Get all insights with optional filtering
- `query-generate-hogql-from-question` - Query PostHog data using natural language
- `query-run` - Run a trend, funnel or HogQL query

#### LLM Analytics (1 tool)
- `get-llm-total-costs-for-project` - Fetch LLM daily costs per model

#### Logs (3 tools)
- `logs-list-attribute-values` - Get values for a log attribute
- `logs-list-attributes` - List available log attributes
- `logs-query` - Search and query logs in the project

#### Organization & Project Management (7 tools)
- `organization-details-get` - Get the details of the active organization
- `organizations-get` - Get the organizations the user has access to
- `projects-get` - Fetch projects accessible in current organization
- `property-definitions` - Get event and property definitions
- `switch-organization` - Change the active organization
- `switch-project` - Change the active project
- `entity-search` - Search for entities by name or description

#### Surveys (7 tools)
- `survey-create` - Creates a new survey in the project
- `survey-delete` - Delete a survey by ID
- `survey-get` - Get a specific survey by ID
- `survey-stats` - Get response statistics for a survey
- `survey-update` - Update an existing survey by ID
- `surveys-get-all` - Get all surveys with optional filtering
- `surveys-global-stats` - Get aggregated response statistics

### 7. Example Prompts

```
"What feature flags do I have active?"
"Add a new feature flag for our homepage redesign"
"What are my most common errors?"
"How many unique users signed up in the last 7 days?"
"Create a feature flag called 'new-checkout-flow' that's enabled for 20% of users"
"Create an A/B test for our pricing page that measures conversion to checkout"
```

### 8. Documentation URLs

| Resource | URL |
|----------|-----|
| Official Documentation | https://posthog.com/docs/model-context-protocol |
| GitHub Repository | https://github.com/PostHog/mcp |
| Wizard NPM Package | https://www.npmjs.com/package/@posthog/wizard |
| Awesome MCP Servers Listing | https://mcpservers.org/servers/PostHog/mcp |
| Pulse MCP Directory | https://www.pulsemcp.com/servers/posthog |
| LobeHub MCP Directory | https://lobehub.com/mcp/posthog-mcp |

### 9. Important Limitations & Notes

#### Data Residency
- The MCP server is hosted on a Cloudflare Worker
- Data may be processed outside of EU/US regions
- No guarantee that data stays within specific regions

#### EU Cloud
- Official hosted endpoint does NOT work with EU Cloud out of the box
- EU users must use `https://mcp-eu.posthog.com/mcp` or self-host

#### Security Considerations
- Be mindful of prompt injection - LLMs can be tricked into following untrusted commands
- Always review tool calls before executing them
- The "MCP Server" preset for API keys scopes access appropriately

#### Self-Hosted Instances
- For self-hosted PostHog, set `POSTHOG_BASE_URL` environment variable
- Example: `POSTHOG_BASE_URL=https://posthog.example.com`

### 10. Alternative / Community Implementations

#### Arcade PosthogApi MCP Server
- URL: https://docs.arcade.dev/en/mcp-servers/development/posthog-api
- Type: Starter MCP Server (mirrors HTTP endpoints)
- Auth: API Key
- Configuration secrets: `POSTHOG_SERVER_URL`, `POSTHOG_PERSONAL_API_KEY`

#### Composio Posthog Integration
- URL: https://mcp.composio.dev/posthog
- Provides 20+ action tools
- Auth: personalapikeyauth

#### Pipedream PostHog MCP
- URL: https://mcp.pipedream.com/app/posthog
- Managed MCP service via Pipedream

### 11. Self-Hosting on Cloudflare Workers

For custom deployment:

1. Clone the PostHog MCP repository
2. Deploy to Cloudflare Workers using their deploy button
3. Add your Personal API Key as an environment variable
4. Use your custom Cloudflare URL in the MCP configuration

Free tier: 100,000 requests/day (generous for most use cases)

## Sources & Citations

1. PostHog/MCP GitHub Repository - https://github.com/PostHog/mcp
2. PostHog Model Context Protocol Documentation - https://posthog.com/docs/model-context-protocol
3. @posthog/wizard NPM Package - https://www.npmjs.com/package/@posthog/wizard
4. Awesome MCP Servers - https://mcpservers.org/servers/PostHog/mcp
5. Pulse MCP Directory - https://www.pulsemcp.com/servers/posthog
6. LobeHub MCP Directory - https://lobehub.com/mcp/posthog-mcp
7. Composio Posthog Integration - https://mcp.composio.dev/posthog
8. Arcade PosthogApi MCP Server - https://docs.arcade.dev/en/mcp-servers/development/posthog-api
9. Pipedream PostHog MCP - https://mcp.pipedream.com/app/posthog
10. Skywork AI Guide - https://skywork.ai/skypage/en/mastering-model-context-ai-engineer-guide-posthog-mcp-server/

## Key Takeaways

1. **PostHog has an official MCP server** hosted on Cloudflare Workers
2. **No standalone npm package** - use `mcp-remote@latest` to connect to hosted endpoint
3. **Quick install available** via `npx @posthog/wizard@latest mcp add`
4. **27+ tools** across 7 categories (feature flags, insights, dashboards, experiments, etc.)
5. **Personal API Key** required with "MCP Server" preset
6. **EU Cloud users** need to use different endpoint or self-host
7. **Local development** possible by running `pnpm run dev` on cloned repo
8. **Configuration** varies by client (Claude, Cursor, VS Code, Zed, Windsurf)
9. **Natural language prompts** enable powerful analytics queries
10. **Data residency** concerns for EU/US due to Cloudflare Worker hosting

## Related Searches

- PostHog Agent Toolkit (for Vercel AI SDK, LangChain integration)
- MCP Inspector for debugging
- Streamable HTTP vs SSE transport options
- PostHog self-hosting guides
