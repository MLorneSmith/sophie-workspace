# Exa MCP Server 🔍

[![npm version](https://camo.githubusercontent.com/f464cd2b8c38d1af3f43520ae0a56ac77c2561572bd59ebe2d4807710e854af5/68747470733a2f2f62616467652e667572792e696f2f6a732f6578612d6d63702d7365727665722e737667)](https://www.npmjs.com/package/exa-mcp-server) [![smithery badge](https://camo.githubusercontent.com/1b894cafd9a7d99317b8ea1f6e30f09107aa75b1e64ff092a5a27918910fc228/68747470733a2f2f736d6974686572792e61692f62616467652f657861)](https://smithery.ai/server/exa)

A Model Context Protocol (MCP) server lets AI assistants like Claude use the Exa AI Search API for web searches. This setup allows AI models to get real-time web information in a safe and controlled way.

## Remote Exa MCP 🌐

Connect directly to Exa's hosted MCP server (instead of running it locally).

### Remote Exa MCP URL

```
https://mcp.exa.ai/mcp?exaApiKey=your-exa-api-key
```

Replace `your-api-key-here` with your actual Exa API key from [dashboard.exa.ai/api-keys](https://dashboard.exa.ai/api-keys).

### Claude Desktop Configuration for Remote MCP

Add this to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.exa.ai/mcp?exaApiKey=your-exa-api-key"
      ]
    }
  }
}
```