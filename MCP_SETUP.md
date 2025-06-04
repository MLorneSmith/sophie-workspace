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

3. Restart Claude Code to load the MCP servers

## Security Note

The `.mcp.json` file contains sensitive API tokens and is ignored by Git. Never commit this file to version control.