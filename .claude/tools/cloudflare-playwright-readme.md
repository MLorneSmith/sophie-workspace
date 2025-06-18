# Cloudflare Playwright MCP

[![Deploy to Cloudflare](https://camo.githubusercontent.com/dbfce91befb9e3595169aab72f1307a504559b7acc255ba911a0e170b927c485/68747470733a2f2f6465706c6f792e776f726b6572732e636c6f7564666c6172652e636f6d2f627574746f6e)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/playwright-mcp/tree/main/cloudflare/example)

## Overview

This project leverages Playwright for automated browser testing and integrates with Cloudflare Workers, [Browser Rendering](https://developers.cloudflare.com/browser-rendering/) and [`@cloudflare/playwright`](https://github.com/cloudflare/playwright) for deployment.

## Build and Deploy

Follow these steps to set up and deploy the project:

1. Install dependencies:

```shell
npm ci
```

2. Build:

```shell
cd cloudflare
npm run build
```

3. Deploy to Cloudflare Workers:

```shell
cd cloudflare/example
npx wrangler deploy
```

(The rest of the README continues with detailed sections about using the project with Cloudflare AI Playground, Claude Desktop, VSCode, and comprehensive documentation of tool modes and interactions.)
