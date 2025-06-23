# Cloudflare Workers Bindings MCP Server

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server that supports remote MCP connections, with Cloudflare OAuth built-in.

It integrates tools for managing resources in the Cloudflare Workers Platform, which you can connect to your Worker via [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/).

## 🔨 Available Tools

Currently available tools include management capabilities for:

- Accounts
- KV Namespaces
- Workers
- R2 Buckets
- D1 Databases
- Hyperdrive Configurations

### Prompt Examples

The README provides numerous example prompts like:

- "List my Cloudflare accounts"
- "Create a new KV namespace called 'my-kv-store'"
- "List my Cloudflare Workers"
- "Create an R2 bucket named 'my-new-bucket'"

## Access the remote MCP server from any MCP Client

Users can access the server via:

- Direct URL support in compatible clients
- Configuration using [mcp-remote](https://www.npmjs.com/package/mcp-remote)

The README includes a JSON configuration example for setting up the Cloudflare MCP server.

Interested contributors can refer to the CONTRIBUTING.md file for local setup instructions.
