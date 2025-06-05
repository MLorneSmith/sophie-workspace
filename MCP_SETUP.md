# MCP Server Setup for Claude Code

## Initial Setup

1. Copy the example configuration:
   ```bash
   cp .mcp.example.json .mcp.json
   ```

2. Replace the placeholder tokens in `.mcp.json` with your actual API keys:
   - `YOUR_EXA_API_KEY`: Get from [Exa](https://exa.ai)
   - `YOUR_PERPLEXITY_API_KEY`: Get from [Perplexity](https://perplexity.ai)
   - `YOUR_SUPABASE_ACCESS_TOKEN`: Get from [Supabase Dashboard](https://app.supabase.com)
   - `YOUR_GITHUB_TOKEN_HERE`: Create at [GitHub Settings](https://github.com/settings/tokens)
   - `YOUR_SUBDOMAIN`: Replace with your Cloudflare Workers subdomain
   - `YOUR_PLAYWRIGHT_MCP_TOKEN`: Generate a secure token for Playwright MCP authentication

3. For Playwright MCP server, first deploy the worker:
   ```bash
   cd packages/playwright-mcp
   pnpm install
   pnpm build
   pnpm deploy
   ```

4. Restart Claude Code to load the MCP servers

## Playwright MCP Setup

The Playwright MCP server provides browser automation capabilities for testing SlideHeroes functionality:

### Features
- Navigate to SlideHeroes pages (Canvas, Storyboard, Lessons)
- Fill forms and interact with UI elements
- Take screenshots and capture console errors
- Verify page elements and functionality
- Run automated test workflows

### Configuration
1. Deploy the worker to Cloudflare Workers
2. Update `.mcp.json` with your worker URL and authentication token
3. The server will be available as `mcp__cloudflare-playwright__*` tools in Claude Code

### Available Tools
- `browser_navigate`: Navigate to specific pages
- `browser_take_screenshot`: Capture page screenshots
- `browser_fill_form`: Fill and submit forms
- `browser_verify_elements`: Check if elements exist
- `browser_console_messages`: Get console logs and errors

## Security Note

The `.mcp.json` file contains sensitive API tokens and is ignored by Git. Never commit this file to version control.